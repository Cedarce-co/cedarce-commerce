import type { PublicListing } from "./api";
import { fmtUsd } from "./api";

export function ListingCard({ l, href }: { l: PublicListing; href: string }) {
  const img = l.images[0];
  const sub = l.vehicle
    ? [
        l.vehicle.titleType === "CLEAN"
          ? "Clean title"
          : l.vehicle.titleType === "SALVAGE"
            ? "Salvage title"
            : l.vehicle.titleType,
        l.vehicle.odometer
          ? `${l.vehicle.odometer.toLocaleString()} ${l.vehicle.odometerUnit}`
          : null,
        l.vehicle.locationState,
      ]
        .filter(Boolean)
        .join(" · ")
    : l.product
      ? [
          l.product.brand,
          l.product.condition === "NEW" ? "Brand new" : l.product.condition,
          l.product.rating ? `★ ${l.product.rating}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="p-3">
        {l.featured ? (
          <span className="mb-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
            Featured
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold">{l.title}</h3>
        <p className="mt-1 text-xs text-gray-500">{sub}</p>
        <p className="mt-2 text-base font-bold text-brand-700">
          {fmtUsd(l.priceUsd)}{" "}
          <span className="text-xs font-normal text-gray-500">+ shipping & duty</span>
        </p>
      </div>
    </a>
  );
}
