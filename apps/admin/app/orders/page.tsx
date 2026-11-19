import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

const STAGES = [
  "QUOTE",
  "PAID",
  "PURCHASED",
  "IN_TRANSIT",
  "AT_PORT",
  "CLEARED",
  "DELIVERED",
  "CANCELLED",
];
async function addEvent(formData: FormData) {
  "use server";
  await adminMutate(`/orders/${formData.get("id")}/events`, "POST", {
    stage: formData.get("stage"),
    note: formData.get("note") || undefined,
  });
  revalidatePath("/orders");
}

export default async function Orders() {
  const orders =
    await adminGet<
      Array<{
        id: string;
        vertical: string;
        stage: string;
        destination: string;
        totalUsd: string;
        totalLocal: string;
        localCurrency: string;
        trackingToken: string;
        updatedAt: string;
        lead: { name: string; phone: string };
        listing: { title: string } | null;
      }>
    >("/orders");
  if (!orders) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create an order from a lead via the API (POST /v1/admin/orders) or the quote tool (Phase 3).
        Move stages here; every move is logged.
      </p>
      <table className="mt-4 w-full bg-white text-sm">
        <thead className="text-left text-xs text-gray-500">
          <tr>
            <th className="p-2">Customer</th>
            <th className="p-2">Item</th>
            <th className="p-2">Dest</th>
            <th className="p-2">Total</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t align-top">
              <td className="p-2">
                {o.lead.name}
                <div className="text-xs text-gray-500">{o.lead.phone}</div>
              </td>
              <td className="p-2">
                {o.listing?.title ?? "—"}
                <div className="text-xs text-gray-400">{o.vertical}</div>
              </td>
              <td className="p-2">{o.destination}</td>
              <td className="p-2">
                ${o.totalUsd}
                <div className="text-xs text-gray-500">
                  {o.localCurrency} {o.totalLocal}
                </div>
              </td>
              <td className="p-2 font-semibold">{o.stage}</td>
              <td className="p-2">
                <form action={addEvent} className="flex gap-1">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="stage" defaultValue={o.stage} className="rounded border px-1">
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input name="note" placeholder="Note / ref" className="rounded border px-1" />
                  <button className="rounded border px-2">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
