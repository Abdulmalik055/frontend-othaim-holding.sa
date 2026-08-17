# Othaim Global Frontend Release Contract

Automatic deployment is intentionally absent. Do not add a self-hosted runner, server path, PM2
process, or production hostname until the client infrastructure is confirmed.

## Required decisions

- Public production and staging origins
- Backend production and staging origins
- Repository remote and protected branch policy
- Runner ownership and least-privilege deployment credentials
- Immutable release directory and rollback strategy
- Process manager name (`othaim-global-frontend` is the reserved namespace)

## Build contract

Each release must be built from a clean checkout, never copied over an existing working directory.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm test:e2e
NEXT_PUBLIC_SITE_URL=https://www.example.com \
  NEXT_PUBLIC_BACKEND_URL=https://api.example.com \
  pnpm build
```

`pnpm test:e2e` deliberately rebuilds the application against its local mock API before launching
Playwright. Keep it before the final production-origin build so browser tests can never submit a
contact inquiry to a live environment.

Promote the immutable build only after health checks succeed. Keep the previous release and the
supplied static site available for rollback during the initial cutover.

## Required client approvals before launch

- Supply approved Privacy, Cookie, and Terms copy before exposing those links.
- Supply approved Open Graph artwork before configuring a CMS SEO image.
- Approve contact-form data handling and confirm the notification recipient.

## Later scale

Move CMS media to managed object storage behind a CDN. Add Turnstile or an equivalent challenge if
the endpoint rate limit and honeypot do not sufficiently control form spam.
