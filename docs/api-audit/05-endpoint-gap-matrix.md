# 05 — Endpoint Gap Matrix

One row per frontend endpoint from `02-frontend-endpoints.md` (§1–§4, 67 rows), dispositioned against `01-backend-endpoints.md`.

**Status key:**
- `DIRECT` — same capability, same-ish path (expect few)
- `RENAME` — same capability, different path/verb/shape
- `REWORK` — target exists but request/response/semantics need reshaping
- `REPLACE-OIDC` — handled by Zitadel OIDC flow, not an API call
- `MISSING-BACKEND` — no equivalent anywhere in xt-plat/xtc-media contract
- `DROP` — starter-template feature not needed (or superseded by token claims)

## §1 Active (2 rows)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `POST /api/auth/refreshToken` | `boot/axios.ts:121` | — | `REPLACE-OIDC` | OIDC lib refresh; rewrite interceptor |
| GET `{CDN file path}` | `FileManagerService.ts:97-102` | — | `MISSING-BACKEND` | no file store; media playback URLs come from `sync-token` + `MEDIA_PUBLIC_BASE_URL` (`API_CONTRACT.md`) |

## §2 Unrouted-live (21 rows)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/appUser?page&size&sort&_q&_keyword` | `user/index.vue:123` | `GET /api/v1/organizations/{org_id}/members` | `RENAME` | no pagination on members; no `_q/_keyword` search |
| `DELETE /api/appUser/{id}` | `useCrudList.ts:321` | `DELETE /api/v1/organizations/{org_id}/members/{member_id}` | `RENAME` | owner protected, member_id is not numeric id |
| `GET /api/appUser/{id}` | `user/view.vue:207` | — (filter `GET .../members` client-side) | `MISSING-BACKEND` | no single-member GET route |
| `POST /api/appUser` | `useCrudForm.ts:173` | `POST /api/v1/organizations/{org_id}/members` | `RENAME` | body `MemberAdd` (email+role), not `{data:entity}` |
| `PUT /api/appUser/{id}` | `useCrudForm.ts:173` | `PATCH /api/v1/organizations/{org_id}/members/{member_id}` | `RENAME` | role change only; profile edits live in IdP |
| `GET /api/permission?page...` | `permission/index.vue:123` | — | `DROP` | RBAC = token scopes (`scopes.py:8-17`) |
| `DELETE /api/permission/{id}` | `useCrudList.ts:321` | — | `DROP` | idem |
| `GET /api/permission/{id}` | `permission/view.vue:104` | — | `DROP` | idem |
| `POST /api/permission` | `useCrudForm.ts:173` | — | `DROP` | idem |
| `PUT /api/permission/{id}` | `useCrudForm.ts:173` | — | `DROP` | idem |
| `GET /api/appRole?page...` | `role/index.vue:139` | — | `DROP` | roles = Zitadel project roles |
| `DELETE /api/appRole/{id}` | `useCrudList.ts:321` | — | `DROP` | idem |
| `GET /api/appRole/{id}` | `role/view.vue:230` | — | `DROP` | idem |
| `POST /api/appRole` | `useCrudForm.ts:173` | — | `DROP` | idem |
| `PUT /api/appRole/{id}` | `useCrudForm.ts:173` | — | `DROP` | idem |
| `GET /api/permission?page=0&size=10&sort=code,asc` | `example/use-axios.vue:34` | — | `DROP` | starter example page |
| `GET /api/permission/findAllBackendPermission` | `example/use-axios.vue:42` | — | `DROP` | idem |
| `GET /api/permission/1` | `example/use-axios.vue:50` | — | `DROP` | idem |
| `GET /api/permission/notfound_url` | `example/use-axios.vue:70` | — | `DROP` | error-path demo; retarget any 404 URL |
| `GET /api/permission?page...` | `example/use-pagefecth.vue:25,39` | — | `DROP` | starter example page |
| `GET /api/appUser{q}` | `example/crud-table.vue:147` | — | `DROP` | starter example page (data would map to members) |

## §3 Mocked service layer (40 rows)

### AuthenService (7)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `POST /api/auth/login` | `login.vue:100` | — | `REPLACE-OIDC` | redirect to Zitadel (code+PKCE); no credentials in SPA |
| `POST /api/auth/logout` | `useAuth.ts:79` | — | `REPLACE-OIDC` | local clear + RP-initiated logout |
| `POST /api/auth/refreshToken` (store copy) | none (dead) | — | `DROP` | dead code; replaced by OIDC lib |
| `DELETE /api/appUser/removeAccessTokenSession?id=` | `settings/security.vue:23` | — | `DROP` | session revocation is IdP-side |
| `POST /api/auth/requestVerifyCodeToResetPwd` | `ForgotPassword.vue:101` | — | `DROP` | Zitadel self-service password reset |
| `POST /api/auth/sendVerifyCodeToResetPwd` | `ForgotPassword.vue:101` | — | `DROP` | idem |
| `POST /api/auth/resetPassword` | `ForgotPassword.vue:101` | — | `DROP` | idem |

### UserService (11)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/appUser{q}` (`findAll`) | `crud-table.vue:147` | `GET /api/v1/organizations/{org_id}/members` | `RENAME` | only used by example page |
| `GET /api/appUser/currentUserData` | none | `GET /api/v1/organizations/me` | `RENAME` | also derivable from JWT claims (`sub`, email, roles) |
| `PUT /api/appUser/updateUserAvatar?fileManagerId=` | `settings/index.vue:23` | — | `MISSING-BACKEND` | no file API |
| `PUT /api/appUser/updateUserCover?fileManagerId=` | `settings/index.vue:23` | — | `MISSING-BACKEND` | no file API |
| `PUT /api/appUser/updateDefaultLocale/?locale=` | `useLang` | — | `DROP` | local preference (cookie already) |
| `PUT /api/appUser/selfUpdatePassword` | `settings/security.vue:22` | — | `DROP` | Zitadel |
| `PUT /api/appUser/updateUserPassword/{userId}` | `ChangePasswordForm.vue:82` | — | `DROP` | Zitadel |
| `PUT /api/appUser/updateUserPasswordByAdmin/{userId}` | `ChangePasswordForm.vue:82` | — | `DROP` | Zitadel admin reset |
| `GET /api/appUser/currentAuthSession{q}` | `settings/security.vue:22` | — | `DROP` | IdP-side sessions |
| `PUT /api/appUser/updatePersonalData` | `SettingPersonal.vue:55`, `SettingPhone.vue:50` | — | `DROP` | IdP profile |
| `PUT /api/appUser/updateEmail` | `SettingEmail.vue:45` | — | `DROP` | IdP profile |

### PermissionService (4) — all `DROP` (roles/scopes from token claims)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/permission/userAcl?getMenuList=` | none (never called) | — | `DROP` | drives `appStore.setPermissions()` → replace with claim parsing |
| `GET /api/permission{q}` | `test-page-fetch.vue:22` | — | `DROP` | test page |
| `GET /api/permission/findAllBackendPermission` | `role/view.vue:213` | — | `DROP` | role editor page (starter) |
| `GET /api/permission/findAllFrontendPermission` | `role/view.vue:213` | — | `DROP` | idem |

### RoleService (5) — all `DROP` (roles = Zitadel project roles; `companyId` seed maps to `org_id` but no role CRUD exists in xt-plat)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/appRole/findAllBackend` | `user/view.vue:191` | — | `DROP` | |
| `GET /api/appRole/findAllSystemFrontend` | none | — | `DROP` | |
| `GET /api/appRole/findAllByCompanyAndFrontend?companyId=` | none | — | `DROP` | multi-company seed → org concept exists, roles don't |
| `GET /api/appRole/findAllByCompany` | none | — | `DROP` | |
| `GET /api/appRole/findAllByAuthAndFrontend` | none | — | `DROP` | |

### UserNotifyService (6)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `PUT /api/userNotify/updateFcmSetting` (no-op) | none | — | `MISSING-BACKEND` | no push/FCM in platform |
| `PUT /api/userNotify/refreshFcmToken` (no-op) | none | — | `MISSING-BACKEND` | idem |
| `GET /api/userNotify/findAllByUser?page&size` | `NotificationBarMenu.vue:51` | `GET /api/v1/notifications/inbox` | `RENAME` | `limit`/`offset` + `include_read` instead of `page`/`size` |
| `GET /api/userNotify/findCountAllNotRead?lastestNotifyId=` | `useNotification.ts:8` | (inbox, counted client-side) | `REWORK` | no unread-count endpoint; also remove `999` hardcode (`useNotification.ts:13-16`) |
| `PUT /api/userNotify/updateReadNotify/{id}` | none | `POST /api/v1/notifications/mark-read` `{ids:[id]}` | `RENAME` | POST + body, not PUT + path |
| `PUT /api/userNotify/updateReadNotifyAll` | none | `POST /api/v1/notifications/mark-read` `{ids:null}` | `RENAME` | empty/null ids = mark all |

### UtilService (2)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/public/getOgMeta?url=` | `OpenGraphItemAlt.vue:24` | — | `MISSING-BACKEND` | 0 matches for og/appVersion in xt-plat; keep as client-side or drop component |
| `GET /api/public/appVersion` | none | `GET /health` (`{status, app, environment}`) | `REWORK` | partial; version lives in `env/.env` `APP_VERSION` anyway |

### FileManagerService (4) — base `APP_BASE_CDN_API`

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `POST /api/fileManager/uploadApi` (multipart) | `settings/index.vue:22`, `MarkdownEditor.vue:75` | — | `MISSING-BACKEND` | no upload route in platform or media contract (`rg upload API_CONTRACT.md` → 0) |
| `DELETE /api/fileManager/deleteFileApi/{fileId}` | none | — | `MISSING-BACKEND` | idem |
| `PUT /api/fileManager/updateUserAvatar?fileManagerId=` | none | — | `MISSING-BACKEND` | idem |
| `PUT /api/fileManager/updateUserCover?fileManagerId=` | none | — | `MISSING-BACKEND` | idem |

### SearchService (1)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `GET /api/search/v2?page&size&{q}` | none (module never imported) | — | `MISSING-BACKEND` | no search endpoint; DROP or defer |

## §4 Comment-only (4 rows)

| Frontend endpoint | Caller | Backend target | Status | Notes |
|---|---|---|---|---|
| `DELETE /api/permission/{id}` | `example/use-axios.vue:88` | — | `DROP` | commented example |
| `POST /api/permission` | `example/use-axios.vue:94` | — | `DROP` | commented example |
| `PUT /api/permission/{id}` | `example/use-axios.vue:105` | — | `DROP` | commented example |
| `POST /api/img/upload` | `MarkdownEditor.vue:104` | — | `MISSING-BACKEND` | editor image upload has no backend; disable or build |

**Status tally (67):** `RENAME` 9 · `REWORK` 2 · `REPLACE-OIDC` 3 · `MISSING-BACKEND` 13 · `DROP` 40 · `DIRECT` 0.

---

## Cross-cutting contract deltas

| Concern | xtech (current) | xt-plat (target) | Action |
|---|---|---|---|
| Base path | `/api/...` | `/api/v1/...` | rewrite service layer paths |
| Pagination | `page` (0-based, `pageStartZero`), `size`, `sort=col,dir` (`useCrudList.ts:106-137`) | `limit` (≤200, default 50), `offset`; **no sort param** | adapt `useCrudList` query builder or per-page overrides |
| Search | `_q`, `_keyword` | none | drop advanced/keyword search UI |
| List envelope | `{dataList, totalPages, ...}` or bare array (`useCrudList.ts:165-190`) | **bare JSON array** (all list routes) | use bare-array path already supported at `:183` |
| Write body | `{data: <entity>}` (`useCrudForm.ts:160-177`) | plain model objects (e.g. `MemberAdd`, `StreamUpdate`) | unwrap `{data:...}` |
| Error shape | `AppException`/`ResponseMessage` rendered by `useAxios.ts:43-86` | FastAPI `{"detail": ...}` + `WWW-Authenticate` on 401 | add `detail` mapping to toast renderer |
| Status handling | `validateStatus: status < 400` (`boot/axios.ts:36`); 401→refresh; 403→login | 401=bad/expired token; 403=scope/ownership; 402=insufficient credits; 429=quota; 409=conflict | map 403 → message not re-login; handle 402/429 |
| Headers | `Accept-Apiclient`, `X-Sync-Active`, `Accept-Language` | none of these recognized | remove `Accept-Apiclient`/`X-Sync-Active` |
| IDs | numeric (json-bigint transform, `boot/axios.ts:39-49`) | **UUID strings** (`{org_id:uuid}` etc.) | change path params/types in `types/models.ts`; bigint transform can stay (harmless) or go |
| Auth | cookie Bearer + refresh interceptor | Zitadel Bearer from OIDC lib; WS uses `?token=` | see `04-auth-gap.md` |
| WS | none | `WS /ws/notifications?token=` | new composable in Phase 5 |

## Reverse gaps (backend has, frontend doesn't)

| Backend group | Endpoints | Frontend coverage |
|---|---|---|
| Organizations | create org, get/patch/delete org, domain resolve | none (no org pages) |
| Catalogue/streams | 13 routes: create/list/get/update/delete streams, sync-token, restream ×3, recordings ×3 (DVR), telemetry | none (admin page uses hardcoded HLS URLs — `pages/admin/index.vue:63-75`) |
| Conferences | 7 routes incl. sync-token, mute | none |
| Activities | `GET /activities` feed | none |
| Economy | points, badges, leaderboard, wallet, credits/transfer | none |
| Sync/playback | `POST .../sync-token` (mints tokens + `ws_sync_url`) | none |
| WebSocket | `WS /ws/notifications` | none |
| **B2B2C loyalty** | 18 gamification rules/tasks/campaigns + 4 custom notifications (all of Surface B exclusive) | **zero — no pages, no services** |
