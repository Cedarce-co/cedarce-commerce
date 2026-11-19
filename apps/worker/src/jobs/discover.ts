import { prisma } from "@cedarce/db";
import { getAdapter, type SourceQuery } from "@cedarce/sources";
import type { CarFilterCriteria, GadgetFilterCriteria } from "@cedarce/shared";
import { adapterContext, type JobDeps } from "./context";
import { loadPricing, upsertListing } from "./upsert";

const REMOVE_AFTER_MS = 48 * 60 * 60 * 1000;

/** Crawl the source for each enabled INCLUDE rule; upsert; queue image mirroring; retire stale listings. */
export async function discover(sourceId: string, deps: JobDeps) {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  const adapter = getAdapter(source.key);
  const run = await prisma.syncRun.create({ data: { sourceId, kind: "DISCOVER" } });
  const stats = { seen: 0, new: 0, updated: 0, hidden: 0, removed: 0, errors: 0 };
  try {
    const rules = await prisma.filterRule.findMany({
      where: { vertical: source.vertical, enabled: true },
    });
    const includes = rules.filter((r) => r.kind === "INCLUDE");
    const pricing = await loadPricing();
    const ctx = adapterContext(source, deps.log);
    const seenIds = new Set<string>();

    const queries: SourceQuery[] = includes.length
      ? includes.map((r) =>
          source.vertical === "CARS"
            ? { vertical: "CARS", criteria: r.criteria as CarFilterCriteria }
            : { vertical: "GADGETS", criteria: r.criteria as GadgetFilterCriteria },
        )
      : [
          source.vertical === "CARS"
            ? { vertical: "CARS", criteria: { saleType: "BUY_NOW" } }
            : { vertical: "GADGETS", criteria: { inStockOnly: true } },
        ];

    for (const query of queries) {
      for await (const raw of adapter.search(query, ctx)) {
        if (seenIds.has(raw.sourceListingId)) continue;
        seenIds.add(raw.sourceListingId);
        stats.seen++;
        try {
          const r = await upsertListing(sourceId, raw, rules, pricing);
          if (r.isNew) stats.new++;
          else if (r.changed) stats.updated++;
          if (!r.visible) stats.hidden++;
          if (r.changed && deps.mediaQueue)
            await deps.mediaQueue.add(
              "mirror",
              { listingId: r.id },
              { jobId: `mirror:${r.id}:${Date.now()}` },
            );
        } catch (err) {
          stats.errors++;
          deps.log.warn({ err, id: raw.sourceListingId }, "upsert failed");
        }
      }
    }

    const stale = await prisma.listing.updateMany({
      where: {
        sourceId,
        status: "ACTIVE",
        lastSeenAt: { lt: new Date(Date.now() - REMOVE_AFTER_MS) },
      },
      data: { status: "REMOVED", removedAt: new Date() },
    });
    stats.removed = stale.count;

    await prisma.source.update({ where: { id: sourceId }, data: { lastDiscoverAt: new Date() } });
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
