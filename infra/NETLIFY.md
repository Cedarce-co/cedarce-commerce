# Netlify deployment (frontends only)

The three Next.js apps deploy to Netlify as **three separate sites** from this one repository. The API and the
worker are long-running processes (Fastify + BullMQ) and cannot run on Netlify; see `DEPLOY.md` for the VPS setup.
Until the API is live, the storefronts render with an empty catalogue.

| Site | Base directory | Domain | Env vars |
|---|---|---|---|
| cedarce-cars | `apps/cars-web` | cars.cedarce.com | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| cedarce-gadgets | `apps/gadgets-web` | gadgets.cedarce.com | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| cedarce-admin | `apps/admin` | admin.cedarce.com | `NEXT_PUBLIC_API_URL` |

Each app carries its own `netlify.toml` (build command, publish dir, Next.js runtime plugin, Node 22).

## One-time setup with the CLI (personal Netlify account)

Requires `NETLIFY_AUTH_TOKEN` from User settings → Applications → Personal access tokens.

```bash
npx netlify-cli@27 sites:create --name cedarce-cars --disable-linking
npx netlify-cli@27 sites:create --name cedarce-gadgets --disable-linking
npx netlify-cli@27 sites:create --name cedarce-admin --disable-linking
```

Then link the repo in the Netlify UI (Site configuration → Build & deploy → Continuous deployment) with the base
directory from the table, or deploy from the CLI:

```bash
npx netlify-cli@27 deploy --build --prod --filter @cedarce/cars-web --site cedarce-cars
```

```bash
npx netlify-cli@27 deploy --build --prod --filter @cedarce/gadgets-web --site cedarce-gadgets
```

```bash
npx netlify-cli@27 deploy --build --prod --filter @cedarce/admin --site cedarce-admin
```

Set the env vars per site with `npx netlify-cli@27 env:set NEXT_PUBLIC_API_URL https://api.cedarce.com --site <name>`.

## Custom domains

Add `cars.cedarce.com`, `gadgets.cedarce.com` and `admin.cedarce.com` as custom domains on the respective sites and
point CNAME records at the Netlify site hostnames. Netlify issues TLS automatically.
