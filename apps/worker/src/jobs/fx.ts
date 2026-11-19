import { prisma } from "@cedarce/db";
import type { JobDeps } from "./context";

/** Pull USD→NGN/GHS. Default provider is open.er-api.com (free, hourly); swap via FX_API_URL. Admin can also override via Setting `fx.override.<CUR>`. */
export async function refreshFx(deps: JobDeps) {
  const url = process.env["FX_API_URL"] ?? "https://open.er-api.com/v6/latest/USD";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fx provider ${res.status}`);
  const body = (await res.json()) as { rates?: Record<string, number> };
  const out: Record<string, number> = {};
  for (const cur of ["NGN", "GHS"]) {
    const override = await prisma.setting.findUnique({ where: { key: `fx.override.${cur}` } });
    const rate = override ? Number(override.value) : body.rates?.[cur];
    if (!rate) continue;
    await prisma.fxRate.create({ data: { base: "USD", quote: cur, rate } });
    out[cur] = rate;
  }
  deps.log.info(out, "fx updated");
  return out;
}
