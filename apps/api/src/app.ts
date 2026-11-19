import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";
import { healthRoutes } from "./routes/health";
import { listingRoutes } from "./routes/listings";
import { leadRoutes } from "./routes/leads";
import { estimateRoutes } from "./routes/estimate";
import { adminRoutes } from "./routes/admin/index";

export async function buildApp() {
  const app = Fastify({ logger: { level: env.NODE_ENV === "production" ? "info" : "debug" } });

  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(cookie, { secret: env.ADMIN_SESSION_SECRET });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  app.setErrorHandler((error: unknown, _req, reply) => {
    const err = error as Error & { statusCode?: number; validation?: unknown; issues?: unknown };
    if (err.validation || err.name === "ZodError") {
      return reply
        .status(400)
        .send({ error: "Invalid request", details: err.issues ?? err.message });
    }
    app.log.error(err);
    return reply
      .status(err.statusCode ?? 500)
      .send({ error: err.statusCode ? err.message : "Internal error" });
  });

  await app.register(healthRoutes);
  await app.register(listingRoutes, { prefix: "/v1" });
  await app.register(estimateRoutes, { prefix: "/v1" });
  await app.register(leadRoutes, { prefix: "/v1" });
  await app.register(adminRoutes, { prefix: "/v1/admin" });

  return app;
}
