/**
 * Pricing and landed-cost math. Pure functions, no I/O, unit-tested.
 * Defaults mirror docs/06-admin-filters-and-pricing.md and are overridable from admin PricingRules.
 */
import type { Destination } from "./constants";

export interface QuoteLine {
  key: string;
  label: string;
  amountUsd: number;
  estimate?: boolean; // true for duty and anything customs decides
  passThrough?: boolean; // true if Cedarce earns nothing on it
}

export interface Quote {
  lines: QuoteLine[];
  totalUsd: number;
  /** Portion of totalUsd that is Cedarce's gross margin */
  marginUsd: number;
}

export interface CarPricingConfig {
  auctionFeePercent: number; // used only when the source gives no estimate
  auctionFeeCapUsd: number;
  serviceFeeLowUsd: number; // AuctionExport: price <= 2,999.99
  serviceFeeHighUsd: number; // AuctionExport: price >= 3,000
  documentationFeeUsd: number;
  agencyTiers: Array<{ upToUsd: number | null; fixedUsd?: number; percent?: number }>;
  shippingByBody: Record<string, number>; // keyed by bodyStyle lowercase; "default" required
  shippingHandlingPercent: number;
  duty: Record<
    Destination,
    { dutyPercent: number; leviesPercent: number; vatPercent: number; customsValueRatio: number }
  >;
}

export const DEFAULT_CAR_PRICING: CarPricingConfig = {
  auctionFeePercent: 0.1,
  auctionFeeCapUsd: 800,
  serviceFeeLowUsd: 195,
  serviceFeeHighUsd: 295,
  documentationFeeUsd: 95,
  agencyTiers: [
    { upToUsd: 5000, fixedUsd: 350 },
    { upToUsd: 15000, fixedUsd: 500 },
    { upToUsd: null, percent: 0.04 },
  ],
  shippingByBody: {
    sedan: 1250,
    hatchback: 1250,
    coupe: 1250,
    suv: 1450,
    wagon: 1350,
    van: 1600,
    pickup: 1600,
    truck: 1900,
    default: 1400,
  },
  shippingHandlingPercent: 0.06,
  duty: {
    NG: { dutyPercent: 0.35, leviesPercent: 0.12, vatPercent: 0.075, customsValueRatio: 0.85 },
    GH: { dutyPercent: 0.2, leviesPercent: 0.1, vatPercent: 0.15, customsValueRatio: 0.9 },
  },
};

export interface GadgetPricingConfig {
  salesTaxPercent: number;
  forwardingPerKgUsd: number;
  forwardingMinUsd: number;
  dutyPercent: Record<Destination, number>;
  marginByCategory: Record<string, number>; // keyed by ProductCategory; "default" required
}

export const DEFAULT_GADGET_PRICING: GadgetPricingConfig = {
  salesTaxPercent: 0.08,
  forwardingPerKgUsd: 12,
  forwardingMinUsd: 18,
  dutyPercent: { NG: 0.2, GH: 0.2 },
  marginByCategory: { PHONE: 0.15, LAPTOP: 0.12, TABLET: 0.13, ACCESSORY: 0.3, default: 0.15 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function agencyFee(priceUsd: number, tiers: CarPricingConfig["agencyTiers"]): number {
  for (const tier of tiers) {
    if (tier.upToUsd === null || priceUsd <= tier.upToUsd) {
      if (tier.fixedUsd !== undefined) return tier.fixedUsd;
      if (tier.percent !== undefined) return round2(priceUsd * tier.percent);
    }
  }
  return 0;
}

/** The price shown on a car card: Buy Now + fees Cedarce can state with certainty, before shipping and duty. */
export function carDisplayPrice(
  buyNowUsd: number,
  estAuctionFeeUsd: number | null | undefined,
  cfg: CarPricingConfig = DEFAULT_CAR_PRICING,
): number {
  const auctionFee =
    estAuctionFeeUsd ?? Math.min(buyNowUsd * cfg.auctionFeePercent, cfg.auctionFeeCapUsd);
  const serviceFee = buyNowUsd < 3000 ? cfg.serviceFeeLowUsd : cfg.serviceFeeHighUsd;
  return round2(
    buyNowUsd +
      auctionFee +
      serviceFee +
      cfg.documentationFeeUsd +
      agencyFee(buyNowUsd, cfg.agencyTiers),
  );
}

export function carLandedQuote(
  input: {
    buyNowUsd: number;
    estAuctionFeeUsd?: number | null;
    bodyStyle?: string | null;
    destination: Destination;
    inspection?: boolean;
  },
  cfg: CarPricingConfig = DEFAULT_CAR_PRICING,
): Quote {
  const { buyNowUsd, destination } = input;
  const auctionFee =
    input.estAuctionFeeUsd ?? Math.min(buyNowUsd * cfg.auctionFeePercent, cfg.auctionFeeCapUsd);
  const serviceFee = buyNowUsd < 3000 ? cfg.serviceFeeLowUsd : cfg.serviceFeeHighUsd;
  const agency = agencyFee(buyNowUsd, cfg.agencyTiers);
  const body = (input.bodyStyle ?? "default").toLowerCase();
  const shippingBase = cfg.shippingByBody[body] ?? cfg.shippingByBody["default"] ?? 1400;
  const shippingHandling = round2(shippingBase * cfg.shippingHandlingPercent);
  const d = cfg.duty[destination];
  const customsValue = buyNowUsd * d.customsValueRatio;
  const dutyAndLevies = round2(customsValue * (d.dutyPercent + d.leviesPercent));
  const vat = round2((customsValue + dutyAndLevies) * d.vatPercent);

  const lines: QuoteLine[] = [
    {
      key: "vehicle",
      label: "Vehicle Buy Now price",
      amountUsd: round2(buyNowUsd),
      passThrough: true,
    },
    {
      key: "auctionFee",
      label: "Auction buyer fee",
      amountUsd: round2(auctionFee),
      passThrough: true,
      estimate: input.estAuctionFeeUsd == null,
    },
    {
      key: "serviceFee",
      label: "Auction platform service fee",
      amountUsd: serviceFee,
      passThrough: true,
    },
    {
      key: "documentation",
      label: "Title & documentation courier",
      amountUsd: cfg.documentationFeeUsd,
      passThrough: true,
    },
    {
      key: "shipping",
      label: "Inland + ocean shipping",
      amountUsd: round2(shippingBase + shippingHandling),
      estimate: true,
    },
    { key: "agencyFee", label: "Cedarce service fee", amountUsd: agency },
    {
      key: "duty",
      label: "Customs duty & levies (estimate)",
      amountUsd: dutyAndLevies,
      estimate: true,
      passThrough: true,
    },
    { key: "vat", label: "VAT (estimate)", amountUsd: vat, estimate: true, passThrough: true },
  ];
  if (input.inspection)
    lines.splice(4, 0, { key: "inspection", label: "Independent inspection", amountUsd: 200 });

  const totalUsd = round2(lines.reduce((s, l) => s + l.amountUsd, 0));
  const marginUsd = round2(agency + shippingHandling + (input.inspection ? 50 : 0));
  return { lines, totalUsd, marginUsd };
}

export function gadgetDisplayPrice(
  input: {
    retailUsd: number;
    weightKg?: number | null;
    category: string;
    destination?: Destination;
  },
  cfg: GadgetPricingConfig = DEFAULT_GADGET_PRICING,
): number {
  return gadgetLandedQuote({ ...input, destination: input.destination ?? "NG" }, cfg).totalUsd;
}

export function gadgetLandedQuote(
  input: {
    retailUsd: number;
    weightKg?: number | null;
    category: string;
    destination: Destination;
  },
  cfg: GadgetPricingConfig = DEFAULT_GADGET_PRICING,
): Quote {
  const tax = round2(input.retailUsd * cfg.salesTaxPercent);
  const kg = Math.max(input.weightKg ?? 0.5, 0.1);
  const forwarding = round2(Math.max(kg * cfg.forwardingPerKgUsd, cfg.forwardingMinUsd));
  const cif = input.retailUsd + tax + forwarding;
  const duty = round2(cif * (cfg.dutyPercent[input.destination] ?? 0.2));
  const landed = cif + duty;
  const marginPct = cfg.marginByCategory[input.category] ?? cfg.marginByCategory["default"] ?? 0.15;
  const margin = round2(landed * marginPct);
  const lines: QuoteLine[] = [
    { key: "item", label: "Retail price", amountUsd: round2(input.retailUsd), passThrough: true },
    { key: "tax", label: "US sales tax", amountUsd: tax, passThrough: true },
    {
      key: "forwarding",
      label: "Air freight & forwarding",
      amountUsd: forwarding,
      passThrough: true,
      estimate: true,
    },
    {
      key: "duty",
      label: "Duty & VAT (estimate)",
      amountUsd: duty,
      passThrough: true,
      estimate: true,
    },
    { key: "service", label: "Cedarce service", amountUsd: margin },
  ];
  return { lines, totalUsd: round2(landed + margin), marginUsd: margin };
}

export function toLocal(amountUsd: number, fxRate: number): number {
  return Math.ceil(amountUsd * fxRate);
}
