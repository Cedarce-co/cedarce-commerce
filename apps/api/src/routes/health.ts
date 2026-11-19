import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@cedarce/db";

const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (_req, reply) => {
    const sources = await prisma.source.findMany({
      where: { enabled: true },
      select: { key: true, lastRefreshAt: true },
    });
    const now = Date.now();
    const stale = sources
      .filter((s) => !s.lastRefreshAt || now - s.lastRefreshAt.getTime() > STALE_AFTER_MS)
      .map((s) => s.key);
    const ok = stale.length === 0;
    return reply
      .status(ok ? 200 : 503)
      .send({ ok, staleSources: stale, checkedAt: new Date().toISOString() });
  });
};
