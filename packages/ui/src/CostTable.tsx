import type { Estimate } from "./api";
import { fmtLocal, fmtUsd } from "./api";

export function CostTable({ e }: { e: Estimate }) {
  return (
    <div className="rounded-xl border">
      <table className="w-full text-sm">
        <tbody>
          {e.lines.map((l) => (
            <tr key={l.key} className="border-b last:border-0">
              <td className="px-3 py-2">
                {l.label}
                {l.estimate ? <span className="ml-1 text-xs text-gray-400">(est.)</span> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(l.amountUsd)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                {fmtLocal(l.amountLocal, e.currency)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold">
            <td className="px-3 py-2">Estimated total landed</td>
            <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(e.totalUsd)}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {fmtLocal(e.totalLocal, e.currency)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-gray-500">
        {e.disclaimer}
        {e.fxRate ? ` Rate used: 1 USD = ${e.fxRate.toLocaleString()} ${e.currency}.` : ""}
      </p>
    </div>
  );
}
