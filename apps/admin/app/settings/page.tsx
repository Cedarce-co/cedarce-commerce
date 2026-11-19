import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

async function save(formData: FormData) {
  "use server";
  const key = String(formData.get("key"));
  const raw = String(formData.get("value"));
  let value: unknown = raw;
  try {
    value = JSON.parse(raw);
  } catch {
    /* keep as string */
  }
  if (key.startsWith("pricing.")) await adminMutate(`/pricing/${key.split(".")[1]}`, "PUT", value);
  else await adminMutate(`/settings/${key}`, "PUT", { value });
  revalidatePath("/settings");
}

export default async function Settings() {
  const settings =
    await adminGet<Array<{ key: string; value: unknown; updatedAt: string }>>("/settings");
  if (!settings) redirect("/login");
  const known = [
    "whatsapp.number",
    "destination.NG.maxVehicleAgeYears",
    "destination.GH.maxVehicleAgeYears",
    "quote.validityHours",
    "fx.override.NGN",
    "fx.override.GHS",
    "pricing.CARS",
    "pricing.GADGETS",
  ];
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">
        Values are JSON. Pricing keys accept partial overrides of the defaults in
        packages/shared/src/pricing.ts and trigger a reprice.
      </p>
      <div className="mt-4 space-y-3">
        {known.map((k) => (
          <form
            key={k}
            action={save}
            className="flex items-start gap-2 rounded-xl border bg-white p-3"
          >
            <input type="hidden" name="key" value={k} />
            <label className="w-64 pt-1 text-sm font-medium">{k}</label>
            <textarea
              name="value"
              rows={k.startsWith("pricing.") ? 4 : 1}
              defaultValue={map[k] === undefined ? "" : JSON.stringify(map[k])}
              className="flex-1 rounded border px-2 py-1 font-mono text-xs"
            />
            <button className="rounded bg-brand-600 px-3 py-1 text-sm font-semibold text-white">
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
