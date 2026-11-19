import { prisma } from "@cedarce/db";
import {
  DEFAULT_CAR_PRICING,
  DEFAULT_GADGET_PRICING,
  type CarPricingConfig,
  type GadgetPricingConfig,
  type Vertical,
} from "@cedarce/shared";

/**
 * Pricing config = defaults overridden by the `pricing.<vertical>` Setting row (edited in admin).
 * PricingRule rows add per-category/body overrides; v1 only merges the top-level Setting.
 */
export async function loadPricingConfig(
  _vertical: Vertical,
): Promise<{ cars: CarPricingConfig; gadgets: GadgetPricingConfig }> {
  const [cars, gadgets] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "pricing.CARS" } }),
    prisma.setting.findUnique({ where: { key: "pricing.GADGETS" } }),
  ]);
  return {
    cars: { ...DEFAULT_CAR_PRICING, ...((cars?.value as Partial<CarPricingConfig>) ?? {}) },
    gadgets: {
      ...DEFAULT_GADGET_PRICING,
      ...((gadgets?.value as Partial<GadgetPricingConfig>) ?? {}),
    },
  };
}
