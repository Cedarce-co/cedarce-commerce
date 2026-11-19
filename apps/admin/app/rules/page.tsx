import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

async function createRule(formData: FormData) {
  "use server";
  await adminMutate("/filter-rules", "POST", {
    vertical: formData.get("vertical"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    priority: Number(formData.get("priority") ?? 0),
    criteria: JSON.parse(String(formData.get("criteria") || "{}")),
  });
  revalidatePath("/rules");
}
async function toggleRule(formData: FormData) {
  "use server";
  await adminMutate(`/filter-rules/${formData.get("id")}`, "PATCH", {
    enabled: formData.get("enabled") === "true",
  });
  revalidatePath("/rules");
}
async function deleteRule(formData: FormData) {
  "use server";
  await adminMutate(`/filter-rules/${formData.get("id")}`, "DELETE");
  revalidatePath("/rules");
}

export default async function Rules() {
  const rules =
    await adminGet<
      Array<{
        id: string;
        vertical: string;
        name: string;
        kind: string;
        priority: number;
        enabled: boolean;
        criteria: unknown;
      }>
    >("/filter-rules");
  if (!rules) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-bold">Filter rules</h1>
      <p className="mt-1 text-sm text-gray-600">
        A listing is shown when it matches at least one enabled INCLUDE rule and no EXCLUDE rule.
        Criteria keys are documented in docs/06-admin-filters-and-pricing.md.
      </p>
      <form
        action={createRule}
        className="mt-4 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-6"
      >
        <select name="vertical" className="rounded border px-2 py-1">
          <option>CARS</option>
          <option>GADGETS</option>
        </select>
        <input
          name="name"
          required
          placeholder="Rule name"
          className="rounded border px-2 py-1 md:col-span-2"
        />
        <select name="kind" className="rounded border px-2 py-1">
          <option>INCLUDE</option>
          <option>EXCLUDE</option>
        </select>
        <input
          name="priority"
          type="number"
          defaultValue={0}
          className="rounded border px-2 py-1"
        />
        <button className="rounded bg-brand-600 px-3 py-1 font-semibold text-white">
          Add rule
        </button>
        <textarea
          name="criteria"
          rows={3}
          placeholder='{"make":["Toyota"],"yearMin":2012,"priceMaxUsd":15000}'
          className="rounded border px-2 py-1 font-mono text-xs md:col-span-6"
        />
      </form>
      <div className="mt-6 space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border bg-white p-3 ${r.enabled ? "" : "opacity-50"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`mr-2 rounded px-2 py-0.5 text-xs font-semibold ${r.kind === "INCLUDE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {r.kind}
                </span>
                <span className="mr-2 text-xs text-gray-500">
                  {r.vertical} · p{r.priority}
                </span>
                <strong>{r.name}</strong>
              </div>
              <div className="flex gap-1">
                <form action={toggleRule}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="enabled" value={String(!r.enabled)} />
                  <button className="rounded border px-2 py-0.5 text-xs">
                    {r.enabled ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteRule}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded border px-2 py-0.5 text-xs text-red-600">
                    Delete
                  </button>
                </form>
              </div>
            </div>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(r.criteria)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
