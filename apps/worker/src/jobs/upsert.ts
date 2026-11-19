import { createHash } from "node:crypto";
import { prisma, type FilterRule, type Prisma } from "@cedarce/db";
import type { RawListing } from "@cedarce/sources";
import {
  carDisplayPrice,
  gadgetDisplayPrice,
  listingSlug,
  DEFAULT_CAR_PRICING,
  DEFAULT_GADGET_PRICING,
  type CarPricingConfig,
  type GadgetPricingConfig,
} from "@cedarce/shared";
import { isVisible } from "@cedarce/db";

export interface UpsertResult {
  id: string;
  isNew: boolean;
  changed: boolean;
  visible: boolean;
}

export async function loadPricing(): Promise<{
  cars: CarPricingConfig;
  gadgets: GadgetPricingConfig;
}> {
  const [c, g] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "pricing.CARS" } }),
    prisma.setting.findUnique({ where: { key: "pricing.GADGETS" } }),
  ]);
  return {
    cars: { ...DEFAULT_CAR_PRICING, ...((c?.value as Partial<CarPricingConfig>) ?? {}) },
    gadgets: { ...DEFAULT_GADGET_PRICING, ...((g?.value as Partial<GadgetPricingConfig>) ?? {}) },
  };
}

export function displayPriceFor(
  raw: RawListing,
  pricing: Awaited<ReturnType<typeof loadPricing>>,
): number {
  return raw.kind === "CARS"
    ? carDisplayPrice(raw.buyNowUsd, raw.estAuctionFeeUsd, pricing.cars)
    : gadgetDisplayPrice(
        { retailUsd: raw.retailUsd, weightKg: raw.weightKg, category: raw.category },
        pricing.gadgets,
      );
}

export async function upsertListing(
  sourceId: string,
  raw: RawListing,
  rules: FilterRule[],
  pricing: Awaited<ReturnType<typeof loadPricing>>,
): Promise<UpsertResult> {
  const hash = createHash("sha1").update(JSON.stringify(raw)).digest("hex");
  const existing = await prisma.listing.findUnique({
    where: { sourceId_sourceListingId: { sourceId, sourceListingId: raw.sourceListingId } },
    include: { vehicle: true, product: true },
  });
  const now = new Date();

  if (existing && existing.contentHash === hash) {
    await prisma.listing.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: now,
        ...(existing.status === "REMOVED" || existing.status === "SOLD"
          ? { status: "ACTIVE", removedAt: null }
          : {}),
      },
    });
    return { id: existing.id, isNew: false, changed: false, visible: existing.status === "ACTIVE" };
  }

  const sourcePriceUsd = raw.kind === "CARS" ? raw.buyNowUsd : raw.retailUsd;
  const base: Prisma.ListingUncheckedCreateInput = {
    vertical: raw.kind,
    sourceId,
    sourceListingId: raw.sourceListingId,
    sourceUrl: raw.sourceUrl,
    slug: existing?.slug ?? listingSlug(raw.title, raw.sourceListingId),
    title: raw.title,
    saleType: "BUY_NOW",
    sourcePriceUsd,
    displayPriceUsd: displayPriceFor(raw, pricing),
    priceComputedAt: now,
    contentHash: hash,
    lastSeenAt: now,
    removedAt: null,
    attributes: (raw.attributes ?? {}) as Prisma.InputJsonValue,
    status: existing?.status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
  };

  const vehicle =
    raw.kind === "CARS"
      ? {
          make: raw.make,
          model: raw.model,
          year: raw.year,
          trim: raw.trim,
          bodyStyle: raw.bodyStyle,
          fuel: raw.fuel,
          transmission: raw.transmission,
          drive: raw.drive,
          engine: raw.engine,
          color: raw.color,
          odometer: raw.odometer,
          odometerUnit: raw.odometerUnit ?? "mi",
          vin: raw.vin,
          lotNumber: raw.lotNumber,
          auctionHouse: raw.auctionHouse,
          locationState: raw.locationState,
          locationCountry: raw.locationCountry ?? "US",
          titleType: raw.titleType,
          primaryDamage: raw.primaryDamage,
          secondaryDamage: raw.secondaryDamage,
          runAndDrive: raw.runAndDrive,
          keys: raw.keys,
          estAuctionFeeUsd: raw.estAuctionFeeUsd ?? undefined,
        }
      : null;
  const product =
    raw.kind === "GADGETS"
      ? {
          category: raw.category,
          brand: raw.brand,
          model: raw.model,
          asin: raw.asin,
          condition: raw.condition ?? "NEW",
          rating: raw.rating ?? undefined,
          reviewCount: raw.reviewCount,
          weightKg: raw.weightKg ?? undefined,
          dimensionsCm: (raw.dimensionsCm ?? undefined) as Prisma.InputJsonValue | undefined,
          specs: (raw.specs ?? {}) as Prisma.InputJsonValue,
          inStock: raw.inStock ?? true,
        }
      : null;

  const saved = existing
    ? await prisma.listing.update({
        where: { id: existing.id },
        data: {
          ...base,
          vehicle: vehicle ? { upsert: { create: vehicle, update: vehicle } } : undefined,
          product: product ? { upsert: { create: product, update: product } } : undefined,
        },
        include: { vehicle: true, product: true },
      })
    : await prisma.listing.create({
        data: {
          ...base,
          vehicle: vehicle ? { create: vehicle } : undefined,
          product: product ? { create: product } : undefined,
        },
        include: { vehicle: true, product: true },
      });

  // Images: replace the set when the source changed.
  if (raw.images.length) {
    await prisma.image.deleteMany({
      where: { listingId: saved.id, sourceUrl: { notIn: raw.images } },
    });
    await prisma.image.createMany({
      data: raw.images.map((url, i) => ({ listingId: saved.id, sourceUrl: url, position: i })),
      skipDuplicates: true,
    });
  }

  const visible = isVisible(saved, rules);
  if (saved.status !== "HIDDEN" && !visible)
    await prisma.listing.update({
      where: { id: saved.id },
      data: { status: "HIDDEN", adminNote: "auto: no matching include rule" },
    });
  if (saved.status === "HIDDEN" && visible && saved.adminNote?.startsWith("auto:"))
    await prisma.listing.update({
      where: { id: saved.id },
      data: { status: "ACTIVE", adminNote: null },
    });

  return { id: saved.id, isNew: !existing, changed: true, visible };
}
