import type { CarFilterCriteria, GadgetFilterCriteria, Vertical } from "@cedarce/shared";

/** Normalised vehicle as produced by any cars adapter. Only Buy Now lots should ever be yielded. */
export interface RawVehicle {
  kind: "CARS";
  sourceListingId: string;
  sourceUrl?: string;
  title: string;
  buyNowUsd: number;
  estAuctionFeeUsd?: number | null;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  bodyStyle?: string | null;
  fuel?: string | null;
  transmission?: string | null;
  drive?: string | null;
  engine?: string | null;
  color?: string | null;
  odometer?: number | null;
  odometerUnit?: "mi" | "km";
  vin?: string | null;
  lotNumber?: string | null;
  auctionHouse?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  titleType: "CLEAN" | "SALVAGE" | "REBUILT" | "OTHER";
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  runAndDrive?: boolean | null;
  keys?: boolean | null;
  images: string[];
  attributes?: Record<string, unknown>;
}

export interface RawProduct {
  kind: "GADGETS";
  sourceListingId: string;
  sourceUrl?: string;
  title: string;
  retailUsd: number;
  category: "PHONE" | "LAPTOP" | "TABLET" | "ACCESSORY";
  brand: string;
  model: string;
  asin?: string | null;
  condition?: "NEW" | "RENEWED" | "USED";
  rating?: number | null;
  reviewCount?: number | null;
  weightKg?: number | null;
  dimensionsCm?: { l: number; w: number; h: number } | null;
  specs?: Record<string, unknown>;
  inStock?: boolean;
  images: string[];
  attributes?: Record<string, unknown>;
}

export type RawListing = RawVehicle | RawProduct;

export type SourceQuery =
  | { vertical: "CARS"; criteria: CarFilterCriteria }
  | { vertical: "GADGETS"; criteria: GadgetFilterCriteria };

export interface SourceAdapterContext {
  /** Non-secret config stored on the Source row */
  config: Record<string, unknown>;
  /** Secrets from process.env, injected by the worker */
  env: Record<string, string | undefined>;
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface SourceAdapter {
  readonly key: string;
  readonly vertical: Vertical;
  /** Human-readable note shown in admin (licensing status, rate limits, etc.). */
  readonly notes?: string;
  /** Crawl the source for everything matching an admin INCLUDE rule. Must yield only Buy Now / fixed-price items. */
  search(query: SourceQuery, ctx: SourceAdapterContext): AsyncIterable<RawListing>;
  /** Re-fetch one item. Return null when it is sold, withdrawn or no longer Buy Now. */
  fetch(sourceListingId: string, ctx: SourceAdapterContext): Promise<RawListing | null>;
  /** Polite per-source rate limit used by the refresh worker. */
  readonly maxRequestsPerMinute: number;
}
