# CMS Core Frontend

The administrative web application for the CMS Core platform. It gives authorized staff a
bilingual interface for managing website content, media, careers, support requests, users,
roles, and platform settings.

The application is built with Next.js App Router and communicates with the companion NestJS
API through same-origin rewrites. Arabic is the default locale, with complete Arabic and
English routing and right-to-left support.

## What the application provides

- Permission-aware administration dashboard
- Structured CMS pages and reusable, presentation-neutral section editors
- CMS image, video, and document uploads
- Job and candidate management
- Support ticket management with real-time updates over server-sent events
- Administrator, role, and granular permission management
- General platform and integration settings
- Email/password, OTP, and Google authentication through Better Auth
- Arabic and English UI with locale-aware navigation

## Technology stack

| Area                 | Technology                          |
| -------------------- | ----------------------------------- |
| Framework            | Next.js 16, React 19, TypeScript    |
| Styling              | Tailwind CSS 4, Radix UI primitives |
| Server state         | TanStack Query                      |
| Client state         | Zustand                             |
| Forms and validation | React Hook Form, Zod                |
| Rich content         | TipTap                              |
| Authentication       | Better Auth client                  |
| Internationalization | next-intl                           |
| Charts               | Recharts                            |
| Tests                | Vitest                              |

## How it fits together

```text
Browser
  -> locale and session middleware (`src/proxy.ts`)
  -> Next.js routes (`src/app/[locale]`)
  -> feature hooks and forms (`src/features`)
  -> shared API client (`src/lib/api-client.ts`)
  -> `/api/*` and `/uploads/*` rewrites
  -> CMS Core Backend (port 3000 locally)
```

Browser requests use the frontend origin so session cookies remain first-party. Next.js proxies
API and uploaded-file requests to `NEXT_PUBLIC_BACKEND_URL`. Server-rendered requests call that
backend URL directly.

## Getting started

### Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- A running [CMS Core Backend](https://github.com/3L-Studio/cms-core-backend) instance

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Configure the environment

```bash
cp .env.example .env
```

For local development:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

| Variable                  | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`    | Public origin of this Next.js application            |
| `NEXT_PUBLIC_BACKEND_URL` | Origin of the backend API, without a trailing `/api` |

Both variables are required. The application fails fast when either is missing. Because they are
browser-visible and build-sensitive, never put secrets in them and rebuild after changing them.

### 3. Start the application

Start the backend first, then run:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). The root route redirects to the localized
admin dashboard and unauthenticated users are sent to the login page.

If a dependency is incompatible with Turbopack, use the Webpack development server:

```bash
pnpm dev:webpack
```

## Available commands

| Command                              | Description                                         |
| ------------------------------------ | --------------------------------------------------- |
| `pnpm dev`                           | Start the Turbopack development server on port 3001 |
| `pnpm dev:webpack`                   | Start development on port 3001 with Webpack         |
| `pnpm build`                         | Create an optimized production build                |
| `pnpm start`                         | Serve the production build on port 3001             |
| `pnpm lint`                          | Run ESLint                                          |
| `pnpm test`                          | Run the Vitest suite once                           |
| `pnpm test:watch`                    | Run Vitest in watch mode                            |
| `pnpm exec prettier --write <files>` | Format selected files                               |

## Codebase guide

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (admin)/admin/    # Protected dashboard routes
│   │   └── auth/             # Login and email verification routes
│   ├── globals.css           # Tailwind theme and global styles
│   └── layout.tsx            # Root layout
├── components/
│   ├── layout/               # Admin shell, sidebar, top bar, auth layout
│   ├── providers/            # Application-level React providers
│   └── ui/                   # Shared admin UI primitives
├── features/
│   ├── admin/                # CMS, HR, roles, settings, support, users, dashboard
│   └── auth/                 # Auth forms, hooks, and schemas
├── i18n/
│   ├── messages/{ar,en}/     # Translation dictionaries
│   ├── request.ts            # Server-side locale configuration
│   └── routing.ts            # Supported locales and URL strategy
├── lib/                      # API, auth, dates, cookies, queries, utilities
├── stores/                   # Zustand authentication and UI stores
├── types/                    # Shared TypeScript types
└── proxy.ts                  # Locale handling and route protection
```

### Feature organization

Business behavior stays in `src/features/<domain>`. A feature normally exposes:

- `components/` for screens, dialogs, and forms
- `hooks/` for TanStack Query reads and mutations
- `schemas/` for Zod validation and form types
- `index.ts` as the feature's public entry point

Reusable design primitives belong in `src/components/ui`; move code there only when it is truly
shared across domains. Imports from `src` should use the `@/` alias.

## Authentication and authorization

Better Auth owns the session. The frontend uses session cookies and sends credentials with every
API request. `src/proxy.ts` provides the initial route boundary by redirecting anonymous
visitors away from `/admin`.

Local HTTP development uses a non-`Secure` cookie. The backend enables the `Secure` attribute in
staging and production, where both applications must be served over HTTPS.

After authentication, the application loads the administrator's permissions from
`/api/admin/auth/permissions`. Navigation and feature actions are then controlled by permission
keys such as `cms:view`, `cms:edit`, and `users:delete`. The backend remains the authoritative
authorization layer; frontend checks are for navigation and user experience only.

## Data fetching and cache updates

- Use `src/lib/api-client.ts` for JSON and form-data requests.
- Define server-state access in feature hooks with TanStack Query.
- Reuse the shared query keys and invalidation helpers rather than refreshing the page.
- API errors are normalized as `ApiError` with the HTTP status and response payload.
- Support ticket lists are invalidated when the authenticated SSE stream reports a new ticket.

## Internationalization

All application routes are prefixed with `/ar` or `/en`; Arabic is the default locale. When UI
copy changes, update the matching dictionaries in both:

```text
src/i18n/messages/ar/
src/i18n/messages/en/
```

Layouts set `dir="rtl"` for Arabic and `dir="ltr"` for English. Avoid hard-coding user-facing
copy or direction-specific spacing in feature components.

## Testing and quality checks

Vitest runs in a Node environment and supports the `@/` path alias. Keep focused tests beside the
implementation as `*.test.ts`; use `src/__tests__/` for cross-cutting behavior such as routing.

Before opening a pull request, run:

```bash
pnpm lint
pnpm test
pnpm build
```

Add regression coverage for bug fixes and test both success and failure paths around API and
framework boundaries.

## Deployment

Production builds require the final public URLs at build time:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

See [DEPLOY.md](./DEPLOY.md) for the branch strategy, PM2 examples, reverse-proxy configuration,
Docker templates, health checks, and staging/production procedures.

## Related repository

The API, database schema, authentication server, and uploaded-file storage live in the
[CMS Core Backend](https://github.com/3L-Studio/cms-core-backend) repository. For local
development, run the backend on port 3000 and this application on port 3001.

## Contributing

Follow the repository conventions in [AGENTS.md](./AGENTS.md). Use scoped Conventional Commit
messages, keep domain code within its feature, update both locales for copy changes, and include
screenshots for user-interface changes.

This repository is private. Do not commit `.env` files, credentials, production endpoints, or
other sensitive data.
