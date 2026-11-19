import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@cedarce/db";
import { createLeadSchema, listingEnquiryMessage, whatsappLink } from "@cedarce/shared";
import { env } from "../env";

export const leadRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/leads",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = createLeadSchema.parse(req.body);
      const listing = body.listingId
        ? await prisma.listing.findUnique({ where: { id: body.listingId } })
        : null;

      const lead = await prisma.lead.create({
        data: {
          vertical: body.vertical,
          listingId: listing?.id,
          name: body.name,
          phone: body.phone.startsWith("+") ? body.phone : `+${body.phone}`,
          email: body.email || null,
          country: body.country,
          city: body.city,
          message: body.message,
          utmSource: body.utmSource,
          utmCampaign: body.utmCampaign,
        },
      });

      const setting = await prisma.setting.findUnique({ where: { key: "whatsapp.number" } });
      const number = (setting?.value as string | undefined) ?? env.NEXT_PUBLIC_WHATSAPP_NUMBER;
      const message = listing
        ? listingEnquiryMessage({
            brand: body.vertical === "CARS" ? "Cedarce Cars" : "Cedarce Gadgets",
            title: listing.title,
            ref: listing.slug,
            priceUsd: Number(listing.displayPriceUsd),
          })
        : `Hi Cedarce, my name is ${body.name}. ${body.message ?? ""}`.trim();

      return reply
        .status(201)
        .send({ id: lead.id, whatsappUrl: number ? whatsappLink(number, message) : null });
    },
  );
};
