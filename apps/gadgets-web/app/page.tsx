import { apiGet, ListingCard, type ListingPage } from "@cedarce/ui";
import { SITE } from "./site";

export default async function Home() {
  const featured = await apiGet<ListingPage>(
    `/v1/${SITE.vertical}/listings?featured=true&pageSize=8`,
  ).catch(() => null);
  const latest = await apiGet<ListingPage>(`/v1/${SITE.vertical}/listings?pageSize=12`).catch(
    () => null,
  );
  const items = (featured?.items.length ? featured.items : latest?.items) ?? [];
  return (
    <div>
      <section className="rounded-2xl bg-brand-50 px-6 py-12 text-center">
        <h1 className="text-3xl font-extrabold text-brand-900 md:text-4xl">{SITE.tagline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Pick what you want, we send you a full landed-cost quote on WhatsApp, you pay by bank
          transfer, and we buy, ship and deliver it. One accountable team from click to collection.
        </p>
        <a
          href="/listings"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white"
        >
          Browse {SITE.vertical}
        </a>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">{featured?.items.length ? "Featured" : "Latest"}</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">Listings are syncing. Check back shortly.</p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l.id} l={l} href={`/listings/${l.slug}`} />
          ))}
        </div>
      </section>
      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          "1. Choose and chat",
          "2. Get a full quote, pay by transfer",
          "3. We buy, ship and deliver",
        ].map((s) => (
          <div key={s} className="rounded-xl border p-4 font-semibold">
            {s}
          </div>
        ))}
      </section>
    </div>
  );
}
