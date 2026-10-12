# 03 — Config & Hosting Analysis

Scope: how xtech picks its API base URLs today, how xt-plat is exposed, and what "separately hosted frontend" requires.

## 1. xtech side

**Env loading:** `quasar.config.ts:125` → `build.envFolder: './env'`; Quasar injects every key as `process.env.<KEY>`. Precedence: `.env` → `.env.dev|.env.prod` (per mode) → `.local` variants.

| File | Relevant content |
|---|---|
| `env/.env` | `APP_API_TIME_OUT=300000`, `APP_API_CLIENT='default'`, `APP_WEB_URL='https://app.yourdomain.com'`, `APP_API_DOMAIN='yourdomain.com'`, `APP_PREFIX_KEY=_myappkey_`, `VITE_HLS_TEST_URL`, `VITE_MOQ_URL` |
| `env/.env.dev` | `APP_BASE_API='http://localhost:8080'`, `APP_BASE_CDN_API='http://localhost:8080'`, `APP_DEV_MODE='true'` |
| `env/.env.prod` | `APP_BASE_API='https://api.yourdomain.com'`, `APP_BASE_CDN_API='https://api.yourdomain.com'` (placeholders) |

**Consumers of the two knobs:**
- `APP_BASE_API` — `boot/axios.ts:27` (instance creation), `boot/axios.ts:118` (refresh path), `useAxios.ts:158`, `usePreFetch.ts:52`, `authenStore.ts:73`
- `APP_BASE_CDN_API` — `api/FileManagerService.ts:15` (CDN file ops), `utils/appUtil.ts:514-517` (URL builder)

**Ports:** dev server `9000` (`quasar.config.ts:131`); SSR prod `3000` (`:246`, `Dockerfile:54`, `docker-compose*.yml`); Docker maps `3000:3000` / `127.0.0.1:3000` + `172.17.0.1:3000`.

**No proxy config exists** — `rg proxy quasar.config.ts` → no dev proxy block.

**`VITE_*` vars are broken as consumed:** `VITE_HLS_TEST_URL`/`VITE_MOQ_URL` live in `env/.env` but are read via `import.meta.env.VITE_*` (`pages/landing/demo.vue:55,60`); Vite only auto-loads `.env` from the project root (not `./env`), so these resolve `undefined` → hardcoded fallbacks (`demo.vue:48-49`) win. Also `VITE_HLS_URL` is read but defined nowhere.

**CI drift:** `.github/workflows/ci.yml:34` runs `pnpm run typecheck`; `package.json` has **no `typecheck` script** (only `dev/build/lint/test/...`) → CI fails at that step.

## 2. xt-plat side

| Item | Value | Source |
|---|---|---|
| Container port | `8001` (uvicorn `--port 8001`) | `docker-compose.yml:43,49-51` |
| Host port | `8000 → 8001` | `docker-compose.yml:42-43` |
| Local dev | `uvicorn main:app --reload` (8000 default) | `README.md:96`, `docs/DEVELOPMENT.md:57` |
| **CORS** | **NOT configured — zero matches for `CORS|allow_origins|add_middleware` in `xt-plat/src`** (verified, rg exit=1) | — |
| Production ingress | Traefik: `/api/*` → `xtc-platform:8001`, `/ws/*` → platform, `/hls/*` → mediamtx:8888 | `API_CONTRACT.md:392-400` |
| Env vars | `DATABASE_URL`, `REDIS_URL`, `ZITADEL_ISSUER/PROJECT_ID/AUDIENCE`, `MEDIA_API_URL`, `SERVICE_JWT_SECRET`, `PLATFORM_WEBHOOK_SECRET`, `TASKIQ_BROKER_URL` — **no CORS/origin/port vars** | `.env.example` |
| Frontend doc convention | `import.meta.env.VITE_API_BASE` used in Vue samples | `docs/API_FRONTEND.md:567-639` |

## 3. Hosting implications (separately hosted xtech)

A browser on origin `https://app...` calling `https://api...` cross-origin **will fail today** — no CORS headers exist in xt-plat. Viable options:

| Option | Where | Prod? | Dev? | Notes |
|---|---|---|---|---|
| **(a) Same-origin reverse proxy (recommended)** | Traefik routes `/api/*` + `/ws/*` → xtc-platform (already configured per `API_CONTRACT.md:398`), frontend served at `/` | ✅ | via nginx/caddy or Traefik compose | No backend change; WS upgrade works same-origin; matches existing infra |
| (b) Add `CORSMiddleware` to xt-plat | `src/main.py` + settings allowlist | ✅ | ✅ | **Backend change — prerequisite in refactor plan**; must also allow `WebSocket` origins (or rely on no Origin check for WS) |
| (c) Quasar dev proxy | `quasar.config.ts` `devServer.proxy` (`/api` + `/ws` → `http://localhost:8000`) | ❌ dev only | ✅ | Needed for local dev under (a)-style prod; avoids CORS during development |

**Recommendation:** (c) for dev + (a) for prod; keep (b) as fallback if frontend and API end up on unrelated domains without shared proxy. Decision recorded in `07-refactor-plan-draft.md`.

## 4. Env-var convention proposal

Conflict: xtech uses `APP_BASE_API` (injected via `env/` folder), xt-plat docs assume `VITE_API_BASE`.

Proposal for refactor (single origin, proxy path style):
- `env/.env.dev`: `APP_BASE_API=''` (empty → relative URLs → Quasar dev proxy handles `/api`, `/ws`)
- `env/.env.prod`: `APP_BASE_API=''` (relative → same-origin Traefik)
- Keep `APP_BASE_CDN_API` only if a distinct file/CDN origin survives; otherwise collapse to same origin.
- Do **not** adopt `VITE_*` naming (broken under `envFolder` anyway — §1).

Empty-string baseURL is already the fallback everywhere (`|| ''` in all 5 consumers), so this requires no code change beyond the dev proxy block.
