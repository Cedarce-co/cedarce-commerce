import type { FastifyReply, FastifyRequest } from "fastify";

export interface AdminSession {
  id: string;
  role: "OWNER" | "OPS" | "VIEWER";
}

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminSession;
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const raw = req.cookies["cedarce_admin"];
  const unsigned = raw ? req.unsignCookie(raw) : null;
  if (!unsigned?.valid || !unsigned.value) return reply.status(401).send({ error: "Unauthorized" });
  req.admin = JSON.parse(unsigned.value) as AdminSession;
  if (req.method !== "GET" && req.admin.role === "VIEWER")
    return reply.status(403).send({ error: "Read-only role" });
}
