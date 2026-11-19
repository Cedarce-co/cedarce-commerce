import type { Logger } from "pino";
import type { Queue } from "bullmq";
import type { SourceAdapterContext } from "@cedarce/sources";
import type { Source } from "@cedarce/db";

export interface JobDeps {
  log: Logger;
  mediaQueue?: Queue;
}

export function adapterContext(source: Source, log: Logger): SourceAdapterContext {
  return {
    config: (source.config as Record<string, unknown>) ?? {},
    env: process.env as Record<string, string | undefined>,
    log: (msg, meta) => log.info({ source: source.key, ...meta }, msg),
  };
}

/** Simple token bucket so refresh never exceeds an adapter's maxRequestsPerMinute. */
export function rateLimiter(perMinute: number) {
  const interval = 60_000 / Math.max(perMinute, 1);
  let next = Date.now();
  return async () => {
    const now = Date.now();
    const wait = Math.max(0, next - now);
    next = Math.max(now, next) + interval;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  };
}
