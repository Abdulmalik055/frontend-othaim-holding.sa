# Frontend Deployment Guide

---

## Table of Contents

1. [Branch Strategy (dev / stage / main)](#1-branch-strategy-dev--stage--main)
2. [Requirements](#2-requirements)
3. [Clone & Install](#3-clone--install)
4. [Environment Setup (Frontend)](#4-environment-setup-frontend)
5. [Build & Run](#5-build--run)
6. [Run with PM2 (Staging / Production)](#6-run-with-pm2-staging--production)
7. [Deploy Commands by Branch](#7-deploy-commands-by-branch)
8. [Docker Setup](#8-docker-setup)
9. [Nginx Reverse Proxy](#9-nginx-reverse-proxy)
10. [Health Check](#10-health-check)
11. [Common Issues](#11-common-issues)

---

> [!CAUTION]
> Deploy backend migration `20260813193000_remove_cms_list_formats` and verify that no saved CMS
> item has a `ul` or `ol` format before sending traffic to this frontend. This frontend deliberately
> rejects and does not render those removed formats; deploying it first can make an affected page
> unavailable. Keep the old frontend live during the backend maintenance window, then cut over to
> this clean frontend release after the backend migration and health checks succeed.

## 1. Branch Strategy (dev / stage / main)

| Branch  | Environment       | Purpose                      |
| ------- | ----------------- | ---------------------------- |
| `dev`   | Local development | Development on your machine  |
| `stage` | Staging           | QA, feedback, and validation |
| `main`  | Production        | Live production traffic      |

Recommended flow:

```text
feature/* -> dev -> stage -> main
```

Hotfix flow:

```text
hotfix/* (from main) -> main -> stage -> dev
```

Remote check:

```bash
git fetch --all --prune
git branch -a
```

---

## 2. Requirements

| Dependency       | Recommended Version  |
| ---------------- | -------------------- |
| Node.js          | 22+                  |
| pnpm             | 10+                  |
| PM2 (optional)   | Latest               |
| Docker + Compose | 24+ / v2+ (optional) |

```bash
# Node via nvm
nvm install 22 && nvm use 22

# Global tools (optional for PM2 flow)
npm install -g pnpm pm2
```

---

## 3. Clone & Install

### Local development (`dev`)

```bash
git clone <your-repo-url>
cd dnet-frontend
git checkout dev
pnpm install --frozen-lockfile
```

### Staging server (`stage`)

```bash
git clone -b stage <your-repo-url> /var/www/dnet-frontend-stage
cd /var/www/dnet-frontend-stage
pnpm install --frozen-lockfile
```

### Production server (`main`)

```bash
git clone -b main <your-repo-url> /var/www/dnet-frontend-prod
cd /var/www/dnet-frontend-prod
pnpm install --frozen-lockfile
```

---

## 4. Environment Setup (Frontend)

```bash
cp .env.example .env
chmod 600 .env
```

This frontend only requires:

```dotenv
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_BACKEND_URL=
```

### Local values

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Staging values

```dotenv
NEXT_PUBLIC_SITE_URL=https://dnet.dnetdev.com
NEXT_PUBLIC_BACKEND_URL=https://api-dnet.dnetdev.com
```

### Production values

```dotenv
NEXT_PUBLIC_SITE_URL=https://<your-prod-domain>
NEXT_PUBLIC_BACKEND_URL=https://<your-prod-api-domain>
```

### Important notes

- `next.config.ts` will throw at startup if either variable is missing.
- Frontend rewrites are configured as:
  - `/api/:path* -> ${NEXT_PUBLIC_BACKEND_URL}/api/:path*`
  - `/uploads/:path* -> ${NEXT_PUBLIC_BACKEND_URL}/uploads/:path*`
- `NEXT_PUBLIC_*` values are build-sensitive. After changing them, rebuild the app (`pnpm build`).

---

## 5. Build & Run

### Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Runs on port `3001` (from project script).

### Server mode (staging/production)

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

`pnpm start` runs `next start --port 3001`.

---

## 6. Run with PM2 (Staging / Production)

### Deployment topology options

1. Separate servers (cleaner, recommended)
   - Stage and Production can both use port `3001`.
2. Same server
   - Use different ports (example: Stage `3001`, Production `3002`).

### A) Separate servers example

Create a persistent `/var/www/dnet-frontend-stage-shared/ecosystem.config.cjs` outside every release
directory:

```javascript
module.exports = {
  apps: [
    {
      name: "dnet-frontend-stage",
      cwd: "/var/www/dnet-frontend-stage-current",
      script: "pnpm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env_file: "/var/www/dnet-frontend-stage-shared/.env",
      env: { NODE_ENV: "production" },
      out_file: "/var/www/dnet-frontend-stage-shared/logs/out.log",
      error_file: "/var/www/dnet-frontend-stage-shared/logs/error.log",
      merge_logs: true,
    },
  ],
};
```

The production server uses the same structure with the `prod-current` and `prod-shared` paths and a
different name:

```javascript
name: "dnet-frontend";
env: {
  NODE_ENV: "production";
}
```

### B) Same server example (different ports)

Use explicit `next start --port` for one app:

```javascript
module.exports = {
  apps: [
    {
      name: "dnet-frontend-stage",
      cwd: "/var/www/dnet-frontend-stage-current",
      script: "./node_modules/.bin/next",
      args: "start --port 3001",
      env_file: "/var/www/dnet-frontend-stage-shared/.env",
      env: { NODE_ENV: "production" },
    },
    {
      name: "dnet-frontend",
      cwd: "/var/www/dnet-frontend-prod-current",
      script: "./node_modules/.bin/next",
      args: "start --port 3002",
      env_file: "/var/www/dnet-frontend-prod-shared/.env",
      env: { NODE_ENV: "production" },
    },
  ],
};
```

Start PM2:

```bash
mkdir -p /var/www/dnet-frontend-stage-shared/logs
pm2 startOrReload /var/www/dnet-frontend-stage-shared/ecosystem.config.cjs \
  --only dnet-frontend-stage --update-env
pm2 save
pm2 startup
```

Useful PM2 commands:

```bash
pm2 list
pm2 logs dnet-frontend-stage
pm2 logs dnet-frontend
pm2 reload dnet-frontend-stage --update-env
pm2 reload dnet-frontend --update-env
```

---

## 7. Deploy Commands by Branch

### Release-blocking clean-checkout requirement

> **Do not deploy a release that removes routes or files with `cp -r *`, `git pull` in a
> long-lived application directory, or any other copy-in-place process.** Those operations do not
> remove files that disappeared from Git, so an old Next.js route can remain on the server. The
> current staging workflow uses copy-in-place and must not be used for such a release until it is
> replaced with a clean-checkout deployment.

Build every staging and production release in a new, immutable directory at an exact 40-character
commit SHA. Keep the environment file outside the checkout, link it into the release, and point the
PM2 application's `cwd` at the environment's `current` symlink. For example, use
`/var/www/dnet-frontend-stage-current` with `/var/www/dnet-frontend-stage-shared/.env` for staging,
and the corresponding `prod` paths for production.

Set the environment-specific values in the deployment shell:

```bash
# Staging values. For production, replace "stage" with "prod" and use dnet-frontend.
FRONTEND_RELEASE_SHA="<exact-40-character-commit-sha>"
FRONTEND_RELEASE_ROOT="/var/www/dnet-frontend-stage-releases"
FRONTEND_RELEASE_DIR="${FRONTEND_RELEASE_ROOT}/${FRONTEND_RELEASE_SHA}"
FRONTEND_CURRENT_LINK="/var/www/dnet-frontend-stage-current"
FRONTEND_SHARED_ROOT="/var/www/dnet-frontend-stage-shared"
FRONTEND_SHARED_ENV="${FRONTEND_SHARED_ROOT}/.env"
FRONTEND_ECOSYSTEM_FILE="${FRONTEND_SHARED_ROOT}/ecosystem.config.cjs"
FRONTEND_PM2_APP="dnet-frontend-stage"
```

Create and verify a clean release, then install and build it before changing live state:

```bash
test -f "$FRONTEND_SHARED_ENV"
test -f "$FRONTEND_ECOSYSTEM_FILE"
test ! -e "$FRONTEND_RELEASE_DIR"
mkdir -p "$FRONTEND_RELEASE_ROOT" "$FRONTEND_SHARED_ROOT/logs"

git clone --no-checkout git@github.com:3L-Studio/cms-core-frontend.git "$FRONTEND_RELEASE_DIR"
git -C "$FRONTEND_RELEASE_DIR" fetch --depth=1 origin "$FRONTEND_RELEASE_SHA"
git -C "$FRONTEND_RELEASE_DIR" checkout --detach "$FRONTEND_RELEASE_SHA"
test "$(git -C "$FRONTEND_RELEASE_DIR" rev-parse HEAD)" = "$FRONTEND_RELEASE_SHA"
test -z "$(git -C "$FRONTEND_RELEASE_DIR" status --porcelain)"

ln -s "$FRONTEND_SHARED_ENV" "$FRONTEND_RELEASE_DIR/.env"
cd "$FRONTEND_RELEASE_DIR"
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Only after every check succeeds, atomically update `current`. Use the persistent ecosystem file for
the cutover so PM2 starts a missing process or reapplies the new `cwd` and script configuration to an
existing process:

```bash
ln -sfn "$FRONTEND_RELEASE_DIR" "${FRONTEND_CURRENT_LINK}.next"
mv -Tf "${FRONTEND_CURRENT_LINK}.next" "$FRONTEND_CURRENT_LINK"
pm2 startOrReload "$FRONTEND_ECOSYSTEM_FILE" --only "$FRONTEND_PM2_APP" --update-env
pm2 save
```

Do not use a name-only `pm2 reload` for the first clean cutover: an existing PM2 entry may retain its
old in-place working directory. After `pm2 describe "$FRONTEND_PM2_APP"` confirms that the process
uses `FRONTEND_CURRENT_LINK`, subsequent releases may reload by name, although `startOrReload` keeps
the persisted configuration authoritative.

Keep the previous release directory until health checks pass. Rollback uses the same atomic link
replacement to select the previous verified directory, followed by the same `startOrReload` command.

### Deploy Staging (`stage`)

```bash
git ls-remote git@github.com:3L-Studio/cms-core-frontend.git refs/heads/stage
```

Copy the returned SHA into `FRONTEND_RELEASE_SHA`, use the staging values above, and run the clean
release procedure.

### Deploy Production (`main`)

```bash
git ls-remote git@github.com:3L-Studio/cms-core-frontend.git refs/heads/main
```

Copy the returned SHA into `FRONTEND_RELEASE_SHA`; set `FRONTEND_RELEASE_ROOT`,
`FRONTEND_CURRENT_LINK`, and `FRONTEND_SHARED_ROOT` to the production paths; derive
`FRONTEND_SHARED_ENV` and `FRONTEND_ECOSYSTEM_FILE` from that root; set
`FRONTEND_PM2_APP="dnet-frontend"`; then run the same clean release procedure.

---

## 8. Docker Setup

> This repo does not currently include Docker files. Use the following templates in project root if your DevOps flow uses containers.

### Dockerfile

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build-time public envs
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3001
CMD ["pnpm", "start"]
```

### .dockerignore

```text
node_modules
.next
.git
.env
logs
```

### docker-compose.yml

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SITE_URL: https://dnet.dnetdev.com
        NEXT_PUBLIC_BACKEND_URL: https://api-dnet.dnetdev.com
    env_file: .env
    ports:
      - "3001:3001"
    restart: unless-stopped
```

Deploy with Docker:

```bash
docker compose build
docker compose up -d
docker compose logs -f frontend
```

---

## 9. Nginx Reverse Proxy

### Staging Frontend (`dnet.dnetdev.com`)

Create `/etc/nginx/sites-available/dnet-frontend-stage`:

```nginx
server {
    listen 80;
    server_name dnet.dnetdev.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dnet.dnetdev.com;

    ssl_certificate     /etc/letsencrypt/live/dnet.dnetdev.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dnet.dnetdev.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_read_timeout 300s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/dnet-frontend-stage /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Issue SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dnet.dnetdev.com
```

### Production Frontend (template)

Use the same Nginx structure with:

- `server_name <your-prod-domain>`
- `proxy_pass http://127.0.0.1:<your-prod-port>` (e.g., `3001` on separate server, `3002` on same server)

---

## 10. Health Check

```bash
# Local process check
curl -I http://127.0.0.1:3001

# Public staging check
curl -I https://dnet.dnetdev.com

# Verify frontend -> backend rewrite path
curl -i https://dnet.dnetdev.com/api
```

---

## 11. Common Issues

**App crashes at start: missing env vars**

- Make sure `.env` includes both:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_BACKEND_URL`

**Frontend points to wrong backend**

- Check `NEXT_PUBLIC_BACKEND_URL` value.
- Rebuild after any env change: `pnpm build`.

**Mixed content errors (HTTPS page calling HTTP API)**

- In staging/production, both URLs must be `https://...`.

**Stage and Production conflict on one server**

- Do not run both on same port.
- Use different ports and separate Nginx upstreams.

**Nginx returns 502**

- Confirm app is running on the expected port:
  - `pm2 list`
  - `curl -I http://127.0.0.1:3001`

**`/api` calls fail from frontend**

- Confirm backend domain is reachable:
  - `https://api-dnet.dnetdev.com`
- Confirm backend CORS/cookie config trusts frontend origin.
