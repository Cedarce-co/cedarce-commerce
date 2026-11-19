import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

async function toggle(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const field = String(formData.get("field"));
  const value = formData.get("value") === "true";
  await adminMutate(`/listings/${id}`, "PATCH", { [field]: value });
  revalidatePath("/listings");
}

export default async function Listings({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();
  const data = await adminGet<{
    total: number;
    items: Array<{
      id: string;
      vertical: string;
      title: string;
      status: string;
      featured: boolean;
      displayPriceUsd: string;
      sourcePriceUsd: string;
      source: { key: string };
      adminNote: string | null;
      lastSeenAt: string;
    }>;
  }>(`/listings?${qs}`);
  if (!data) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-bold">
        Listings <span className="text-base font-normal text-gray-500">({data.total})</span>
      </h1>
      <form className="mt-3 flex gap-2 text-sm">
        <select
          name="vertical"
          defaultValue={sp.vertical ?? ""}
          className="rounded border px-2 py-1"
        >
          <option value="">All verticals</option>
          <option>CARS</option>
          <option>GADGETS</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-2 py-1">
          <option value="">All statuses</option>
          {["ACTIVE", "HIDDEN", "SOLD", "REMOVED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="rounded bg-brand-600 px-3 py-1 text-white">Filter</button>
      </form>
      <table className="mt-4 w-full bg-white text-sm">
        <thead className="text-left text-xs text-gray-500">
          <tr>
            <th className="p-2">Title</th>
            <th className="p-2">Source</th>
            <th className="p-2">Status</th>
            <th className="p-2">Source $</th>
            <th className="p-2">Display $</th>
            <th className="p-2">Last seen</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="p-2">
                {l.title}
                <div className="text-xs text-gray-400">{l.adminNote}</div>
              </td>
              <td className="p-2">{l.source.key}</td>
              <td className="p-2">{l.status}</td>
              <td className="p-2">{l.sourcePriceUsd}</td>
              <td className="p-2">{l.displayPriceUsd}</td>
              <td className="p-2">{new Date(l.lastSeenAt).toLocaleDateString()}</td>
              <td className="flex gap-1 p-2">
                <form action={toggle}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="field" value="featured" />
                  <input type="hidden" name="value" value={String(!l.featured)} />
                  <button className="rounded border px-2 py-0.5 text-xs">
                    {l.featured ? "Unfeature" : "Feature"}
                  </button>
                </form>
                <form action={toggle}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="field" value="hidden" />
                  <input type="hidden" name="value" value={String(l.status !== "HIDDEN")} />
                  <button className="rounded border px-2 py-0.5 text-xs">
                    {l.status === "HIDDEN" ? "Show" : "Hide"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
