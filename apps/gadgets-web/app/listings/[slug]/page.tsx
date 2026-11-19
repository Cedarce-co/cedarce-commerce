import { notFound } from "next/navigation";
import {
  apiGet,
  CostTable,
  ListingCard,
  WhatsAppButton,
  fmtUsd,
  type Estimate,
  type ListingPage,
  type PublicListing,
} from "@cedarce/ui";
import { SITE } from "../../site";

export default async function ListingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to = "NG" } = await searchParams;
  const l = await apiGet<PublicListing>(`/v1/${SITE.vertical}/listings/${slug}`).catch(() => null);
  if (!l) notFound();
  const sold = l.status !== "ACTIVE";
  const [estimate, similar] = await Promise.all([
    sold
      ? null
      : apiGet<Estimate>(`/v1/${SITE.vertical}/estimate?listingId=${l.id}&destination=${to}`).catch(
          () => null,
        ),
    apiGet<ListingPage>(
      `/v1/${SITE.vertical}/listings?pageSize=4&${l.vehicle ? `make=${encodeURIComponent(l.vehicle.make)}` : l.product ? `brand=${encodeURIComponent(l.product.brand)}` : ""}`,
    ).catch(() => null),
  ]);
  const specs: Array<[string, unknown]> = l.vehicle
    ? [
        ["Year", l.vehicle.year],
        ["Make", l.vehicle.make],
        ["Model", l.vehicle.model],
        ["Trim", l.vehicle.trim],
        ["Body", l.vehicle.bodyStyle],
        ["Title", l.vehicle.titleType],
        ["Primary damage", l.vehicle.primaryDamage],
        ["Secondary damage", l.vehicle.secondaryDamage],
        [
          "Runs & drives",
          l.vehicle.runAndDrive == null ? null : l.vehicle.runAndDrive ? "Yes" : "No",
        ],
        ["Keys", l.vehicle.keys == null ? null : l.vehicle.keys ? "Yes" : "No"],
        [
          "Odometer",
          l.vehicle.odometer
            ? `${l.vehicle.odometer.toLocaleString()} ${l.vehicle.odometerUnit}`
            : null,
        ],
        ["Engine", l.vehicle.engine],
        ["Transmission", l.vehicle.transmission],
        ["Drive", l.vehicle.drive],
        ["Fuel", l.vehicle.fuel],
        ["Colour", l.vehicle.color],
        ["Location", l.vehicle.locationState ? `${l.vehicle.locationState}, USA` : null],
      ]
    : l.product
      ? [
          ["Brand", l.product.brand],
          ["Model", l.product.model],
          ["Condition", l.product.condition],
          [
            "Rating",
            l.product.rating ? `${l.product.rating} ★ (${l.product.reviewCount ?? 0})` : null,
          ],
          ...Object.entries(l.product.specs ?? {}),
        ]
      : [];

  return (
    <div className="grid gap-8 md:grid-cols-5">
      <div className="md:col-span-3">
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          {l.images[0] ? (
            <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {l.images.slice(1, 6).map((src) => (
            <img key={src} src={src} alt="" className="aspect-[4/3] rounded object-cover" />
          ))}
        </div>
        <h2 className="mt-6 text-lg font-bold">Details</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {specs
            .filter(([, v]) => v != null && v !== "")
            .map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-1">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium">{String(v)}</dd>
              </div>
            ))}
        </dl>
      </div>
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold">{l.title}</h1>
        <p className="mt-1 text-xs text-gray-500">Ref {l.slug}</p>
        {sold ? (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-semibold">This one has been sold.</p>
            <p className="text-sm">
              Chat with us and we will find you a similar one, or browse the suggestions below.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-3xl font-extrabold text-brand-700">{fmtUsd(l.priceUsd)}</p>
            <p className="text-xs text-gray-500">
              Item + fees we can confirm today. Shipping and duty below.
            </p>
            <div className="mt-4 flex gap-2 text-sm">
              {(["NG", "GH"] as const).map((d) => (
                <a
                  key={d}
                  href={`?to=${d}`}
                  className={`rounded-full border px-3 py-1 ${to === d ? "bg-brand-600 text-white" : ""}`}
                >
                  {d === "NG" ? "Deliver to Nigeria" : "Deliver to Ghana"}
                </a>
              ))}
            </div>
            <div className="mt-3">
              {estimate ? (
                <CostTable e={estimate} />
              ) : (
                <p className="text-sm text-gray-500">
                  Estimate unavailable right now. Ask us on WhatsApp.
                </p>
              )}
            </div>
            <div className="mt-4">
              <WhatsAppButton
                number={SITE.whatsapp}
                brand={SITE.brand}
                title={l.title}
                ref={l.slug}
                priceUsd={l.priceUsd}
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              No online payment. We quote, you pay by bank transfer, we buy and deliver.
            </p>
          </>
        )}
      </div>
      {similar?.items.length ? (
        <section className="md:col-span-5">
          <h2 className="mb-3 text-lg font-bold">Similar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {similar.items
              .filter((s) => s.id !== l.id)
              .slice(0, 4)
              .map((s) => (
                <ListingCard key={s.id} l={s} href={`/listings/${s.slug}`} />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
