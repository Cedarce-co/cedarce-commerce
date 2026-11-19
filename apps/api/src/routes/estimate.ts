import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cedarce/db";
import {
  carLandedQuote,
  gadgetLandedQuote,
  destinationSchema,
  DESTINATION_CURRENCY,
  toLocal,
} from "@cedarce/shared";
import { parseVertical } from "../lib/vertical";
import { loadPricingConfig } from "../lib/pricing-config";

const querySchema = z.object({
  listingId: z.string(),
  destination: destinationSchema.default("NG"),
  inspection: z.coerce.boolean().default(false),
});

export const estimateRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { vertical: string } }>("/:vertical/estimate", async (req, reply) => {
    const vertical = parseVertical(req.params.vertical);
    const q = querySchema.parse(req.query);
    const l = await prisma.listing.findFirst({
      where: { id: q.listingId, vertical },
      include: { vehicle: true, product: true },
    });
    if (!l) return reply.status(404).send({ error: "Listing not found" });

    const cfg = await loadPricingConfig(vertical);
    const quote =
      vertical === "CARS"
        ? carLandedQuote(
            {
              buyNowUsd: Number(l.sourcePriceUsd),
              estAuctionFeeUsd: l.vehicle?.estAuctionFeeUsd
                ? Number(l.vehicle.estAuctionFeeUsd)
                : null,
              bodyStyle: l.vehicle?.bodyStyle,
              destination: q.destination,
              inspection: q.inspection,
            },
            cfg.cars,
          )
        : gadgetLandedQuote(
            {
              retailUsd: Number(l.sourcePriceUsd),
              weightKg: l.product?.weightKg ? Number(l.product.weightKg) : null,
              category: l.product?.category ?? "ACCESSORY",
              destination: q.destination,
            },
            cfg.gadgets,
          );

    const currency = DESTINATION_CURRENCY[q.destination];
    const fx = await prisma.fxRate.findFirst({
      where: { quote: currency },
      orderBy: { fetchedAt: "desc" },
    });
    const rate = fx ? Number(fx.rate) : null;

    reply.header("Cache-Control", "public, max-age=300");
    return {
      listingId: l.id,
      destination: q.destination,
      currency,
      fxRate: rate,
      fxAsOf: fx?.fetchedAt ?? null,
      lines: quote.lines.map((line) => ({
        ...line,
        amountLocal: rate ? toLocal(line.amountUsd, rate) : null,
      })),
      totalUsd: quote.totalUsd,
      totalLocal: rate ? toLocal(quote.totalUsd, rate) : null,
      disclaimer: "Duty, VAT and shipping are estimates. Final duty is set by customs on arrival.",
    };
  });
};
