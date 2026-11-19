import type { FastifyPluginAsync } from "fastify";
import { prisma, Prisma } from "@cedarce/db";
import { listingQuerySchema } from "@cedarce/shared";
import { parseVertical } from "../lib/vertical";
import { toPublicListing } from "../lib/serialize";

const csv = (s?: string) =>
  s
    ? s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : undefined;

export const listingRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { vertical: string } }>("/:vertical/listings", async (req, reply) => {
    const vertical = parseVertical(req.params.vertical);
    const q = listingQuerySchema.parse(req.query);

    const where: Prisma.ListingWhereInput = { vertical, status: "ACTIVE", saleType: "BUY_NOW" };
    if (q.featured) where.featured = true;
    if (q.priceMin !== undefined || q.priceMax !== undefined)
      where.displayPriceUsd = { gte: q.priceMin, lte: q.priceMax };
    if (q.q) where.title = { contains: q.q, mode: "insensitive" };

    if (vertical === "CARS") {
      where.vehicle = {
        ...(csv(q.make) && { make: { in: csv(q.make), mode: "insensitive" } }),
        ...(csv(q.model) && { model: { in: csv(q.model), mode: "insensitive" } }),
        ...(csv(q.bodyStyle) && { bodyStyle: { in: csv(q.bodyStyle), mode: "insensitive" } }),
        ...(csv(q.titleType) && { titleType: { in: csv(q.titleType) as never } }),
        ...((q.yearMin || q.yearMax) && { year: { gte: q.yearMin, lte: q.yearMax } }),
      };
    } else {
      where.product = {
        ...(csv(q.brand) && { brand: { in: csv(q.brand), mode: "insensitive" } }),
        ...(csv(q.category) && { category: { in: csv(q.category) as never } }),
        inStock: true,
      };
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      q.sort === "price_asc"
        ? { displayPriceUsd: "asc" }
        : q.sort === "price_desc"
          ? { displayPriceUsd: "desc" }
          : q.sort === "year_desc"
            ? { vehicle: { year: "desc" } }
            : { firstSeenAt: "desc" };

    const [total, items] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          vehicle: true,
          product: true,
          images: { take: 3, orderBy: { position: "asc" } },
        },
      }),
    ]);

    reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return { total, page: q.page, pageSize: q.pageSize, items: items.map(toPublicListing) };
  });

  app.get<{ Params: { vertical: string; slug: string } }>(
    "/:vertical/listings/:slug",
    async (req, reply) => {
      const vertical = parseVertical(req.params.vertical);
      const l = await prisma.listing.findFirst({
        where: { vertical, slug: req.params.slug },
        include: { vehicle: true, product: true, images: { orderBy: { position: "asc" } } },
      });
      if (!l || l.status === "HIDDEN") return reply.status(404).send({ error: "Not found" });
      reply.header("Cache-Control", "public, max-age=60");
      // SOLD / REMOVED listings are returned with their status so the storefront can show "sold, see similar".
      return toPublicListing(l);
    },
  );

  app.get<{ Params: { vertical: string } }>("/:vertical/facets", async (req, reply) => {
    const vertical = parseVertical(req.params.vertical);
    reply.header("Cache-Control", "public, max-age=300");
    if (vertical === "CARS") {
      const [makes, bodies, years] = await Promise.all([
        prisma.vehicle.groupBy({
          by: ["make"],
          where: { listing: { status: "ACTIVE", vertical } },
          _count: true,
          orderBy: { _count: { make: "desc" } },
        }),
        prisma.vehicle.groupBy({
          by: ["bodyStyle"],
          where: { listing: { status: "ACTIVE", vertical } },
          _count: true,
        }),
        prisma.vehicle.aggregate({
          where: { listing: { status: "ACTIVE", vertical } },
          _min: { year: true },
          _max: { year: true },
        }),
      ]);
      return {
        makes: makes.map((m) => ({ value: m.make, count: m._count })),
        bodyStyles: bodies
          .filter((b) => b.bodyStyle)
          .map((b) => ({ value: b.bodyStyle, count: b._count })),
        yearMin: years._min.year,
        yearMax: years._max.year,
      };
    }
    const [brands, categories] = await Promise.all([
      prisma.product.groupBy({
        by: ["brand"],
        where: { listing: { status: "ACTIVE", vertical } },
        _count: true,
        orderBy: { _count: { brand: "desc" } },
      }),
      prisma.product.groupBy({
        by: ["category"],
        where: { listing: { status: "ACTIVE", vertical } },
        _count: true,
      }),
    ]);
    return {
      brands: brands.map((b) => ({ value: b.brand, count: b._count })),
      categories: categories.map((c) => ({ value: c.category, count: c._count })),
    };
  });
};
