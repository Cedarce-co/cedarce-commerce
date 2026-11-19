/**
 * Licensed auction-data API adapter (Copart / IAAI aggregators such as Apibara's Vehicle Auction Data API
 * or an Apify dataset). This is the DEFAULT cars source for Phase 1 — see docs/04-legal-and-sourcing.md.
 *
 * Env: AUCTION_API_BASE_URL, AUCTION_API_KEY.
 * The response mapping below targets a generic shape; adjust `mapVehicle` to the chosen provider's schema.
 */
import type { RawVehicle, SourceAdapter, SourceQuery } from "../types";

interface ProviderVehicle {
  id: string;
  url?: string;
  vin?: string;
  lot_number?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  body_style?: string;
  fuel?: string;
  transmission?: string;
  drive?: string;
  engine?: string;
  color?: string;
  odometer?: number;
  odometer_unit?: "mi" | "km";
  platform?: string;
  location_state?: string;
  title_type?: string;
  primary_damage?: string;
  secondary_damage?: string;
  run_and_drive?: boolean;
  keys?: boolean;
  buy_now_price?: number | null;
  sale_status?: string;
  images?: string[];
}

function mapTitle(t?: string): RawVehicle["titleType"] {
  const s = (t ?? "").toLowerCase();
  if (s.includes("clean")) return "CLEAN";
  if (s.includes("rebuilt")) return "REBUILT";
  if (s.includes("salvage")) return "SALVAGE";
  return "OTHER";
}

export function mapVehicle(v: ProviderVehicle): RawVehicle | null {
  if (!v.buy_now_price || v.buy_now_price <= 0) return null; // Buy Now only
  if (v.sale_status && /sold|closed|withdrawn/i.test(v.sale_status)) return null;
  return {
    kind: "CARS",
    sourceListingId: v.id,
    sourceUrl: v.url,
    title: [v.year, v.make, v.model, v.trim].filter(Boolean).join(" "),
    buyNowUsd: v.buy_now_price,
    make: v.make,
    model: v.model,
    year: v.year,
    trim: v.trim ?? null,
    bodyStyle: v.body_style ?? null,
    fuel: v.fuel ?? null,
    transmission: v.transmission ?? null,
    drive: v.drive ?? null,
    engine: v.engine ?? null,
    color: v.color ?? null,
    odometer: v.odometer ?? null,
    odometerUnit: v.odometer_unit ?? "mi",
    vin: v.vin ?? null,
    lotNumber: v.lot_number ?? null,
    auctionHouse: v.platform ?? null,
    locationState: v.location_state ?? null,
    locationCountry: "US",
    titleType: mapTitle(v.title_type),
    primaryDamage: v.primary_damage ?? null,
    secondaryDamage: v.secondary_damage ?? null,
    runAndDrive: v.run_and_drive ?? null,
    keys: v.keys ?? null,
    images: v.images ?? [],
  };
}

function buildParams(q: SourceQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.vertical !== "CARS") return p;
  const c = q.criteria;
  p.set("buy_now", "true");
  if (c.make) p.set("make", c.make.join(","));
  if (c.model) p.set("model", c.model.join(","));
  if (c.yearMin) p.set("year_from", String(c.yearMin));
  if (c.yearMax) p.set("year_to", String(c.yearMax));
  if (c.priceMinUsd) p.set("price_from", String(c.priceMinUsd));
  if (c.priceMaxUsd) p.set("price_to", String(c.priceMaxUsd));
  if (c.titleType) p.set("title_type", c.titleType.join(",").toLowerCase());
  if (c.locationState) p.set("state", c.locationState.join(","));
  if (c.auctionHouse) p.set("platform", c.auctionHouse.join(",").toLowerCase());
  if (c.odometerMax) p.set("odometer_to", String(c.odometerMax));
  return p;
}

export const auctionApiAdapter: SourceAdapter = {
  key: "auction-api",
  vertical: "CARS",
  notes: "Licensed Copart/IAAI data API. Default Phase 1 cars source. Buy Now lots only.",
  maxRequestsPerMinute: 60,
  async *search(query, ctx) {
    const base = ctx.env["AUCTION_API_BASE_URL"];
    const key = ctx.env["AUCTION_API_KEY"];
    if (!base || !key) throw new Error("AUCTION_API_BASE_URL / AUCTION_API_KEY not set");
    const params = buildParams(query);
    let page = 1;
    for (;;) {
      params.set("page", String(page));
      params.set("per_page", "100");
      const res = await fetch(`${base}/vehicles?${params}`, { headers: { "X-API-Key": key } });
      if (!res.ok) throw new Error(`auction-api ${res.status}`);
      const body = (await res.json()) as { data: ProviderVehicle[]; next_page?: number | null };
      for (const v of body.data) {
        const mapped = mapVehicle(v);
        if (mapped) yield mapped;
      }
      if (!body.next_page) break;
      page = body.next_page;
    }
  },
  async fetch(sourceListingId, ctx) {
    const base = ctx.env["AUCTION_API_BASE_URL"];
    const key = ctx.env["AUCTION_API_KEY"];
    if (!base || !key) throw new Error("AUCTION_API_BASE_URL / AUCTION_API_KEY not set");
    const res = await fetch(`${base}/vehicles/${encodeURIComponent(sourceListingId)}`, {
      headers: { "X-API-Key": key },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`auction-api ${res.status}`);
    return mapVehicle((await res.json()) as ProviderVehicle);
  },
};
