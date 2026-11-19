export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Stable, unique listing slug: `<human-part>-<short source id>` */
export function listingSlug(title: string, sourceListingId: string): string {
  const tail = sourceListingId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(-8);
  return `${slugify(title)}-${tail}`;
}
