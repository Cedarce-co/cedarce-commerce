import { buildApp } from "./app";
import { env } from "./env";

const app = await buildApp();
try {
  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
