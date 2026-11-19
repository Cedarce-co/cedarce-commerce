# Cedarce Commerce

Monorepo for Cedarce's assisted-buying storefronts:

- **cars.cedarce.com** — Buy Now vehicles from North American auctions, bought and shipped on the customer's behalf.
- **gadgets.cedarce.com** — phones and laptops sourced from US retailers, bought and delivered on the customer's behalf.

One API, one database, one worker fleet, three Next.js frontends (two storefronts + admin). Customers talk to us on WhatsApp; there are no online payments in v1.

## Read first

| Doc | What it covers |
|---|---|
| [docs/01-business-plan.md](docs/01-business-plan.md) | Model, pricing, costs, go-to-market, risks, targets |
| [docs/02-technical-architecture.md](docs/02-technical-architecture.md) | Stack, monorepo layout, data model, sync pipeline, API |
| [docs/03-roadmap.md](docs/03-roadmap.md) | Phases 0–4 with exit criteria |
| [docs/04-legal-and-sourcing.md](docs/04-legal-and-sourcing.md) | AuctionExport and Amazon terms, licensed data strategy, import rules |
| [docs/05-operations-playbook.md](docs/05-operations-playbook.md) | Order runbooks and WhatsApp templates |
| [docs/06-admin-filters-and-pricing.md](docs/06-admin-filters-and-pricing.md) | Filter rules and pricing rules the admin controls |

## Layout

```
apps/api          Fastify API (public + admin)
apps/worker       BullMQ workers: discover, refresh, images, fx
apps/cars-web     Next.js storefront (cars.cedarce.com)
apps/gadgets-web  Next.js storefront (gadgets.cedarce.com)
apps/admin        Next.js admin (admin.cedarce.com)
packages/db       Prisma schema + client + seed
packages/shared   Zod schemas, DTOs, pricing + landed-cost math
packages/sources  Source adapter interface + adapters
packages/ui       Shared React components
packages/config   Shared tsconfig / tailwind preset
infra             docker-compose, Caddy, deployment notes
```

## Quick start

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d        # Postgres + Redis
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

Ports: API 4000, cars-web 3001, gadgets-web 3002, admin 3003.

## Conventions

- Everything that a non-engineer must change (which cars show, margins, WhatsApp number) is an admin setting, never code.
- Source credentials only ever live in the worker/API environment.
- Every listing keeps its `sourceId` and `sourceUrl` so content can be removed per source in one action.
- Vertical (`CARS` | `GADGETS`) is explicit on every listing, lead, order and rule.
