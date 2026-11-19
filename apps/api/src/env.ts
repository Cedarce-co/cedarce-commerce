import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ADMIN_SESSION_SECRET: z.string().min(32),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3001,http://localhost:3002,http://localhost:3003"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default(""),
});

export const env = schema.parse(process.env);
