import type { Image, Listing, Product, Vehicle } from "@cedarce/db";

export type ListingWithRelations = Listing & {
  vehicle: Vehicle | null;
  product: Product | null;
  images: Image[];
};

export function toPublicListing(l: ListingWithRelations) {
  return {
    id: l.id,
    vertical: l.vertical,
    slug: l.slug,
    title: l.title,
    status: l.status,
    priceUsd: Number(l.displayPriceUsd),
    featured: l.featured,
    images: l.images.sort((a, b) => a.position - b.position).map((i) => i.cdnUrl ?? i.sourceUrl),
    vehicle: l.vehicle
      ? {
          make: l.vehicle.make,
          model: l.vehicle.model,
          year: l.vehicle.year,
          trim: l.vehicle.trim,
          bodyStyle: l.vehicle.bodyStyle,
          fuel: l.vehicle.fuel,
          transmission: l.vehicle.transmission,
          drive: l.vehicle.drive,
          engine: l.vehicle.engine,
          color: l.vehicle.color,
          odometer: l.vehicle.odometer,
          odometerUnit: l.vehicle.odometerUnit,
          titleType: l.vehicle.titleType,
          primaryDamage: l.vehicle.primaryDamage,
          secondaryDamage: l.vehicle.secondaryDamage,
          runAndDrive: l.vehicle.runAndDrive,
          keys: l.vehicle.keys,
          locationState: l.vehicle.locationState,
          auctionHouse: l.vehicle.auctionHouse,
          // VIN and lot number are deliberately not public: they let a visitor bypass Cedarce.
        }
      : null,
    product: l.product
      ? {
          category: l.product.category,
          brand: l.product.brand,
          model: l.product.model,
          condition: l.product.condition,
          rating: l.product.rating ? Number(l.product.rating) : null,
          reviewCount: l.product.reviewCount,
          specs: l.product.specs,
          inStock: l.product.inStock,
        }
      : null,
    firstSeenAt: l.firstSeenAt,
    updatedAt: l.updatedAt,
  };
}
