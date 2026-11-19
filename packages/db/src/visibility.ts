/**
 * Applies admin FilterRules to a listing. Shown = matches >=1 enabled INCLUDE and 0 enabled EXCLUDE.
 * Used by the worker at sync time (to set status) and by admin "preview" endpoints.
 */
import type { CarFilterCriteria, GadgetFilterCriteria } from "@cedarce/shared";
import type { FilterRule, Listing, Product, Vehicle } from "@prisma/client";

type Full = Listing & { vehicle: Vehicle | null; product: Product | null };

const lc = (s: string | null | undefined) => (s ?? "").toLowerCase();
const inList = (list: string[] | undefined, value: string | null | undefined) =>
  !list || list.length === 0 || list.map((x) => x.toLowerCase()).includes(lc(value));

export function matchesCarCriteria(l: Full, c: CarFilterCriteria): boolean {
  const v = l.vehicle;
  if (!v) return false;
  const price = Number(l.sourcePriceUsd);
  if (!inList(c.make, v.make)) return false;
  if (!inList(c.model, v.model)) return false;
  if (c.yearMin !== undefined && v.year < c.yearMin) return false;
  if (c.yearMax !== undefined && v.year > c.yearMax) return false;
  if (c.priceMinUsd !== undefined && price < c.priceMinUsd) return false;
  if (c.priceMaxUsd !== undefined && price > c.priceMaxUsd) return false;
  if (!inList(c.bodyStyle, v.bodyStyle)) return false;
  if (!inList(c.fuel, v.fuel)) return false;
  if (!inList(c.transmission, v.transmission)) return false;
  if (!inList(c.drive, v.drive)) return false;
  if (c.titleType && !c.titleType.includes(v.titleType)) return false;
  if (c.excludeDamage && c.excludeDamage.map(lc).includes(lc(v.primaryDamage))) return false;
  if (c.runAndDrive !== undefined && v.runAndDrive !== c.runAndDrive) return false;
  if (c.odometerMax !== undefined && (v.odometer ?? 0) > c.odometerMax) return false;
  if (!inList(c.locationState, v.locationState)) return false;
  if (!inList(c.auctionHouse, v.auctionHouse)) return false;
  return l.saleType === "BUY_NOW";
}

export function matchesGadgetCriteria(l: Full, c: GadgetFilterCriteria): boolean {
  const p = l.product;
  if (!p) return false;
  const price = Number(l.sourcePriceUsd);
  if (c.category && !c.category.includes(p.category)) return false;
  if (!inList(c.brand, p.brand)) return false;
  if (!inList(c.model, p.model)) return false;
  if (c.priceMinUsd !== undefined && price < c.priceMinUsd) return false;
  if (c.priceMaxUsd !== undefined && price > c.priceMaxUsd) return false;
  if (c.condition && !c.condition.includes(p.condition)) return false;
  if (c.ratingMin !== undefined && Number(p.rating ?? 0) < c.ratingMin) return false;
  if (c.reviewCountMin !== undefined && (p.reviewCount ?? 0) < c.reviewCountMin) return false;
  if (c.inStockOnly && !p.inStock) return false;
  return true;
}

export function isVisible(l: Full, rules: FilterRule[]): boolean {
  const active = rules.filter((r) => r.enabled && r.vertical === l.vertical);
  const match = (r: FilterRule) =>
    l.vertical === "CARS"
      ? matchesCarCriteria(l, r.criteria as CarFilterCriteria)
      : matchesGadgetCriteria(l, r.criteria as GadgetFilterCriteria);
  const includes = active.filter((r) => r.kind === "INCLUDE");
  const excludes = active.filter((r) => r.kind === "EXCLUDE");
  if (includes.length > 0 && !includes.some(match)) return false;
  if (excludes.some(match)) return false;
  return true;
}
