/**
 * AuctionExport PARTNER FEED adapter.
 *
 * AuctionExport's Terms of Use (§1.3, §9.1, §15) restrict the site to personal, non-commercial use and forbid
 * reproducing content without written consent. This adapter therefore does NOT scrape auctionexport.com.
 * It is wired to a partner/dealer feed URL that AuctionExport provides under a written agreement
 * (env AUCTIONEXPORT_PARTNER_FEED_URL + AUCTIONEXPORT_PARTNER_TOKEN). Until that agreement exists the
 * adapter stays disabled in admin and the licensed `auction-api` adapter is used for the catalogue.
 *
 * Mapping assumes a JSON feed of Buy Now vehicles; adjust once the real feed format is known.
 */
import type { RawVehicle, SourceAdapter } from "../types";
import { mapVehicle } from "./auction-api";

export const auctionExportPartnerAdapter: SourceAdapter = {
  key: "auctionexport",
  vertical: "CARS",
  notes: "Requires a written partner agreement and feed from AuctionExport. Disabled until then.",
  maxRequestsPerMinute: 30,
  async *search(query, ctx) {
    const url = ctx.env["AUCTIONEXPORT_PARTNER_FEED_URL"];
    const token = ctx.env["AUCTIONEXPORT_PARTNER_TOKEN"];
    if (!url || !token)
      throw new Error("AuctionExport partner feed not configured (no agreement yet)");
    if (query.vertical !== "CARS") return;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`auctionexport feed ${res.status}`);
    const items = (await res.json()) as Parameters<typeof mapVehicle>[0][];
    for (const v of items) {
      const mapped = mapVehicle(v);
      if (!mapped) continue;
      const c = query.criteria;
      if (c.make && !c.make.map((m) => m.toLowerCase()).includes(mapped.make.toLowerCase()))
        continue;
      if (c.yearMin && mapped.year < c.yearMin) continue;
      if (c.yearMax && mapped.year > c.yearMax) continue;
      if (c.priceMaxUsd && mapped.buyNowUsd > c.priceMaxUsd) continue;
      yield mapped as RawVehicle;
    }
  },
  async fetch(sourceListingId, ctx) {
    // Partner feeds are usually full snapshots; refresh by re-reading the feed and locating the id.
    for await (const item of auctionExportPartnerAdapter.search(
      { vertical: "CARS", criteria: { saleType: "BUY_NOW" } },
      ctx,
    )) {
      if (item.sourceListingId === sourceListingId) return item;
    }
    return null;
  },
};
