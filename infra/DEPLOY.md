# Deployment

| Component | Where | Notes |
|---|---|---|
| cars-web, gadgets-web, admin | Vercel (one project per app, root directory = `apps/<name>`) | Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| api + worker + redis | One VPS (2 vCPU / 4 GB) via `docker compose -f infra/docker-compose.prod.yml up -d` | Caddy terminates TLS for api.cedarce.com |
| Postgres | Managed (Neon / Supabase / RDS) | `pnpm --filter @cedarce/db migrate:deploy` on release |
| Media | Cloudflare R2 + CDN | Bucket `cedarce-media`, public read |
| DNS | cars., gadgets., admin. → Vercel; api. → VPS | |

Release: GitHub Actions runs typecheck + tests on every PR; `main` deploys web apps via Vercel Git integration and builds the VPS images via SSH (add the workflow once the VPS exists).

Alerts (Phase 1): uptime on `GET /health`; `GET /health` returns 503 if no successful REFRESH sync in 2 h.
