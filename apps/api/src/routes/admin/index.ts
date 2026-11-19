import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma, type Prisma } from "@cedarce/db";
import { filterRuleSchema } from "@cedarce/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../env";
import { requireAdmin } from "./auth";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const syncQueue = new Queue("sync", { connection });

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // --- auth ---
  app.post("/login", async (req, reply) => {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active || !(await argon2.verify(user.passwordHash, password)))
      return reply.status(401).send({ error: "Invalid credentials" });
    reply.setCookie("cedarce_admin", JSON.stringify({ id: user.id, role: user.role }), {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return { id: user.id, name: user.name, role: user.role };
  });
  app.post("/logout", async (_req, reply) => {
    reply.clearCookie("cedarce_admin", { path: "/" });
    return { ok: true };
  });

  app.register(async (priv) => {
    priv.addHook("preHandler", requireAdmin);

    priv.get("/me", async (req) => req.admin);

    // --- metrics ---
    priv.get("/metrics", async () => {
      const [active, sold, leadsNew, ordersOpen, runs] = await Promise.all([
        prisma.listing.groupBy({ by: ["vertical"], where: { status: "ACTIVE" }, _count: true }),
        prisma.listing.count({
          where: { status: "SOLD", removedAt: { gte: new Date(Date.now() - 7 * 864e5) } },
        }),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.order.count({ where: { stage: { notIn: ["DELIVERED", "CANCELLED"] } } }),
        prisma.syncRun.findMany({
          orderBy: { startedAt: "desc" },
          take: 10,
          include: { source: { select: { key: true } } },
        }),
      ]);
      return {
        activeByVertical: active,
        soldLast7d: sold,
        leadsNew,
        ordersOpen,
        recentSyncRuns: runs,
      };
    });

    // --- listings ---
    priv.get("/listings", async (req) => {
      const q = z
        .object({
          vertical: z.enum(["CARS", "GADGETS"]).optional(),
          status: z.string().optional(),
          page: z.coerce.number().default(1),
        })
        .parse(req.query);
      const where = {
        ...(q.vertical && { vertical: q.vertical }),
        ...(q.status && { status: q.status as never }),
      };
      const [total, items] = await Promise.all([
        prisma.listing.count({ where }),
        prisma.listing.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (q.page - 1) * 50,
          take: 50,
          include: { vehicle: true, product: true, source: { select: { key: true } } },
        }),
      ]);
      return { total, items };
    });
    priv.patch<{ Params: { id: string } }>("/listings/:id", async (req) => {
      const body = z
        .object({
          featured: z.boolean().optional(),
          hidden: z.boolean().optional(),
          adminNote: z.string().max(500).optional(),
          displayPriceUsd: z.number().positive().optional(),
        })
        .parse(req.body);
      return prisma.listing.update({
        where: { id: req.params.id },
        data: {
          featured: body.featured,
          adminNote: body.adminNote,
          displayPriceUsd: body.displayPriceUsd,
          ...(body.hidden !== undefined && { status: body.hidden ? "HIDDEN" : "ACTIVE" }),
        },
      });
    });

    // --- filter rules ---
    priv.get("/filter-rules", async () =>
      prisma.filterRule.findMany({ orderBy: [{ vertical: "asc" }, { priority: "desc" }] }),
    );
    priv.post("/filter-rules", async (req, reply) =>
      reply
        .status(201)
        .send(await prisma.filterRule.create({ data: filterRuleSchema.parse(req.body) })),
    );
    priv.patch<{ Params: { id: string } }>("/filter-rules/:id", async (req) =>
      prisma.filterRule.update({
        where: { id: req.params.id },
        data: filterRuleSchema.partial().parse(req.body),
      }),
    );
    priv.delete<{ Params: { id: string } }>("/filter-rules/:id", async (req) =>
      prisma.filterRule.delete({ where: { id: req.params.id } }),
    );

    // --- pricing (top-level config per vertical) ---
    priv.get("/pricing", async () =>
      prisma.setting.findMany({ where: { key: { startsWith: "pricing." } } }),
    );
    priv.put<{ Params: { vertical: string } }>("/pricing/:vertical", async (req) => {
      const key = `pricing.${req.params.vertical.toUpperCase()}`;
      const value = z.record(z.unknown()).parse(req.body);
      const json = value as Prisma.InputJsonValue;
      const saved = await prisma.setting.upsert({
        where: { key },
        create: { key, value: json },
        update: { value: json },
      });
      await syncQueue.add("reprice", { vertical: req.params.vertical.toUpperCase() });
      return saved;
    });

    // --- settings ---
    priv.get("/settings", async () => prisma.setting.findMany());
    priv.put<{ Params: { key: string } }>("/settings/:key", async (req) => {
      const { value } = z.object({ value: z.unknown() }).parse(req.body);
      return prisma.setting.upsert({
        where: { key: req.params.key },
        create: { key: req.params.key, value: value as never },
        update: { value: value as never },
      });
    });

    // --- sources & sync ---
    priv.get("/sources", async () =>
      prisma.source.findMany({ include: { _count: { select: { listings: true } } } }),
    );
    priv.patch<{ Params: { id: string } }>("/sources/:id", async (req) => {
      const body = z
        .object({
          enabled: z.boolean().optional(),
          config: z.record(z.unknown()).optional(),
          discoverCron: z.string().optional(),
          refreshCron: z.string().optional(),
        })
        .parse(req.body);
      return prisma.source.update({
        where: { id: req.params.id },
        data: { ...body, config: body.config as Prisma.InputJsonValue | undefined },
      });
    });
    priv.post<{ Params: { id: string } }>("/sources/:id/sync", async (req, reply) => {
      const { kind } = z
        .object({ kind: z.enum(["DISCOVER", "REFRESH"]).default("DISCOVER") })
        .parse(req.body ?? {});
      const job = await syncQueue.add(kind.toLowerCase(), { sourceId: req.params.id });
      return reply.status(202).send({ jobId: job.id });
    });
    priv.get("/sync-runs", async (req) => {
      const q = z
        .object({ sourceId: z.string().optional(), take: z.coerce.number().max(200).default(50) })
        .parse(req.query);
      return prisma.syncRun.findMany({
        where: { sourceId: q.sourceId },
        orderBy: { startedAt: "desc" },
        take: q.take,
        include: { source: { select: { key: true } } },
      });
    });

    // --- leads ---
    priv.get("/leads", async (req) => {
      const q = z
        .object({ status: z.string().optional(), vertical: z.enum(["CARS", "GADGETS"]).optional() })
        .parse(req.query);
      return prisma.lead.findMany({
        where: {
          ...(q.status && { status: q.status as never }),
          ...(q.vertical && { vertical: q.vertical }),
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          listing: { select: { title: true, slug: true, displayPriceUsd: true } },
          assignee: { select: { name: true } },
        },
      });
    });
    priv.patch<{ Params: { id: string } }>("/leads/:id", async (req) => {
      const body = z
        .object({
          status: z.enum(["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]).optional(),
          assigneeId: z.string().nullable().optional(),
        })
        .parse(req.body);
      return prisma.lead.update({ where: { id: req.params.id }, data: body });
    });

    // --- orders ---
    priv.get("/orders", async (req) => {
      const q = z
        .object({ stage: z.string().optional(), vertical: z.enum(["CARS", "GADGETS"]).optional() })
        .parse(req.query);
      return prisma.order.findMany({
        where: {
          ...(q.stage && { stage: q.stage as never }),
          ...(q.vertical && { vertical: q.vertical }),
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: { lead: true, listing: { select: { title: true, slug: true } } },
      });
    });
    priv.post("/orders", async (req, reply) => {
      const body = z
        .object({
          leadId: z.string(),
          listingId: z.string().optional(),
          vertical: z.enum(["CARS", "GADGETS"]),
          destination: z.enum(["NG", "GH"]),
          quote: z.unknown(),
          totalUsd: z.number(),
          totalLocal: z.number(),
          localCurrency: z.enum(["NGN", "GHS"]),
          fxRateUsed: z.number(),
          quoteExpiresAt: z.coerce.date(),
        })
        .parse(req.body);
      const order = await prisma.order.create({
        data: {
          ...body,
          quote: body.quote as never,
          events: { create: { stage: "QUOTE", note: "Quote issued", createdBy: req.admin?.id } },
        },
      });
      await prisma.lead.update({ where: { id: body.leadId }, data: { status: "QUOTED" } });
      return reply.status(201).send(order);
    });
    priv.post<{ Params: { id: string } }>("/orders/:id/events", async (req, reply) => {
      const body = z
        .object({
          stage: z.enum([
            "QUOTE",
            "PAID",
            "PURCHASED",
            "IN_TRANSIT",
            "AT_PORT",
            "CLEARED",
            "DELIVERED",
            "CANCELLED",
          ]),
          note: z.string().max(2000).optional(),
          attachment: z.string().optional(),
          externalRefs: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      const stamps = {
        PAID: { paidAt: new Date() },
        PURCHASED: { purchasedAt: new Date() },
        DELIVERED: { deliveredAt: new Date() },
      } as Record<string, object>;
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          stage: body.stage,
          ...(stamps[body.stage] ?? {}),
          externalRefs: {
            ...(order.externalRefs as Record<string, unknown>),
            ...(body.externalRefs ?? {}),
          } as Prisma.InputJsonValue,
          events: {
            create: {
              stage: body.stage,
              note: body.note,
              attachment: body.attachment,
              createdBy: req.admin?.id,
            },
          },
        },
        include: { events: { orderBy: { createdAt: "asc" } } },
      });
      if (body.stage === "PAID" || body.stage === "PURCHASED")
        await prisma.lead.update({ where: { id: order.leadId }, data: { status: "WON" } });
      return reply.status(201).send(updated);
    });
  });
};
