/** URL-driven filter bar (GET form) so every filter state is a shareable, indexable URL. */
export function FilterBar({
  facets,
  current,
  fields,
}: {
  facets: Record<string, Array<{ value: string; count: number }> | number | null | undefined>;
  current: Record<string, string | undefined>;
  fields: Array<{ name: string; label: string; facet?: string; type?: "select" | "number" }>;
}) {
  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-2 rounded-xl border bg-gray-50 p-3 md:grid-cols-6"
    >
      {fields.map((f) => {
        const opts = f.facet
          ? (facets[f.facet] as Array<{ value: string; count: number }> | undefined)
          : undefined;
        return (
          <label key={f.name} className="text-xs">
            <span className="mb-1 block text-gray-600">{f.label}</span>
            {opts ? (
              <select
                name={f.name}
                defaultValue={current[f.name] ?? ""}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                <option value="">Any</option>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value} ({o.count})
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                defaultValue={current[f.name] ?? ""}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            )}
          </label>
        );
      })}
      <div className="flex items-end gap-2">
        <button className="w-full rounded bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white">
          Apply
        </button>
        <a href="?" className="text-xs text-gray-500">
          Reset
        </a>
      </div>
    </form>
  );
}
