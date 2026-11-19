import { prisma } from "@cedarce/db";
import { carDisplayPrice, gadgetDisplayPrice } from "@cedarce/shared";
import type { JobDeps } from "./context";
import { loadPricing } from "./upsert";

/** Recompute displayPriceUsd for every ACTIVE listing after pricing settings change. */
export async function reprice(vertical: "CARS" | "GADGETS", deps: JobDeps) {
  const pricing = await loadPricing();
  const listings = await prisma.listing.findMany({
    where: { vertical, status: { in: ["ACTIVE", "HIDDEN"] } },
    include: { vehicle: true, product: true },
  });
  let n = 0;
  for (const l of listings) {
    const price =
      vertical === "CARS"
        ? carDisplayPrice(
            Number(l.sourcePriceUsd),
            l.vehicle?.estAuctionFeeUsd ? Number(l.vehicle.estAuctionFeeUsd) : null,
            pricing.cars,
          )
        : gadgetDisplayPrice(
            {
              retailUsd: Number(l.sourcePriceUsd),
              weightKg: l.product?.weightKg ? Number(l.product.weightKg) : null,
              category: l.product?.category ?? "ACCESSORY",
            },
            pricing.gadgets,
          );
    if (price !== Number(l.displayPriceUsd)) {
      await prisma.listing.update({
        where: { id: l.id },
        data: { displayPriceUsd: price, priceComputedAt: new Date() },
      });
      n++;
    }
  }
  deps.log.info({ vertical, repriced: n }, "reprice done");
  return { repriced: n };
}
