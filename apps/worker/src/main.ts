import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import pino from "pino";
import { prisma } from "@cedarce/db";
import { discover } from "./jobs/discover";
import { refresh } from "./jobs/refresh";
import { mirrorImages } from "./jobs/images";
import { refreshFx } from "./jobs/fx";
import { reprice } from "./jobs/reprice";

const log = pino({ level: process.env["LOG_LEVEL"] ?? "info" });
const connection = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const syncQueue = new Queue("sync", { connection });
export const mediaQueue = new Queue("media", { connection });

/** Register repeatable jobs from Source rows (cron strings are editable in admin). */
async function schedule() {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  for (const s of sources) {
    await syncQueue.upsertJobScheduler(
      `discover:${s.key}`,
      { pattern: s.discoverCron },
      { name: "discover", data: { sourceId: s.id } },
    );
    await syncQueue.upsertJobScheduler(
      `refresh:${s.key}`,
      { pattern: s.refreshCron },
      { name: "refresh", data: { sourceId: s.id } },
    );
  }
  await syncQueue.upsertJobScheduler("fx", { pattern: "15 * * * *" }, { name: "fx", data: {} });
  log.info({ sources: sources.map((s) => s.key) }, "schedulers registered");
}

new Worker(
  "sync",
  async (job) => {
    log.info({ job: job.name, data: job.data }, "start");
    switch (job.name) {
      case "discover":
        return discover(job.data.sourceId, { log, mediaQueue });
      case "refresh":
        return refresh(job.data.sourceId, { log });
      case "fx":
        return refreshFx({ log });
      case "reprice":
        return reprice(job.data.vertical, { log });
      default:
        throw new Error(`unknown job ${job.name}`);
    }
  },
  { connection, concurrency: 2 },
).on("failed", (job, err) => log.error({ job: job?.name, err: err.message }, "job failed"));

new Worker("media", async (job) => mirrorImages(job.data.listingId, { log }), {
  connection,
  concurrency: 4,
});

await schedule();
setInterval(() => void schedule(), 10 * 60 * 1000); // pick up cron edits from admin
log.info("worker up");
