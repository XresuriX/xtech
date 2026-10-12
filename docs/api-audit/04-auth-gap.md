# 04 — Auth Gap Analysis

## 1. Current xtech flow (hand-rolled JWT-in-cookie, all against a backend that doesn't exist)

```
login.vue → AuthenService.singin() [MOCKED, AuthenService.ts:16-27]
  → resolves { authenticationToken, refreshToken, ... } from libs/data.ts
  → useAuth.setAuthenticationCookies() [useAuth.ts:63-68]
      cookie _myappkey_token (30d, 'Lax') + _myappkey_refresh_token ('Strict')   [constant.ts:6-7,12]
  → window.location.replace(APP_PUBLIC_PATH)

every request → useAxios.callAxiosProcess [useAxios.ts:153]
  → api.defaults.headers.Authorization = `Bearer <cookie token>`

401 response → boot/axios.ts:81-154 interceptor
  → if refresh cookie: POST /api/auth/refreshToken {refreshToken:{refreshToken}}  [:121-125]
  → success: authenStore.setRefreshTokenCookie → replay original with data.authenticationToken [:129-133]
  → refresh 403: redirect /auth/login [:140-143]
  → concurrent 401s queued (isRefreshing/failedQueue) [:54-66]

route guard → boot/requireAuth.ts:7-20: `meta.requireAuth && !cookie` → redirect /auth
  (cookie existence only — no expiry/claims check)
RBAC guard → useRequiredAuth.ts:9-20 → appStore.isHavePermissionLazy
  (permissions list NEVER populated — PermissionService.userAcl is mocked & uncalled)

dormant: authenStore.refreshTokenProcess [authenStore.ts:62-120] — proactive refresh when
  <5min to expiry (jwtUtil.canRefreshToken, jwtUtil.ts:15-33); no callers = dead code
```

Supporting: `src/api/AuthenService.ts` (login/logout/refresh/forgot-password — all mocked), `src/utils/jwtUtil.ts` (`jwt-decode`).

## 2. Backend reality (xt-plat + Zitadel)

- **No login/token/refresh/logout endpoints exist.** Verified: `rg 'login|oauth2|/authorize|/token' xt-plat/src` → only `POST /internal/tokens` (platform→media service call, `src/infrastructure/api/media_client.py:70`).
- Identity is external: **Zitadel OIDC**. SPAs run the OAuth2/OIDC flow against Zitadel directly, then send `Authorization: Bearer <zitadel-jwt>` (`docs/API_FRONTEND.md:10-14`, `ARCHITECTURE.md:79-108`).
- Validation: `decode_user_token` via JWKS `{ZITADEL_ISSUER}/oauth/v2/keys` (`src/infrastructure/auth/zitadel.py:57-82`), issuer + optional audience check; 401 `Missing bearer token` / `Invalid or expired token` (`zitadel.py:123-142`).
- Claims → `TenantContext`: `sub` (user), resource-owner id (**org id**), org domain/name, project roles (`urn:zitadel:iam:org:project:roles`), email/name; 403 if resource-owner claim missing (`zitadel.py:94-120`).
- Roles → scopes: `org_owner`/`org_admin` → all 10 scopes; `stream_admin` → streams/catalogue write+read; `streamer` → streams write+read; `viewer` → streams read + notifications read (`scopes.py:35-67`).
- WebSocket auth: same JWT as **query param** `?token=` (`src/interfaces/websocket/notifications.py:17-31`), close code `4401`.
- Error contract: 401 with `WWW-Authenticate: Bearer` header; 403 `detail` strings (FastAPI style).

## 3. Gap table

| xtech expects | xt-plat reality | Disposition |
|---|---|---|
| `POST /api/auth/login` → `{userId, authenticationToken, refreshToken, expiresAt}` | **MISSING** — no auth endpoints at all | Replace with OIDC code+PKCE against Zitadel (Option A) |
| `POST /api/auth/refreshToken` body `{refreshToken:{refreshToken}}` | **MISSING** | Zitadel refresh token via OIDC client lib (silent re-auth / refresh grant) |
| `POST /api/auth/logout` | **MISSING** | Local session clear + Zitadel end-session endpoint (RP-initiated logout) |
| `POST /api/auth/requestVerifyCodeToResetPwd` etc. (3 routes) | **MISSING** | Handled by Zitadel self-service (password reset in IdP UI) |
| Cookies `_myappkey_token` / `_myappkey_refresh_token` set client-side | Backend never sets cookies; stateless Bearer | Decide storage: cookie (XSS-adjacent as today) vs sessionStorage vs lib-managed memory; OIDC lib handles rotation |
| 401 → refresh → replay interceptor (`boot/axios.ts:81-154`) | 401 = invalid/expired; refresh not via API | Rewrite interceptor for OIDC lib token acquisition + single-flight refresh |
| `Accept-Apiclient: default` header (`boot/axios.ts:33`) | Unused | Remove |
| `requireAuth.ts` cookie-presence guard | — | Validate token expiry (and org claim presence) instead of mere cookie existence |
| Permissions from `/api/permission/userAcl` (mocked, uncalled) → `appStore.setPermissions()` | Roles/scopes live in JWT claims (`scopes.py:35-67`) | Derive UI permissions from decoded roles/scopes; drop userAcl concept |
| `authenStore.refreshTokenProcess()` proactive refresh (dead) | — | Delete or fold into OIDC lib auto-refresh |
| `Accept-Language` cookie → header | Backend has no i18n handling | Keep (harmless) or drop |
| `WS /ws/notifications` (not used yet) | JWT via `?token=` query param | Pass current access token as query param when WS is wired |

## 4. Integration options

| # | Option | Effort | Impact | Files touched (xtech) |
|---|---|---|---|---|
| **A (recommended)** | SPA **OIDC Authorization Code + PKCE** directly against Zitadel using a browser lib (e.g. `oidc-client-ts` / `keycloak-js`-style). Access token attached as Bearer; silent refresh handled by lib. | Medium | Replaces entire §1 refresh machinery with lib config | NEW: `src/boot/oidc.ts` (or composable); REWRITE: `boot/axios.ts` (interceptor → lib token), `composables/useAuth.ts`, `stores/authenStore.ts`, `boot/requireAuth.ts`; DELETE: `api/AuthenService.ts` mocks, `utils/jwtUtil.ts` refresh logic, `authenStore.refreshTokenProcess`; config: `env/.env*` (`ZITADEL_ISSUER`, client id, redirect URI) |
| **B** | BFF/proxy token service (frontend talks to a small backend that owns tokens) | High | Adds a new deployable; cookies become httpOnly (better security) | Same files + new service; xt-plat unchanged |
| **C** | Keep hand-rolled auth, add auth endpoints to xt-plat | — | **Infeasible as-is:** contradicts architecture (`ARCHITECTURE.md:79-108` "no OAuth login in-repo"); duplicates IdP | backend changes out of scope |

**OPEN DECISION:** choose A or B before refactor Phase 2. Option A assumed in the draft plan; needs Zitadel project/application (SPA type, redirect URIs) provisioned — note `.env.example:6-12` already documents the Zitadel project setup steps.

## 5. Downstream effects

- Route guards/meta: restore `requireAuth` + permission meta from HEAD routes but re-express `permission: [...]` in terms of Zitadel scopes (`org:admin`, `org:streams:write`, ... `scopes.py:8-17`).
- Demo credentials in `login.vue:34-35` (`admin@mydomain.com`) become invalid — login page becomes a "Sign in with Zitadel" redirect.
- Anything decoding the old token shape (`userId`, `expiresAt` from `libs/data.ts:43-48`) must switch to standard claims (`sub`, `exp`, `urn:zitadel:iam:org:project:roles`).
- WS + sync-token flows (Phase 5) depend on having a raw access token in memory — Option A provides this naturally.
