import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

async function setStatus(formData: FormData) {
  "use server";
  await adminMutate(`/leads/${formData.get("id")}`, "PATCH", { status: formData.get("status") });
  revalidatePath("/leads");
}
const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default async function Leads() {
  const leads =
    await adminGet<
      Array<{
        id: string;
        vertical: string;
        name: string;
        phone: string;
        country: string | null;
        status: string;
        message: string | null;
        createdAt: string;
        listing: { title: string; slug: string } | null;
      }>
    >("/leads");
  if (!leads) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl bg-gray-100 p-2">
            <h2 className="mb-2 text-xs font-bold text-gray-600">
              {s} ({leads.filter((l) => l.status === s).length})
            </h2>
            {leads
              .filter((l) => l.status === s)
              .map((l) => (
                <div key={l.id} className="mb-2 rounded-lg border bg-white p-2 text-xs">
                  <p className="font-semibold">
                    {l.name} <span className="font-normal text-gray-500">· {l.vertical}</span>
                  </p>
                  <a
                    href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 underline"
                  >
                    {l.phone}
                  </a>
                  {l.listing ? <p className="mt-1 text-gray-600">{l.listing.title}</p> : null}
                  {l.message ? <p className="mt-1 italic text-gray-500">{l.message}</p> : null}
                  <form action={setStatus} className="mt-2 flex gap-1">
                    <input type="hidden" name="id" value={l.id} />
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="rounded border px-1 py-0.5"
                    >
                      {STATUSES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <button className="rounded border px-2">Move</button>
                  </form>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
