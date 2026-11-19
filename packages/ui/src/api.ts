/** Tiny typed fetch client shared by the storefronts and admin. Server components call it directly. */
export interface PublicListing {
  id: string;
  vertical: "CARS" | "GADGETS";
  slug: string;
  title: string;
  status: string;
  priceUsd: number;
  featured: boolean;
  images: string[];
  vehicle: null | {
    make: string;
    model: string;
    year: number;
    trim: string | null;
    bodyStyle: string | null;
    fuel: string | null;
    transmission: string | null;
    drive: string | null;
    engine: string | null;
    color: string | null;
    odometer: number | null;
    odometerUnit: string | null;
    titleType: string;
    primaryDamage: string | null;
    secondaryDamage: string | null;
    runAndDrive: boolean | null;
    keys: boolean | null;
    locationState: string | null;
    auctionHouse: string | null;
  };
  product: null | {
    category: string;
    brand: string;
    model: string;
    condition: string;
    rating: number | null;
    reviewCount: number | null;
    specs: Record<string, unknown>;
    inStock: boolean;
  };
}
export interface ListingPage {
  total: number;
  page: number;
  pageSize: number;
  items: PublicListing[];
}
export interface Estimate {
  currency: string;
  fxRate: number | null;
  lines: Array<{
    key: string;
    label: string;
    amountUsd: number;
    amountLocal: number | null;
    estimate?: boolean;
  }>;
  totalUsd: number;
  totalLocal: number | null;
  disclaimer: string;
}

export function apiBase(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    next: { revalidate: 60, ...(init?.next ?? {}) },
  } as RequestInit);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}

export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const fmtLocal = (n: number | null, cur: string) =>
  n == null
    ? "—"
    : `${cur === "NGN" ? "₦" : cur === "GHS" ? "GH₵" : cur + " "}${n.toLocaleString("en-US")}`;
