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

## Phase 2 — Auth (from `04-auth-gap.md`; option A assumed)
1. Add OIDC lib (`oidc-client-ts`), `src/boot/oidc.ts`: discovery from `ZITADEL_ISSUER`, code+PKCE login, silent refresh, RP-initiated logout.
2. Rewrite `boot/axios.ts` interceptor: attach lib access token; single-flight refresh via lib; 403 → error toast (not login redirect); 401 after refresh fail → logout.
3. Rewrite `useAuth.ts` (signIn = redirect flow; signOut = clear + end-session); delete `api/AuthenService.ts` mocks, `authenStore.refreshTokenProcess` (dead), `utils/jwtUtil.ts` refresh logic.
4. Rewrite `boot/requireAuth.ts`: guard on valid (unexpired) token + required scopes; map HEAD `meta.permission` codes → Zitadel scopes.
5. Derive UI permissions: parse `urn:zitadel:iam:org:project:roles` claims → `appStore.setPermissions()`; delete `PermissionService.userAcl` concept.
6. Login page: replace demo creds (`login.vue:34-35`) with "Sign in" redirect.

**Verify:** login round-trip against dev Zitadel; 401/403 behaviors; `pnpm test:run`.

## Phase 3 — Core service layer rewrite (from `05`)
1. New `src/api/` modules mirroring backend domains (keep the service-module pattern):
   - `OrgService.ts` → `/api/v1/organizations` (`me`, get/patch/delete)
   - `MemberService.ts` → `/organizations/{org_id}/members` (list/add/patch-role/delete)
   - `ActivityService.ts` → `/activities`
   - `NotificationService.ts` → `/notifications/inbox`, `POST /notifications/mark-read`
   - `UtilService.ts` → `GET /health` (drop `getOgMeta`/`appVersion` or client-side)
2. Response/request adaptations (cross-cutting table in `05`): bare arrays (already supported `useCrudList.ts:183`), drop `{data:...}` write envelope, UUID path params, `limit/offset` query builder, FastAPI `{"detail"}` error toasts, remove `Accept-Apiclient`/`X-Sync-Active` headers.
3. Delete or stub `MISSING-BACKEND` features: file upload/avatar/cover, FCM push, search, OG-meta (per §2 DROP decisions).

**Verify:** vitest with `vi.mock`/msw for the new services; manual smoke of members list against local backend.

## Phase 4 — Page rewiring
1. Restore router entries: `/auth` (OIDC), `/error*`, members page (reworked `/user`), settings (trimmed).
2. Rework `pages/user/*` → org members UI (list/add/role/remove; no single-member GET → client-side filter).
3. Prune `libs/navs.ts` dead links; delete starter pages decided in §2 (permission/role CRUD, examples) — or leave unrouted but remove nav references (minimum).
4. Dashboard `pages/index.vue` (optional): wire `GET /activities`, inbox, `GET /points`, `GET /wallet`.

## Phase 5 — Feature surfaces (F)
1. Catalogue: streams list/create/edit/delete, recordings (DVR), restream targets (**bare-array PUT**), telemetry — rewire `/admin` from hardcoded HLS to `POST /catalogue/streams` + `POST .../sync-token` (`{token, sync_token, ws_sync_url, ...}` — drift §4 in `01`).
2. Conferences: rooms CRUD + `sync-token` + mute.
3. Playback/sync: consume `ws_sync_url` / media `WS /ws/sync/*` (xtc-media, `API_CONTRACT.md §1b`).
4. Notifications: `WS /ws/notifications?token=` composable (ping/pong, close 4401); unread count = client-side from inbox (`REWORK` row in `05`).
5. Economy: wallet/points/leaderboard view; transfer with 402 handling.

## Phase 6 — B2B2C admin/loyalty (new pages, from `06` §3)
Rules editor, Tasks manager, Campaigns manager, Broadcast notifications (22 endpoints); guard UI by `org:admin`-family scopes (note: backend currently auth-only — flag for backend hardening).

## Phase 7 — Tests & CI
1. HTTP layer tests: `vi.mock` axios or add msw; cover service modules + error mapping (currently 1 sample test, `src/sample.test.ts`).
2. Auth flow tests (OIDC mock), guard tests.
3. `pnpm lint` + new `typecheck` + `test:run` in CI.

---

## Open decisions (must answer before Phase 1/2)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Auth integration | **(A)** SPA OIDC code+PKCE vs **(B)** BFF vs (C) backend auth endpoints | **A** (C rejected — contradicts `ARCHITECTURE.md`) |
| 2 | Cross-origin strategy | **(a)** same-origin Traefik proxy vs (b) add CORS to xt-plat vs (c) dev proxy only | **a + c** (`03` §3) |
| 3 | Starter features (39 `DROP` rows) | delete pages/code vs leave unrouted | delete nav refs now, delete pages in cleanup pass |
| 4 | Contact form backend | new xt-plat endpoint vs Supabase vs `mailto:` | decide in Phase 1 |
| 5 | Blog backend | Supabase vs xt-plat vs static | decide in Phase 4 |
| 6 | Routes to restore | minimum: `/auth`, `/error*`, members; dashboard optional | minimum first |
| 7 | `MISSING-BACKEND` items (file upload, FCM, search, OG-meta) | build backend support vs cut scope | cut scope initially |
