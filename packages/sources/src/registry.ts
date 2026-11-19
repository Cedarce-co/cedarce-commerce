import type { SourceAdapter } from "./types";
import { csvAdapter } from "./adapters/csv";
import { auctionApiAdapter } from "./adapters/auction-api";
import { auctionExportPartnerAdapter } from "./adapters/auctionexport-partner";
import { productApiAdapter } from "./adapters/product-api";

const csvGadgetsAdapter: SourceAdapter = { ...csvAdapter, key: "csv-gadgets", vertical: "GADGETS" };

const adapters: SourceAdapter[] = [
  csvAdapter,
  csvGadgetsAdapter,
  auctionApiAdapter,
  auctionExportPartnerAdapter,
  productApiAdapter,
];

export function getAdapter(key: string): SourceAdapter {
  const a = adapters.find((x) => x.key === key);
  if (!a) throw new Error(`Unknown source adapter: ${key}`);
  return a;
}

export function listAdapters(): SourceAdapter[] {
  return adapters;
}
