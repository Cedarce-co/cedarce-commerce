# Technical Architecture

One backend, one database, one worker fleet, three frontends. The two storefronts are separate Next.js apps (different domains, different branding) that talk to the same API. "Vertical" is a first-class concept everywhere so a listing, lead, order or rule always knows whether it belongs to cars or gadgets.

```
                 cars.cedarce.com        gadgets.cedarce.com       admin.cedarce.com
                 (apps/cars-web)         (apps/gadgets-web)        (apps/admin)
                        \                      |                       /
                         \                     |                      /
                          +---------- api.cedarce.com (apps/api) ----+
                                              |
                       +----------------------+----------------------+
                       |                      |                      |
                  PostgreSQL              Redis / BullMQ        Object storage + CDN
                  (packages/db)           (apps/worker)         (mirrored images)
                                              |
                       +----------------------+----------------------+
                       |                      |                      |
               Cars source adapters    Gadget source adapters     FX provider
               (packages/sources)      (packages/sources)
```

## Stack

| Layer            | Choice                                                                                                      | Why                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo                                                                                 | Shared packages, one lockfile, cached builds                                    |
| Language         | TypeScript everywhere                                                                                       | One language for API, workers, UIs                                              |
| API              | Fastify + Zod                                                                                               | Fast, small, typed request validation; easy to host on one VPS                  |
| Workers          | BullMQ on Redis                                                                                             | Scheduled syncs, retries, concurrency limits per source                         |
| DB               | PostgreSQL + Prisma                                                                                         | Relational data (listings, leads, orders); JSONB for source-specific attributes |
| Search/filtering | Postgres indexes + full-text                                                                                | Enough for < 100k listings; swap to Meilisearch later if needed                 |
| Frontends        | Next.js 15 (App Router), Tailwind, shared `@cedarce/ui`                                                     | SEO-critical listing pages are server-rendered                                  |
| Admin            | Next.js with server actions, auth via session cookie                                                        | Internal tool; same UI kit                                                      |
| Images           | Mirror to S3-compatible storage (Cloudflare R2), serve via CDN                                              | Never hotlink source images; needed for licensing and speed                     |
| Auth             | Admin only: email + password, Argon2, session cookies. Public sites have no login in v1                     | No online payments means no customer accounts needed yet                        |
| Messaging        | WhatsApp deep links (`wa.me`) in v1; WhatsApp Cloud API in phase 3                                          | Zero cost to start                                                              |
| Hosting          | Frontends on Netlify (one site per app); API + worker + Redis on one VPS (Docker Compose); managed Postgres (Neon/Supabase/RDS) | Cheap, boring                                                                   |
| Observability    | Pino logs, Sentry, uptime check on `/health` and on "last successful sync"                                  | Stale catalogue is the main failure mode                                        |

## Monorepo layout

```
cedarce-commerce/
├── apps/
│   ├── api/            Fastify API (public + admin routes)
│   ├── worker/         BullMQ workers: sync, refresh, images, fx
│   ├── cars-web/       Next.js storefront for cars.cedarce.com
│   ├── gadgets-web/    Next.js storefront for gadgets.cedarce.com
│   └── admin/          Next.js admin for admin.cedarce.com
├── packages/
│   ├── db/             Prisma schema, client, migrations, seed
│   ├── shared/         Zod schemas, DTOs, pricing + landed-cost math, constants
│   ├── sources/        Source adapter interface + adapters (auctionexport, auction-api, amazon-product-api, csv)
│   ├── ui/             Shared React components (listing card, filters, WhatsApp button, cost table)
│   └── config/         Shared tsconfig, eslint, tailwind preset
├── docs/               This plan
├── infra/              docker-compose, Caddyfile, GitHub Actions
└── turbo.json, pnpm-workspace.yaml, package.json
```

## Data model (see `packages/db/prisma/schema.prisma`)

- **Source** — a configured upstream (AuctionExport, auction data API, Amazon product API, CSV). Holds credentials reference, vertical, schedule, enabled flag.
- **Listing** — the vertical-agnostic row: source, source id, slug, title, status (`ACTIVE | SOLD | REMOVED | HIDDEN`), source price, computed display price, currency, first/last seen, content hash, featured flag. Unique on `(sourceId, sourceListingId)`.
- **Vehicle** (1:1 with Listing) — make, model, year, trim, body, fuel, transmission, drive, odometer, VIN, title type, damage codes, run-and-drive flag, auction house, lot, location, sale type (always `BUY_NOW` for display), estimated auction fee.
- **Product** (1:1 with Listing) — category, brand, model, ASIN, condition, specs JSON, rating, review count, weight/dimensions for freight estimate.
- **Image** — original URL, mirrored CDN URL, position.
- **FilterRule** — admin-defined include/exclude rules per vertical (`criteria` JSON such as `{make: ["Toyota","Lexus"], yearMin: 2012, titleType: ["clean"], priceMaxUsd: 15000}`). A listing is visible only if it matches at least one INCLUDE rule and no EXCLUDE rule.
- **PricingRule** — per vertical/category margin and fee lines used to compute `displayPrice` and the landed-cost estimate.
- **FxRate** — USD→NGN/GHS snapshots.
- **Lead** — WhatsApp/contact enquiry tied to a listing, with pipeline status, assignee, UTM source.
- **Order** — once a lead converts: quote breakdown JSON, totals, stage, references (auction invoice, BoL, tracking), timeline via **OrderEvent**.
- **SyncRun** — one per worker run: counts of seen/new/updated/sold/errors; this is what the staleness monitor reads.
- **AdminUser**, **Setting**.

## Sync pipeline (the core of the product)

Each source adapter implements:

```ts
interface SourceAdapter {
  key: string; // "auctionexport" | "auction-api" | "amazon-product-api" | "csv"
  vertical: "CARS" | "GADGETS";
  search(query: SourceQuery): AsyncIterable<RawListing>; // paged crawl of the source's Buy Now inventory for the admin's filters
  fetch(sourceListingId: string): Promise<RawListing | null>; // single-item refresh; null means gone/sold
}
```

Workers:

1. **`sync:discover`** (every 2–6 h per source) — runs the admin's FilterRules as source queries, upserts listings, marks new ones `ACTIVE`, queues image mirroring. Buy Now only: the adapter is asked for Buy Now and anything without a fixed price is dropped before upsert.
2. **`sync:refresh`** (every 15–60 min) — re-fetches every `ACTIVE` listing (rate-limited per source). `null` or "sold" → status `SOLD`, `removedAt` set. Price change → recompute display price. Listings not seen in `discover` for 48 h are `REMOVED`.
3. **`images:mirror`** — downloads, resizes (3 sizes), uploads to R2, stores CDN URLs.
4. **`fx:refresh`** (hourly) — pulls USD→NGN/GHS from a rates provider; display prices are recomputed lazily from the latest rate.
5. **`listings:reprice`** — on any PricingRule or FxRate change.

Every run writes a `SyncRun`. Alert if no successful `refresh` in 2 h or `discover` in 12 h.

## API surface (v1)

Public (no auth, rate-limited, cached 60 s):

- `GET /v1/:vertical/listings?make=&model=&yearMin=&yearMax=&priceMin=&priceMax=&bodyStyle=&titleType=&q=&sort=&page=`
- `GET /v1/:vertical/listings/:slug`
- `GET /v1/:vertical/facets` — available makes/models/years/categories with counts for the filter UI
- `GET /v1/:vertical/estimate?listingId=&destination=NG|GH` — landed-cost breakdown
- `POST /v1/leads` — contact form / "I'm interested" with listing ref; returns the WhatsApp deep link

Admin (session auth):

- `GET/PATCH /v1/admin/listings` (hide, feature, override price)
- `CRUD /v1/admin/filter-rules`, `/pricing-rules`, `/sources`
- `POST /v1/admin/sources/:id/sync` (run now)
- `GET /v1/admin/sync-runs`
- `CRUD /v1/admin/leads`, `/orders`, `/orders/:id/events`
- `GET /v1/admin/metrics`

## Storefront pages (both verticals share components)

- Home: hero, featured, popular searches, "how it works", trust strip.
- Listing grid with URL-driven filters (SEO-friendly `/cars/toyota/camry?year=2015-2020`).
- Listing detail: gallery, specs, damage/condition (cars), landed-cost estimator with destination selector, **"Chat on WhatsApp"** button that opens `wa.me/<number>?text=Hi Cedarce, I'm interested in <title> (ref <slug>, $<price>)`, "Request a quote" form as fallback.
- "How it works", "Fees", "FAQ", "Delivered orders".
- Sold listings return a page saying "sold, here are similar" instead of 404 (keeps SEO value).

## Security and compliance basics

- Admin behind auth + IP allowlist optional; rate limiting on public POST.
- Secrets in environment only; `.env.example` documents them.
- Personal data (names, phones) only in Lead/Order; retention policy 24 months; export/delete endpoint for requests (NDPR).
- Source credentials never shipped to browsers; all source calls run server-side in workers.
