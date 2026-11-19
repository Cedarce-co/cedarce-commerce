import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminGet, adminMutate } from "../../lib/api";

async function runSync(formData: FormData) {
  "use server";
  await adminMutate(`/sources/${formData.get("id")}/sync`, "POST", { kind: formData.get("kind") });
  revalidatePath("/sources");
}
async function toggleSource(formData: FormData) {
  "use server";
  await adminMutate(`/sources/${formData.get("id")}`, "PATCH", {
    enabled: formData.get("enabled") === "true",
  });
  revalidatePath("/sources");
}

export default async function Sources() {
  const [sources, runs] = await Promise.all([
    adminGet<
      Array<{
        id: string;
        key: string;
        name: string;
        vertical: string;
        enabled: boolean;
        discoverCron: string;
        refreshCron: string;
        lastDiscoverAt: string | null;
        lastRefreshAt: string | null;
        _count: { listings: number };
      }>
    >("/sources"),
    adminGet<
      Array<{
        id: string;
        kind: string;
        status: string;
        startedAt: string;
        finishedAt: string | null;
        stats: Record<string, number>;
        error: string | null;
        source: { key: string };
      }>
    >("/sync-runs?take=30"),
  ]);
  if (!sources || !runs) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-bold">Sources & sync</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sources.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border bg-white p-4 ${s.enabled ? "" : "opacity-60"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <strong>{s.name}</strong>{" "}
                <span className="text-xs text-gray-500">
                  {s.key} · {s.vertical}
                </span>
              </div>
              <form action={toggleSource}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="enabled" value={String(!s.enabled)} />
                <button className="rounded border px-2 py-0.5 text-xs">
                  {s.enabled ? "Disable" : "Enable"}
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {s._count.listings} listings · discover <code>{s.discoverCron}</code> (last{" "}
              {s.lastDiscoverAt ? new Date(s.lastDiscoverAt).toLocaleString() : "never"}) · refresh{" "}
              <code>{s.refreshCron}</code> (last{" "}
              {s.lastRefreshAt ? new Date(s.lastRefreshAt).toLocaleString() : "never"})
            </p>
            <div className="mt-2 flex gap-2">
              {["DISCOVER", "REFRESH"].map((k) => (
                <form key={k} action={runSync}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="kind" value={k} />
                  <button className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white">
                    Run {k.toLowerCase()} now
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-bold">Sync runs</h2>
      <table className="mt-2 w-full bg-white text-sm">
        <thead className="text-left text-xs text-gray-500">
          <tr>
            <th className="p-2">Source</th>
            <th className="p-2">Kind</th>
            <th className="p-2">Status</th>
            <th className="p-2">Started</th>
            <th className="p-2">Stats / error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.source.key}</td>
              <td className="p-2">{r.kind}</td>
              <td
                className={`p-2 font-semibold ${r.status === "FAILED" ? "text-red-600" : r.status === "SUCCESS" ? "text-green-700" : ""}`}
              >
                {r.status}
              </td>
              <td className="p-2">{new Date(r.startedAt).toLocaleString()}</td>
              <td className="p-2 font-mono text-xs">{r.error ?? JSON.stringify(r.stats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
