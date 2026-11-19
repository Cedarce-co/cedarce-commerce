/**
 * CSV / JSON adapter. Used for launch-time hand curation and for local seeding.
 * `config.path` points at a JSON file containing RawListing[]; the worker reads it.
 * Zero licensing risk: the ops agent writes our own summaries and only identifying data.
 */
import { readFile } from "node:fs/promises";
import type { RawListing, SourceAdapter, SourceQuery } from "../types";

async function load(path: string): Promise<RawListing[]> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as RawListing[];
}

function matches(item: RawListing, q: SourceQuery): boolean {
  if (item.kind !== q.vertical) return false;
  if (item.kind === "CARS" && q.vertical === "CARS") {
    const c = q.criteria;
    if (c.make && !c.make.map((m) => m.toLowerCase()).includes(item.make.toLowerCase()))
      return false;
    if (c.yearMin && item.year < c.yearMin) return false;
    if (c.yearMax && item.year > c.yearMax) return false;
    if (c.priceMaxUsd && item.buyNowUsd > c.priceMaxUsd) return false;
    if (c.priceMinUsd && item.buyNowUsd < c.priceMinUsd) return false;
    if (c.titleType && !c.titleType.includes(item.titleType)) return false;
    if (
      c.excludeDamage &&
      item.primaryDamage &&
      c.excludeDamage.map((d) => d.toLowerCase()).includes(item.primaryDamage.toLowerCase())
    )
      return false;
    return true;
  }
  if (item.kind === "GADGETS" && q.vertical === "GADGETS") {
    const c = q.criteria;
    if (c.category && !c.category.includes(item.category)) return false;
    if (c.brand && !c.brand.map((b) => b.toLowerCase()).includes(item.brand.toLowerCase()))
      return false;
    if (c.priceMaxUsd && item.retailUsd > c.priceMaxUsd) return false;
    if (c.priceMinUsd && item.retailUsd < c.priceMinUsd) return false;
    if (c.inStockOnly && item.inStock === false) return false;
    return true;
  }
  return false;
}

export const csvAdapter: SourceAdapter = {
  key: "csv",
  vertical: "CARS", // informational; this adapter serves both verticals
  notes: "Hand-curated JSON/CSV file. No external calls.",
  maxRequestsPerMinute: 10_000,
  async *search(query, ctx) {
    const path = String(ctx.config["path"] ?? "");
    if (!path) return;
    for (const item of await load(path)) if (matches(item, query)) yield item;
  },
  async fetch(sourceListingId, ctx) {
    const path = String(ctx.config["path"] ?? "");
    if (!path) return null;
    return (await load(path)).find((i) => i.sourceListingId === sourceListingId) ?? null;
  },
};
