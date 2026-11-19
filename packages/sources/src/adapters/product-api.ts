/**
 * Third-party Amazon product-data API adapter (e.g. Rainforest API, Keepa, Apify Amazon actor).
 * We do not scrape amazon.com and do not use the Creators API for this (its licence is for driving
 * traffic to Amazon, not for off-Amazon resale). See docs/04-legal-and-sourcing.md.
 *
 * Env: PRODUCT_API_BASE_URL, PRODUCT_API_KEY. `config.searchTerms` (string[]) seeds discovery per brand/category.
 */
import type { RawProduct, SourceAdapter, SourceQuery } from "../types";

interface ProviderProduct {
  asin: string;
  title: string;
  link?: string;
  brand?: string;
  price?: { value: number; currency: string } | null;
  is_prime?: boolean;
  availability?: { raw?: string } | null;
  rating?: number;
  ratings_total?: number;
  weight?: string; // "6.1 ounces"
  dimensions?: string; // "5.8 x 2.8 x 0.3 inches"
  images?: string[];
  specifications?: Array<{ name: string; value: string }>;
}

function parseWeightKg(raw?: string): number | null {
  if (!raw) return null;
  const m = raw.match(/([\d.]+)\s*(ounces|oz|pounds|lbs|kg|g)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1]!);
  switch (m[2]!.toLowerCase()) {
    case "ounces":
    case "oz":
      return +(v * 0.0283495).toFixed(3);
    case "pounds":
    case "lbs":
      return +(v * 0.453592).toFixed(3);
    case "g":
      return +(v / 1000).toFixed(3);
    default:
      return v;
  }
}

export function mapProduct(
  p: ProviderProduct,
  category: RawProduct["category"],
): RawProduct | null {
  if (!p.price || p.price.currency !== "USD" || p.price.value <= 0) return null;
  const unavailable = /unavailable|out of stock/i.test(p.availability?.raw ?? "");
  const brand = p.brand ?? p.title.split(" ")[0] ?? "Unknown";
  return {
    kind: "GADGETS",
    sourceListingId: p.asin,
    sourceUrl: p.link,
    title: p.title,
    retailUsd: p.price.value,
    category,
    brand,
    model: p.title.replace(brand, "").trim().slice(0, 80),
    asin: p.asin,
    condition: /renewed|refurbished/i.test(p.title) ? "RENEWED" : "NEW",
    rating: p.rating ?? null,
    reviewCount: p.ratings_total ?? null,
    weightKg: parseWeightKg(p.weight),
    specs: Object.fromEntries((p.specifications ?? []).map((s) => [s.name, s.value])),
    inStock: !unavailable,
    images: p.images ?? [],
  };
}

const CATEGORY_TERMS: Record<RawProduct["category"], string[]> = {
  PHONE: ["unlocked smartphone"],
  LAPTOP: ["laptop"],
  TABLET: ["tablet"],
  ACCESSORY: ["phone charger", "laptop bag", "earbuds"],
};

export const productApiAdapter: SourceAdapter = {
  key: "amazon-product-api",
  vertical: "GADGETS",
  notes: "Paid product-data API over the Amazon US catalogue. Pay-per-request; keep rules tight.",
  maxRequestsPerMinute: 30,
  async *search(query: SourceQuery, ctx) {
    const base = ctx.env["PRODUCT_API_BASE_URL"];
    const key = ctx.env["PRODUCT_API_KEY"];
    if (!base || !key) throw new Error("PRODUCT_API_BASE_URL / PRODUCT_API_KEY not set");
    if (query.vertical !== "GADGETS") return;
    const c = query.criteria;
    const categories = c.category ?? (["PHONE", "LAPTOP"] as RawProduct["category"][]);
    const brands = c.brand ?? [""];
    for (const category of categories) {
      for (const term of CATEGORY_TERMS[category]) {
        for (const brand of brands) {
          const params = new URLSearchParams({
            api_key: key,
            type: "search",
            amazon_domain: "amazon.com",
            search_term: `${brand} ${term}`.trim(),
          });
          if (c.priceMinUsd) params.set("min_price", String(c.priceMinUsd));
          if (c.priceMaxUsd) params.set("max_price", String(c.priceMaxUsd));
          const res = await fetch(`${base}/request?${params}`);
          if (!res.ok) throw new Error(`product-api ${res.status}`);
          const body = (await res.json()) as { search_results?: ProviderProduct[] };
          for (const p of body.search_results ?? []) {
            const mapped = mapProduct(p, category);
            if (!mapped) continue;
            if (c.ratingMin && (mapped.rating ?? 0) < c.ratingMin) continue;
            if (c.reviewCountMin && (mapped.reviewCount ?? 0) < c.reviewCountMin) continue;
            if (c.condition && mapped.condition && !c.condition.includes(mapped.condition))
              continue;
            yield mapped;
          }
        }
      }
    }
  },
  async fetch(asin, ctx) {
    const base = ctx.env["PRODUCT_API_BASE_URL"];
    const key = ctx.env["PRODUCT_API_KEY"];
    if (!base || !key) throw new Error("PRODUCT_API_BASE_URL / PRODUCT_API_KEY not set");
    const params = new URLSearchParams({
      api_key: key,
      type: "product",
      amazon_domain: "amazon.com",
      asin,
    });
    const res = await fetch(`${base}/request?${params}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`product-api ${res.status}`);
    const body = (await res.json()) as {
      product?: ProviderProduct & { categories?: Array<{ name: string }> };
    };
    if (!body.product) return null;
    const cat = String(ctx.config["defaultCategory"] ?? "PHONE") as RawProduct["category"];
    return mapProduct(body.product, cat);
  },
};
