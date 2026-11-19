import { apiGet, FilterBar, ListingCard, type ListingPage } from "@cedarce/ui";
import { SITE } from "../site";

export const metadata = { title: "Browse" };

export default async function Listings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();
  const [page, facets] = await Promise.all([
    apiGet<ListingPage>(`/v1/${SITE.vertical}/listings?${qs}`).catch(() => ({
      total: 0,
      page: 1,
      pageSize: 24,
      items: [],
    })),
    apiGet<Record<string, never>>(`/v1/${SITE.vertical}/facets`).catch(() => ({})),
  ]);
  const fields =
    SITE.vertical === "cars"
      ? [
          { name: "make", label: "Make", facet: "makes" },
          { name: "bodyStyle", label: "Body", facet: "bodyStyles" },
          { name: "yearMin", label: "Year from", type: "number" as const },
          { name: "yearMax", label: "Year to", type: "number" as const },
          { name: "priceMax", label: "Max price $", type: "number" as const },
        ]
      : [
          { name: "category", label: "Category", facet: "categories" },
          { name: "brand", label: "Brand", facet: "brands" },
          { name: "priceMin", label: "Min price $", type: "number" as const },
          { name: "priceMax", label: "Max price $", type: "number" as const },
        ];
  const pages = Math.max(1, Math.ceil(page.total / page.pageSize));
  const link = (p: number) =>
    `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v) as [string, string][]), page: String(p) })}`;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Browse {SITE.vertical}{" "}
        <span className="text-base font-normal text-gray-500">({page.total})</span>
      </h1>
      <FilterBar facets={facets} current={sp} fields={fields} />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {page.items.map((l) => (
          <ListingCard key={l.id} l={l} href={`/listings/${l.slug}`} />
        ))}
      </div>
      {page.items.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          No matches. Try widening your filters or chat with us and we will find it.
        </p>
      ) : null}
      <div className="mt-8 flex justify-center gap-2 text-sm">
        {page.page > 1 ? (
          <a className="rounded border px-3 py-1" href={link(page.page - 1)}>
            Previous
          </a>
        ) : null}
        <span className="px-3 py-1 text-gray-500">
          Page {page.page} of {pages}
        </span>
        {page.page < pages ? (
          <a className="rounded border px-3 py-1" href={link(page.page + 1)}>
            Next
          </a>
        ) : null}
      </div>
    </div>
  );
}
