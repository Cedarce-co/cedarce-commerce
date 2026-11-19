import { prisma } from "@cedarce/db";
import { getAdapter } from "@cedarce/sources";
import { adapterContext, rateLimiter, type JobDeps } from "./context";
import { loadPricing, upsertListing } from "./upsert";

/** Re-check every ACTIVE listing of a source; mark SOLD when the source no longer offers it at Buy Now. */
export async function refresh(sourceId: string, deps: JobDeps) {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  const adapter = getAdapter(source.key);
  const run = await prisma.syncRun.create({ data: { sourceId, kind: "REFRESH" } });
  const stats = { checked: 0, sold: 0, updated: 0, errors: 0 };
  try {
    const rules = await prisma.filterRule.findMany({
      where: { vertical: source.vertical, enabled: true },
    });
    const pricing = await loadPricing();
    const ctx = adapterContext(source, deps.log);
    const limit = rateLimiter(adapter.maxRequestsPerMinute);
    const active = await prisma.listing.findMany({
      where: { sourceId, status: "ACTIVE" },
      select: { id: true, sourceListingId: true },
      orderBy: { lastSeenAt: "asc" },
    });

    for (const l of active) {
      await limit();
      stats.checked++;
      try {
        const raw = await adapter.fetch(l.sourceListingId, ctx);
        if (!raw) {
          await prisma.listing.update({
            where: { id: l.id },
            data: { status: "SOLD", removedAt: new Date() },
          });
          stats.sold++;
          continue;
        }
        const r = await upsertListing(sourceId, raw, rules, pricing);
        if (r.changed) stats.updated++;
      } catch (err) {
        stats.errors++;
        deps.log.warn({ err, id: l.sourceListingId }, "refresh failed");
      }
    }

    await prisma.source.update({ where: { id: sourceId }, data: { lastRefreshAt: new Date() } });
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", finishedAt: new Date(), stats },
    });
  } catch (err) {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), stats, error: String(err) },
    });
    throw err;
  }
  return stats;
}
