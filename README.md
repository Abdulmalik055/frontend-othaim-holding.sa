# Othaim Global Frontend

The public website and administration frontend for Othaim Global. It is a Next.js 16 App Router
application with localized Arabic and English public routes, while retaining the CMS Core admin,
authentication, CMS, media, settings, support, HR, users, and roles interfaces.

## Template provenance

This repository was created from the tracked files of CMS Core Frontend commit
`070ff9c91b814eda0c6b45f98bab69748514b2b0`. It is an independent repository and does not retain
the template repository's Git history, remote, environment files, dependencies, build output, or
deployment workflow.

The supplied static Othaim website is a visual and content reference only. Runtime public content
comes from the Othaim Global backend CMS.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- A running Othaim Global backend

## Local setup

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

The application listens on `http://localhost:3001` by default. Set `NEXT_PUBLIC_SITE_URL` to its
public origin and `NEXT_PUBLIC_BACKEND_URL` to the backend origin. Both values are browser-visible.

## Verification

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm test:e2e
pnpm build
```

`pnpm test:e2e` first creates an isolated production build wired only to the bundled local CMS
mock. It never targets the configured production API. Run the final `pnpm build` afterward with
the approved deployment origins in the environment.

CI performs verification only. Deployment is intentionally unconfigured until Othaim Global
domains, runner ownership, server paths, and secret management are approved.

See [DEPLOY.md](./DEPLOY.md) for the release contract and prerequisites.
