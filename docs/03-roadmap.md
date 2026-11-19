# Roadmap

Phases are sequential for one engineer. Each phase ends with something a customer can use.

## Phase 0 — Foundations (week 1–2)

**Business**

- Register the WhatsApp Business number, create brand pages, open a USD-capable business account.
- Open and fund the AuctionExport buyer account (deposit float ≥ $2,000). Email AuctionExport about a dealer/partner arrangement and written permission to display listings (see `04-legal-and-sourcing.md`).
- Sign up for a licensed auction data API and an Amazon product-data API (trial tiers).
- Sign a clearing agent at Tincan (Lagos) and a US package forwarder for gadgets.
- Publish the fee schedule and terms of service (WhatsApp order confirmation text).

**Engineering**

- Monorepo bootstrapped (this repo), CI green, Postgres/Redis via docker-compose, Prisma migrations, seed data.
- Source adapter interface + CSV adapter so the storefront can be built against real-looking data before any API keys arrive.

**Exit criteria:** `pnpm dev` runs API, worker and both storefronts locally with seeded listings.

## Phase 1 — Cars MVP (week 3–7)

- Cars source adapter (licensed API first; AuctionExport adapter only with written permission).
- `sync:discover`, `sync:refresh`, image mirroring, FX refresh.
- Admin: login, filter rules builder, listings table (hide/feature), sync runs view, settings (WhatsApp number, fees).
- cars.cedarce.com: home, grid + filters, detail with landed-cost estimator and WhatsApp CTA, how-it-works, fees, FAQ.
- Leads: `POST /v1/leads` + admin leads list with status.
- Monitoring: Sentry, uptime, stale-sync alert to WhatsApp/email.
- Deploy: Vercel (web), VPS (api+worker), managed Postgres, R2.

**Exit criteria:** a stranger can find a car, see a landed-cost estimate, start a WhatsApp chat, and ops can see that lead in admin. Sold cars disappear within an hour.

## Phase 2 — Gadgets MVP (week 8–10)

- Gadget source adapter (Amazon product-data API) with category/brand/price filter rules.
- Pricing rules per category; landed-cost estimator for air freight (weight-based).
- gadgets.cedarce.com reusing the same UI package with its own theme.
- Admin: pricing rules UI, product listings.

**Exit criteria:** same as Phase 1 for gadgets. First 10 gadget orders delivered.

## Phase 3 — Operations at scale (week 11–16)

- Orders pipeline in admin (quote → paid → purchased → shipped → at port → cleared → delivered) with timeline events, document uploads (invoice, BoL, title scan) and customer-facing status link (`cedarce.com/track/<token>`).
- Quote PDF generator from the estimator.
- WhatsApp Cloud API: templated order updates, lead auto-reply with the listing card; inbound messages logged against the lead.
- SEO: model landing pages, sitemaps, structured data (Vehicle / Product schema.org), "sold" pages with similar listings.
- Referral codes.

## Phase 4 — Growth (month 5+)

- Online payments (Paystack/Flutterwave) for gadgets first, then car deposits.
- Customer accounts, saved searches, price-drop alerts (email/WhatsApp).
- Inspection add-on ordering from the listing page.
- Second car data source for coverage; Canada and Chinese-EV sections if demand shows.
- Meilisearch if listing count or filter latency demands it.

## Definition of done per feature

Typed API contract in `packages/shared`, Prisma migration, unit test for pricing/estimate math, Playwright smoke for the storefront page, admin control for anything a non-engineer must change, and a runbook line in `05-operations-playbook.md`.
