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
pnpm lint
pnpm test
pnpm exec tsc --noEmit
NEXT_PUBLIC_SITE_URL=https://www.example.com \
  NEXT_PUBLIC_BACKEND_URL=https://api.example.com \
  pnpm build
```

Promote the immutable build only after health checks succeed. Keep the previous release and the
supplied static site available for rollback during the initial cutover.
