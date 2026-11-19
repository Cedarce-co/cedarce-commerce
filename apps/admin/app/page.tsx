import { redirect } from "next/navigation";
import { adminGet } from "../lib/api";

export default async function Dashboard() {
  const m = await adminGet<{
    activeByVertical: Array<{ vertical: string; _count: number }>;
    soldLast7d: number;
    leadsNew: number;
    ordersOpen: number;
    recentSyncRuns: Array<{
      id: string;
      kind: string;
      status: string;
      startedAt: string;
      stats: Record<string, number>;
      source: { key: string };
    }>;
  }>("/metrics");
  if (!m) redirect("/login");
  const tiles = [
    ...m.activeByVertical.map((a) => [`Active ${a.vertical.toLowerCase()}`, a._count] as const),
    ["Sold last 7 days", m.soldLast7d] as const,
    ["New leads", m.leadsNew] as const,
    ["Open orders", m.ordersOpen] as const,
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{k}</p>
            <p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-bold">Recent sync runs</h2>
      <table className="mt-2 w-full bg-white text-sm">
        <thead className="text-left text-xs text-gray-500">
          <tr>
            <th className="p-2">Source</th>
            <th className="p-2">Kind</th>
            <th className="p-2">Status</th>
            <th className="p-2">Started</th>
            <th className="p-2">Stats</th>
          </tr>
        </thead>
        <tbody>
          {m.recentSyncRuns.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.source.key}</td>
              <td className="p-2">{r.kind}</td>
              <td
                className={`p-2 font-semibold ${r.status === "FAILED" ? "text-red-600" : r.status === "SUCCESS" ? "text-green-700" : ""}`}
              >
                {r.status}
              </td>
              <td className="p-2">{new Date(r.startedAt).toLocaleString()}</td>
              <td className="p-2 font-mono text-xs">{JSON.stringify(r.stats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
