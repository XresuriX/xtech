# 06 — Surface Mapping (pages → API Frontend vs B2B2C)

Inputs: current `src/router/routes.ts` (71 lines, dirty), `git show HEAD:src/router/routes.ts` (388 lines, starter), deliverables 01 + 05.

Surfaces: **F** = `docs/API_FRONTEND.md` (consumer: streams, conferences, notifications, economy) · **B** = `docs/API_FRONTEND_B2B2C.md` (+ loyalty code: operator/org-admin) · **none** = no backend use.

## 1. Currently routed pages (working tree)

| Page | Route | Feature | Surface | Backend endpoints | Disposition |
|---|---|---|---|---|---|
| `pages/admin/index.vue` | `/admin` | admin dashboard; HLS publish demo with **hardcoded** `xrcomms...:8888` URLs (`:63-75`) | **B** | none yet → should call `GET/POST /api/v1/catalogue/streams`, `GET .../telemetry`, `POST .../sync-token` | keep — rewire to catalogue API |
| `pages/landing/index.vue` | `/` (layout `landing.vue`) | marketing home | none | — | keep static |
| `pages/landing/features.vue` | `/features` | features (TODO backend data `:17`) | none | — | keep static |
| `pages/landing/blog.vue` | `/` (**duplicate path, shadowed** `routes.ts:24`) | blog list (Supabase TODO `:18,47`) | none | OPEN DECISION §3 | fix duplicate route |
| `pages/landing/babylonjs.vue` | `/` (**duplicate, unreachable** `routes.ts:49`) | 3D demo | none | — | fix route or delete |
| `pages/landing/blog-blank.vue` | `/blog/blank` | static | none | — | keep |
| `pages/landing/blog-3d.vue` | `/blog/3d` | static/3D | none | — | keep |
| `pages/landing/blog-player.vue` | `/blog/player` | HLS/MoQ player demo (hardcoded relay URLs `:24-25`) | none (media, not platform API) | media stack URLs via env | keep; move URLs to env (§3) |
| `pages/landing/blog-filler.vue` | `/blog/filler` | static | none | — | keep |
| `pages/landing/demo.vue` | `/demo` | HLS/MoQ demo; broken `import.meta.env.VITE_*` reads (`:55,60`) | none | fix env loading (`03-config-hosting.md` §1) | keep; fix env |
| `pages/landing/contact.vue` | `/contact` | contact form — Supabase insert **commented** (`:81-99`) | none | OPEN DECISION §3 | pending decision |
| `pages/error-404.vue` | `/:catchAll` | 404 | none | — | keep |

**Missing from router but required:** `/auth/login` (OIDC entry point, see `04-auth-gap.md`), `/error`, `/error500`.

## 2. Restorable HEAD routes (removed from router, pages still on disk)

| Page(s) | Route(s) (HEAD) | Feature | Surface | Backend endpoints (per 05) | Restore? |
|---|---|---|---|---|---|
| `pages/auth/login.vue` | `/auth`, `/auth/login` | login | — | `REPLACE-OIDC` | **yes (required)** — becomes "Sign in with Zitadel" |
| `pages/index.vue` | `/` (dashboard, `requireAuth`) | home dashboard | F | candidates: `GET /activities`, `GET /notifications/inbox`, `GET /points`, `GET /wallet` | maybe — rebuild against Surface F |
| `pages/user/index.vue`, `user/view.vue` | `/user`, `/user/:crud/:id` | user CRUD | **B** | `RENAME` → org members (list/add/role/remove); `GET /{id}`, profile edits = gaps | **yes (rework)** → "Members" page |
| `pages/permission/*` | `/permission...` | permission CRUD | none | `DROP` (roles/scopes from token) | no |
| `pages/role/*` | `/role...` | role CRUD | none | `DROP` (Zitadel project roles) | no |
| `pages/settings/index.vue` | `/settings` | profile/avatar (upload) | none | `MISSING-BACKEND` (file API) | maybe — strip avatar upload |
| `pages/settings/notifications.vue` | `/settings/notifications` | notification prefs | none | `MISSING-BACKEND` (FCM/push) | no (until push exists) |
| `pages/settings/security.vue` | `/settings/security` | password/sessions | none | `DROP` → IdP | no |
| `pages/settings/emails.vue` | `/settings/emails` | email change | none | `DROP` → IdP | no |
| `pages/blank-page.vue` | `/blank-page` | scaffold | none | — | no |
| `pages/example/*` (15) | `/example/...` | starter demos | none | `DROP` | no |
| `pages/example/composables/*` (3) | `/example/composables/...` | axios/CRUD demos | none | `DROP` | no |
| `pages/example/ui/*` (14) | `/example/ui/...` | UI demos | none | — | no |
| `pages/example/feed/index.vue` | `/example/feed` | social feed demo | none | — | no |
| `pages/example/chats/*` | `/example/chats/...` | chat demo | none | — | no |
| `pages/error.vue`, `error-500.vue` | `/error`, `/error500` | error pages | none | — | **yes** (wired to `usePreFetch` exception flow) |
| `pages/test*.vue` | `/test` | dev tests | none | — | no (dev only) |

Also dead after removal: sidebar links in `src/libs/navs.ts` (`:65 /permission`, `:84 /role`, `:92 /user`, examples) — prune in refactor.

## 3. B2B2C coverage (loyalty endpoints → no xtech page exists)

All 22 loyalty endpoints (`01-backend-endpoints.md` Surface B) have **zero frontend coverage** — new-build candidates for the `/admin` operator surface:

| New page (proposed) | Endpoint group | Priority |
|---|---|---|
| Loyalty rules editor | `/api/v1/gamification/rules` CRUD | high |
| Tasks manager | `/api/v1/tasks` CRUD + `POST /tasks/complete`, `GET /tasks/my-completions` ⚠️ (shadowed — drift §3 in 01) | high |
| Campaigns manager | `/api/v1/campaigns` CRUD + `GET .../progress` | high |
| Broadcast notifications | `POST /notifications/send`, `POST /notifications/broadcast`, `GET /notifications/custom-inbox`, `POST /notifications/custom-mark-read` | medium |
| Members (org admin) | org members routes (covered by restored `/user` rework, §2) | high |
| Streams admin | catalogue 13 routes (rewire `/admin`, §1) | high |
| Conferences admin | conference 7 routes | medium |
| Economy view | `GET /wallet`, `GET /points`, `GET /leaderboard`, `POST /credits/transfer` (F/B shared) | medium |

**OPEN DECISIONS (recorded for `07-refactor-plan-draft.md`):**
1. Contact form backend: xt-plat has **no** endpoint for it (`MISSING-BACKEND`) → options: add `POST /api/v1/...` contact route (backend change), revive Supabase (README:10,133-139), or `mailto:` static.
2. Blog backend: same question (Supabase vs xt-plat catalogue content vs static).
3. HLS/MoQ URLs in `admin/index.vue`, `demo.vue`, `blog-player.vue`: replace hardcoded hosts with env vars (broken `VITE_*` loading, `03-config-hosting.md` §1).
4. Which HEAD routes to restore: minimum = `/auth` + `/error*` + members rework; dashboard rebuild optional.
