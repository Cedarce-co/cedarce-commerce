export const VERTICALS = ["CARS", "GADGETS"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const DESTINATIONS = ["NG", "GH"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const DESTINATION_CURRENCY: Record<Destination, "NGN" | "GHS"> = { NG: "NGN", GH: "GHS" };

export const DESTINATION_PORT: Record<Destination, string> = { NG: "Tincan, Lagos", GH: "Tema" };

/** Public listing statuses the storefront may render. */
export const VISIBLE_STATUSES = ["ACTIVE"] as const;

export const QUOTE_VALIDITY_HOURS = 24;
