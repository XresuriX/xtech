# 07 — Refactor Plan (draft)

Phased outline to move xtech onto xt-plat's `/api/v1` (surfaces: API Frontend + API Frontend B2B2C). Each phase is independently shippable. **Blocked on the open decisions in §2** — resolve those first.

Evidence: deliverables `01`–`06` in this directory.

## Phase 0 — Prerequisites & decisions
- Resolve §2 decisions (auth option, proxy vs CORS, DROP-list, contact/blog backend, routes to restore).
- Provision Zitadel: SPA application (PKCE), redirect URIs (`http://localhost:9000/*`, prod origin), project roles `org_owner/org_admin/stream_admin/streamer/viewer` (`xt-plat/src/infrastructure/auth/scopes.py:35-67`).
- Backend bug reports to xt-plat (not blockers): shadowed `GET /tasks/my-completions` (`api_custom.py:94,142`), missing CORS if option (b) chosen, scope checks missing on `credits/transfer` + loyalty routes, doc drift (`01-backend-endpoints.md` §drift).

## Phase 1 — Transport & config (from `03-config-hosting.md`)
1. Add Quasar dev proxy in `quasar.config.ts` → `devServer.proxy`: `/api` + `/ws` → `http://localhost:8000`.
2. Set `env/.env.dev` / `env/.env.prod` `APP_BASE_API=''` (relative URLs); collapse `APP_BASE_CDN_API` unless a CDN origin survives.
3. Prod: confirm Traefik `/api/*`+`/ws/*` → `xtc-platform:8001` (`API_CONTRACT.md:398`) serves the frontend origin; otherwise add `CORSMiddleware` to `src/main.py` (backend change).
4. Fix `VITE_*` loading (move to `env/`-read `process.env` or root `.env`); replace hardcoded HLS/MoQ hosts in `admin/index.vue`, `demo.vue`, `blog-player.vue`.
5. Add missing `typecheck` script (`vue-tsc --noEmit`) so CI passes (`.github/workflows/ci.yml:34`).

**Files:** `quasar.config.ts`, `env/.env*`, `package.json`, `src/pages/admin/index.vue`, `src/pages/landing/demo.vue`, `src/pages/landing/blog-player.vue`.

## Phase 2 — Auth (from `04-auth-gap.md`; option A assumed) — **DONE 2026-10-12**
1. ✅ OIDC lib (`oidc-client-ts@3.5.0`), `src/services/oidc.ts` + `src/boot/oidc.ts`: discovery from `APP_OIDC_ISSUER`, code+PKCE; silent renew = `signinSilent()` (refresh_token grant when `offline_access` issued, else falls back to login redirect); **local logout** (`removeUser` + cookie clear) — IdP end-session not provisioned yet (needs `post_logout_redirect_uri` in Zitadel; revisit with E2E).
2. ✅ `boot/axios.ts`: access token attached in request interceptor from cookie; 401 → `signinSilent()` → retry once → else clear session + `/auth/login`; 403 left to `useAxios` toast path.
3. ✅ `useAuth.ts` rewritten (`signIn` redirect, `signOut` local); deleted `api/AuthenService.ts`, `components/app/ForgotPassword.vue`, `authenStore` refresh machinery, `jwtUtil` refresh helpers (`decodeJWT` kept). `settings/security.vue` session-revoke stubbed (IdP-managed).
4. ✅ `boot/requireAuth.ts`: guard on present + unexpired token (decode `exp`); redirect `/auth/login`. Scope guard wired via appStore scopes (no route meta yet — routes restored in Phase 4).
5. ✅ Claims: `urn:zitadel:iam:org:project:roles` → roles → `libs/scopes.ts` (mirror of backend `scopes.py`) → `appStore.setScopes()`/`hasScope()`/`isOrgAdmin`; also populates `authenStore.auth` display fields. Old `permissions` code API untouched.
6. ✅ Login page: SSO redirect button (`authen.ssoSignIn/i18n` en+th); shows config warning when `APP_OIDC_ISSUER`/`APP_OIDC_CLIENT_ID` empty. Routes: `/auth/login` restored (blank layout).

**Verify:** `pnpm test:run` ✅ 11 tests (scopes + oidc url helpers); `pnpm build` ✅; `pnpm typecheck` 63 errors (down from 66 baseline; none in new files); changed-file eslint clean. **Live Zitadel E2E pending** — set `env/.env` `APP_OIDC_ISSUER`/`APP_OIDC_CLIENT_ID`, register redirect URI `<origin>/#/auth/callback`.

## Phase 3 — Core service layer rewrite (from `05`) — **DONE 2026-10-12**
1. ✅ New `src/api/` modules (schemas copied from backend pydantic): `OrgService.ts` (me/create/get/update/remove/getByDomain), `MemberService.ts` (list/add/updateRole/remove), `ActivityService.ts` (list), `NotificationService.ts` (inbox/markRead + send/broadcast for Phase 6 UI), `UtilService.ts` (`health` + `getOgMeta` stub returning null for Phase-6 consumer removal). `SearchService.ts` deleted (zero consumers).
2. ✅ Cross-cutting: `libs/query.ts` `buildQuery` (limit/offset + filters); FastAPI `{"detail"}` errors now toasted in `useAxios.exeptionNotify` (string or validation-array msgs); removed `X-Sync-Active` header + `canSyncActiveStatusToServer` await from `useAxios`, removed `Accept-Apiclient` from axios defaults (+ env `APP_API_CLIENT` gone); `IMethod` gained `'PATCH'`.
3. ✅ Old mocked services (`UserService`, `PermissionService`, `RoleService`, `FileManagerService`, `UserNotifyService`) **kept** — Phase-6 deletion of consumers superseded by decision #3 (starter pages stay, no pruning); MISSING-BACKEND features left as existing dead mocks.

**Verify:** `pnpm test:run` ✅ 22 tests (incl. 14 new service URL/method/query mapping tests via `vi.mock`); `pnpm build` ✅; typecheck holds at 63 (no new errors); changed-file eslint clean (0 errors). Manual members-list smoke blocked on live Zitadel+backend (same as Phase 2 E2E).

## Phase 4 — Page rewiring — **DONE 2026-10-12 (minimum scope, per user decision #3)**
1. ✅ Router: `/auth/login` (Phase 2), `/error`, `/members` (requireAuth) added; `/admin` + landing kept.
2. ✅ New `pages/members/index.vue` (starter `pages/user/*` **left untouched/unrouted**): org members via `OrgService.me` + `MemberService` (list/add/role-change/remove; owner protected client+backend; actions gated by `appStore.isOrgAdmin && hasScope(MEMBERS_WRITE)`); en/th i18n `members.*`.
3. ✅ Minimum on starter pages (user decision 2026-10-12): files kept, no routes/nav pruning needed — `navs.ts`/`BaseSidebar` chain is dormant (only unrouted starter pages import it; live landing nav is separate WIP). Settings/chat/examples remain unrouted.
4. ⏸ Dashboard wiring (plan-optional) deferred; settings rework deferred to Phase 6 cleanup pass.

**Verify:** `pnpm build` ✅, typecheck holds 63, eslint clean on touched files, `test:run` ✅ 22. Members page needs live Zitadel+backend for E2E.

## Phase 5 — Feature surfaces (F) — **DONE 2026-10-12**
1. ✅ Catalogue: `CatalogueService.ts` (list `status_filter`, create/get/update/remove, sync-token code-shape §drift4, restream targets **bare-array PUT** §drift5, recordings, recording toggle, telemetry); `/admin` Publish tab rewired from fake publish flow to real `POST /catalogue/streams` + streams table (HLS link, sync-token dialog, telemetry dialog, delete); Overview "Recent Activity" now `GET /activities` (falls back to demo rows when empty). Demo chart tabs kept (user WIP).
2. ✅ Conferences: `ConferenceService.ts` (CRUD + sync-token + participant mute) — **service only, no UI page yet**.
3. ✅ Playback/sync: `useSyncSocket` composable (API_CONTRACT §1b: welcome/presence/state/transport/chat/timesync, ping heartbeat, close 4401/4408 no-reconnect, reconnect backoff; consumes `ws_sync_url` + `token` from sync-token response). Consumers (player page) come with feature work.
4. ✅ Notifications: `useNotificationsSocket` (platform `WS /ws/notifications?token=`, ping/pong, 4401 → stop, reconnect backoff; `loadInbox`/`markRead` client-side unread count). Menu wiring (`NotificationBarMenu`) deferred — menu still uses old `UserNotifyService`.
5. ✅ Economy: `EconomyService.ts` (points/badges/leaderboard/wallet/transfer — 402→FastAPI detail toast) + `/economy` page (points/balance cards, leaderboard table, transfer dialog; en/th i18n).

**Verify:** `test:run` ✅ 32 (10 new mapping tests for catalogue/conference/economy incl. bare-array PUT + status_filter); `build` ✅; typecheck holds 63; touched-file eslint 0 errors. E2E (streams create→telemetry, WS) needs live stack.

## Phase 6 — B2B2C admin/loyalty (new pages, from `06` §3) — **DONE 2026-10-12**
1. ✅ `LoyaltyService.ts` — 18 methods covering rules (`/gamification/rules` CRUD), tasks (`/tasks` CRUD + `complete` + `my-completions` — **shadowed-endpoint drift §3, still called & flagged**), campaigns (`/campaigns` CRUD + `progress`); schemas from `gamification/schemas_custom.py`.
2. ✅ `NotificationService` += `customInbox` / `customMarkRead` — completes all 22 endpoints of `06` §3.
3. ✅ `/loyalty` page — **single tabbed page (Rules / Tasks / Campaigns / Broadcast) instead of 4 separate pages** (same endpoint coverage, one shared shell): rules editor incl. conditions JSON + cooldown/max-awards; tasks manager incl. self-complete + "my completions" dialog; campaigns manager incl. datetime window, bonus fields, status select, task multiselect; broadcast tab = send-one/broadcast-many form + custom-inbox list + mark-read.
4. ✅ Scope gate: UI-level `isOrgAdmin` banner + hidden manage actions (backend enforces auth-only on these 22 routes — drift §7, flagged for backend hardening).
5. ✅ Route `/loyalty` (`requireAuth`) — direct-URL, no nav entry (consistent with `/members`/`/economy`; nav pruning skipped per decision #3 minimum scope).
6. Old mocked services (`UserService`/`PermissionService`/`RoleService`/`FileManagerService`/`UserNotifyService`) + their starter/example consumers **kept** — superseded Phase 3 note; deleting them conflicts with decision #3 (leave starter pages unrouted, no pruning).

**Verify:** `test:run` ✅ 38 (+6 loyalty/custom-inbox mapping tests); `build` ✅; typecheck holds 63; touched-file eslint 0 errors. E2E needs live stack.

## Phase 7 — Tests & CI — **DONE 2026-10-12**
1. ✅ HTTP-layer tests: `src/composables/useAxios.test.ts` (6: plain payload no-toast, FastAPI string `detail` toast, validation-array msg join, AppException toast, 401 no-toast, rejected-request detail toast) — `vi.mock` of `boot/axios`/`useBase`/`useLang`/`quasar` Cookies; added vitest alias `'boot'` → `src/boot`.
2. ✅ Auth guard tests: `src/boot/requireAuth.test.ts` (5: passthrough, valid token, expired, missing cookie, undecodable token → `/auth/login` redirect) — mocked `quasar/wrappers` boot as identity + `decodeJWT`.
3. ✅ Total: **49 tests / 6 files** (service mapping tests from Phases 3–6 + oidc + scopes).
4. ✅ Lint repo-wide: **0 errors / 210 warnings, exit 0** (was 65 errors + md-plugin crash). Fixes: eslint `ignores: ['**/*.md']` (eslint-plugin-vue `require-prop-types` crashes linting markdown), repo-wide `eslint --fix` (~55 style errors), manual: `Number.isNaN/Finite` in players, stale `@typescript-eslint/no-unused-vars` disable → `ts/no-unused-vars`, scoped `vue/no-mutating-props` disables in legacy demo players (AudioPlayer/HlsPlayer/MoqPlayer — zero behavior change), `src-ssr/server.ts` keeps single express import with `ts/consistent-type-imports` disable (splitting doubled unresolved-module TS errors).
5. ✅ CI `.github/workflows/ci.yml`: install → lint → **test:run** → **typecheck ratchet** (fails if `error TS` count > **63**; hard typecheck gate deferred until debt clusters fixed — BabylonBasicScene 10, AudioPlayer 7, chats 7, MetaTagOptions 9 landing pages, src-ssr 3).
6. ⚠️ `pnpm/yaml-enforce-settings` lint rule disabled: its expected `trustPolicy: no-downgrade` rejects lockfile `chokidar@4.0.3` (newest 4.x published; only remediation would be forcing a `chokidar@5` override onto sass/vite-plugin-checker — risky for dev watch). `pnpm install` confirmed working without it.

**Verify:** `pnpm lint` exit 0; `test:run` ✅ 49; typecheck ratchet 63 = baseline; `build` ✅. E2E vs live stack still pending (Zitadel config).

---

## Open decisions (must answer before Phase 1/2)

**Decided 2026-10-12 (user):**

| # | Decision | Resolution |
|---|---|---|
| 1 | Auth integration | **A — SPA OIDC code+PKCE against Zitadel** |
| 2 | Cross-origin strategy | **dev proxy (`quasar.config.ts`) + same-origin prod (Traefik `/api/*`,`/ws/*`)** |
| 7 | `MISSING-BACKEND` items (file upload, FCM, search, OG-meta) | **cut scope** — delete/stub, revisit if backend adds them |
| 3 | Starter features (39 `DROP` rows) | **minimum — leave unrouted, no nav pruning** (navs chain dormant; user decision 2026-10-12) |
| 6 | Routes to restore | **minimum — `/auth/login`, `/error`, `/members`; dashboard deferred** |
| — | Branching | work on `feat/api-refactor`, phase-by-phase commits |

**Still open:**

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 4 | Contact form backend | new xt-plat endpoint vs Supabase vs `mailto:` | decide when touching landing contact page |
| 5 | Blog backend | Supabase vs xt-plat vs static | decide when touching landing blog pages |
