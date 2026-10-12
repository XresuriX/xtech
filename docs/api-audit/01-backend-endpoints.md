# 01 — Backend Endpoint Inventory (xt-plat)

Ground truth: route source in `C:\Users\Imper\Documents\GitHub\xt-plat` (no services started).
Extraction: `rg -n '@(router|app)\.(get|post|put|patch|delete|websocket)\(' src -g '*.py'`

**Counts:** 65 route declarations total = **60 under `/api/v1`** + `GET /health` + 3 webhooks + 1 WebSocket.
`/api/v1` split: **38 Frontend-surface** + **22 B2B2C-loyalty**. Global prefix: `src/interfaces/api/v1/router.py:15`.

**Auth (applies to every `/api/v1` route):** `Authorization: Bearer <Zitadel JWT>` → `TenantDep = Depends(get_tenant_context)` (`src/infrastructure/auth/zitadel.py:123-142`), 401 if missing/invalid. Roles→scopes map: `src/infrastructure/auth/scopes.py:35-67`. **There is no login/token endpoint in this repo.**

---

## Surface A — API Frontend (`docs/API_FRONTEND.md`)

### Organizations — prefix `/api/v1/organizations` (`src/domains/organizations/api.py:28`)

| Method + path | Purpose | Request → Response | Extra gates | file:line |
|---|---|---|---|---|
| `POST /api/v1/organizations` | Create org (caller becomes owner; 409 if exists) | `OrganizationCreate` → `OrganizationOut` 201 | auth only | `:39` |
| `GET /api/v1/organizations/me` | Own org + members | — → `OrganizationDetailOut` | auth only | `:87` |
| `GET /api/v1/organizations/{org_id:uuid}` | Org by UUID | — → `OrganizationOut` | auth only | `:104` |
| `PATCH /api/v1/organizations/{org_id:uuid}` | Update org | `OrganizationUpdate` → `OrganizationDetailOut` | `ORG_ADMIN` + owner (`:128`) | `:117` |
| `DELETE /api/v1/organizations/{org_id:uuid}` | Soft-delete | — → 204 | `ORG_ADMIN` + owner (`:158`) | `:148` |
| `GET /api/v1/organizations/{domain}` | Resolve org by domain string | — → `OrganizationOut` | auth only | `:164` |
| `GET /api/v1/organizations/{org_id:uuid}/members` | List members | — → `list[MemberOut]` | `_require_org_admin` (`:189`) | `:183` |
| `POST /api/v1/organizations/{org_id:uuid}/members` | Add member | `MemberAdd` → `MemberOut` 201 | `_require_org_admin` (`:202`) | `:195` |
| `PATCH /api/v1/organizations/{org_id:uuid}/members/{member_id}` | Change role (owner immutable) | `MemberRoleUpdate` → `MemberOut` | `_require_org_admin` (`:219`) | `:211` |
| `DELETE /api/v1/organizations/{org_id:uuid}/members/{member_id}` | Remove member (owner protected) | — → 204 | `_require_org_admin` (`:240`) | `:233` |

`_require_org_admin` = `MEMBERS_WRITE in scopes && tenant.is_org_admin` (`:178-180`).

### Catalogue / streams — prefix `/api/v1/catalogue` (`src/domains/catalogue/api.py:38`)

| Method + path | Purpose | Request → Response | Extra gates | file:line |
|---|---|---|---|---|
| `POST /api/v1/catalogue/streams` | Create stream (provisions media; mock fallback) | `StreamCreate` → `StreamCreateOut` 201 | `STREAMING` flag + plan quota (`service.py:100-106`, 403/429) | `:67` |
| `PATCH /api/v1/catalogue/{item_id}` | Update metadata | `StreamUpdate` → `StreamCreateOut` | `STREAMS_WRITE` + creator-or-admin (`:121-124`) | `:110` |
| `DELETE /api/v1/catalogue/{item_id}` | Soft-delete + deprovision media | — → 204 | `STREAMS_WRITE` + creator-or-admin (`:158-161`) | `:148` |
| `GET /api/v1/catalogue` | List — query `content_type`, `status_filter`, `limit`≤200 (default 50), `offset` | — → `list[StreamCreateOut]` | auth only | `:188` (params `:193-195`) |
| `GET /api/v1/catalogue/{item_id}` | Get one | — → `StreamCreateOut` | auth only | `:208` |
| `POST /api/v1/catalogue/streams/{item_id}/sync-token` | Mint playback + sync tokens | — → `{token, sync_token, ws_sync_url, expires_in, scope_type, scope_id, role, permissions}` 201 | `STREAMS_WRITE` + host (`:232-233`) | `:221` (shape `:269-278`) |
| `PUT /api/v1/catalogue/streams/{item_id}/restream-targets` | Set restream targets | **bare JSON array** `list[RestreamTarget]` → `RestreamTargetsOut` | `RESTREAM` flag (`service.py:207`) | `:281` (body `:284`) |
| `GET /api/v1/catalogue/streams/{item_id}/restream-targets` | Get targets | — → `RestreamTargetsOut` | `RESTREAM` (`service.py:220`) | `:299` |
| `DELETE /api/v1/catalogue/streams/{item_id}/restream-targets` | Clear targets | — → 204 | `RESTREAM` (`service.py:229`) | `:315` |
| `GET /api/v1/catalogue/streams/{item_id}/recordings` | List VODs | — → `RecordingsOut` | `DVR` (`service.py:238`) | `:327` |
| `DELETE /api/v1/catalogue/streams/{item_id}/recordings/{name}` | Delete one VOD | — → 204 | `DVR` (`service.py:248`) | `:343` |
| `PUT /api/v1/catalogue/streams/{item_id}/recording` | Toggle live recording | `RecordingToggle` → `RecordingToggle` | `DVR` (`service.py:257`) | `:364` |
| `GET /api/v1/catalogue/streams/{item_id}/telemetry` | Live status (`live, publishers, readers, bytes_*`) | — → `TelemetryOut` | `STREAMING` (`service.py:270`) | `:384` |

### Conferences — prefix `/api/v1/conferences` (`src/domains/conferences/api.py:21`)

| Method + path | Purpose | Request → Response | Extra gates | file:line |
|---|---|---|---|---|
| `POST /api/v1/conferences` | Create room (Oryx SFU) | `ConferenceCreate{title, max_participants, layout}` → `ConferenceOut` 201 | `CONFERENCING` flag (`service.py:47-48`) | `:52` |
| `GET /api/v1/conferences` | List rooms — `limit`≤200, `offset` | — → `list[ConferenceOut]` | auth only | `:76` |
| `GET /api/v1/conferences/{room_id}` | Get room | — → `ConferenceOut` | auth only | `:88` |
| `PATCH /api/v1/conferences/{room_id}` | Update settings | `ConferenceUpdate` → `ConferenceOut` | `CONFERENCES_WRITE` + host-or-admin (`:110-113`) | `:99` |
| `DELETE /api/v1/conferences/{room_id}` | End room | — → 204 | `CONFERENCES_WRITE` + host-or-admin (`:144-147`) | `:138` |
| `POST /api/v1/conferences/{room_id}/sync-token` | Mint join/sync tokens | — → same shape as stream sync-token 201 | `CONFERENCES_WRITE` + host (`:185-186`) | `:174` (shape `:195-230`) |
| `POST /api/v1/conferences/{room_id}/participants/{pid}/mute` | Mute participant | `{muted}` → `{"ok", "participant_id", ...}` | `CONFERENCES_WRITE` + host-or-admin (`:244-247`) | `:233` |

### Activities & notifications inbox — no prefix (`src/domains/activities/api.py:21`)

| Method + path | Purpose | Request → Response | Gates | file:line |
|---|---|---|---|---|
| `GET /api/v1/activities` | Org activity feed — `limit`≤200, `offset` | — → `list[ActivityOut]` | auth only | `:27` |
| `GET /api/v1/notifications/inbox` | Inbox — `include_read`, `limit`≤200 | — → `list[NotificationOut]` | auth only | `:39` |
| `POST /api/v1/notifications/mark-read` | Mark read (ids null/empty = all) | `MarkReadRequest{ids?}` → `MarkReadResponse{marked}` | auth only | `:53` |

### Gamification & economy — no prefix (`src/domains/gamification/api.py:21`)

| Method + path | Purpose | Request → Response | Gates | file:line |
|---|---|---|---|---|
| `GET /api/v1/points` | Caller's points | — → `PointsOut{user_id,total}` | auth only | `:72` |
| `GET /api/v1/badges` | Earned badges | — → `list[BadgeOut]` | auth only | `:79` |
| `GET /api/v1/leaderboard` | Org leaderboard — `limit` (default 50) | — → `list[LeaderboardRow]` | auth only | `:88` |
| `GET /api/v1/wallet` | Credit balance | — → `WalletOut{user_id,balance,reserved}` | auth only | `:107` |
| `POST /api/v1/credits/transfer` | ACID credit transfer (402 on insufficient) | `TransferRequest{recipient_id,amount,note}` → `TransferOut` 201 | **auth only — no `ECONOMY_WRITE` check in code** (verified `:115-120`) | `:115` |

### WebSocket

| Protocol | Purpose | Auth | file:line |
|---|---|---|---|
| `WS /ws/notifications?token=<zitadel-jwt>` | Notification push; `ping`/`pong`; close `4401` on bad token | JWT as query param (`_authorize` `:17-26`) | `src/interfaces/websocket/notifications.py:29` (router prefix `/ws` `:14`) |

---

## Surface B — API Frontend B2B2C (`docs/API_FRONTEND_B2B2C.md` + loyalty code)

**Shared core:** Surface A rows 1–38 above are also the B2B2C surface (the B2B2C doc reframes them for org-admins; role matrix at `docs/API_FRONTEND_B2B2C.md:17-24`). No separate router/prefix exists — grep confirms zero `frontend`/`b2b2c` matches in `src/`.

**B2B2C-exclusive: custom gamification (loyalty)** — prefix none, full paths below; auth-only (no scope checks; verified all handlers take only `SessionDep, TenantDep`) — `src/domains/gamification/api_custom.py` (migration `alembic/versions/0003_b2b2c_loyalty.py`):

| Method + path | Purpose | Request → Response | file:line |
|---|---|---|---|
| `GET /api/v1/gamification/rules` | List rules — `include_inactive` | — → `list[CustomRuleOut]` | `:42` |
| `GET /api/v1/gamification/rules/{rule_id}` | Get rule (404) | — → `CustomRuleOut` | `:49` |
| `POST /api/v1/gamification/rules` | Create rule | `CustomRuleCreate` → `CustomRuleOut` 201 | `:58` |
| `PATCH /api/v1/gamification/rules/{rule_id}` | Update rule | `CustomRuleUpdate` → `CustomRuleOut` | `:66` |
| `DELETE /api/v1/gamification/rules/{rule_id}` | Delete rule | — → 204 | `:76` |
| `GET /api/v1/tasks` | List tasks — `include_inactive` | — → `list[TaskOut]` | `:87` |
| `GET /api/v1/tasks/{task_id}` | Get task | — → `TaskOut` | `:94` |
| `POST /api/v1/tasks` | Create task | `TaskCreate` → `TaskOut` 201 | `:103` |
| `PATCH /api/v1/tasks/{task_id}` | Update task | `TaskUpdate` → `TaskOut` | `:111` |
| `DELETE /api/v1/tasks/{task_id}` | Delete task | — → 204 | `:121` |
| `POST /api/v1/tasks/complete` | Mark task complete | `TaskCompleteRequest` → `TaskCompletionOut` | `:130` |
| `GET /api/v1/tasks/my-completions` | My completions — `limit` (default 50) | — → `list[TaskCompletionOut]` | `:142` ⚠️ **shadowed**, see drift §3 |
| `GET /api/v1/campaigns` | List campaigns | — → `list[CampaignOut]` | `:151` |
| `GET /api/v1/campaigns/{campaign_id}` | Get campaign | — → `CampaignOut` | `:158` |
| `POST /api/v1/campaigns` | Create campaign | `CampaignCreate` → `CampaignOut` 201 | `:167` |
| `PATCH /api/v1/campaigns/{campaign_id}` | Update campaign | `CampaignUpdate` → `CampaignOut` | `:176` |
| `DELETE /api/v1/campaigns/{campaign_id}` | Delete campaign | — → 204 | `:188` |
| `GET /api/v1/campaigns/{campaign_id}/progress` | Progress for caller | — → `dict` | `:197` |

**B2B2C-exclusive: custom notifications** — `src/domains/notifications/api.py` (auth-only, `TenantDep` at `:32,52,71,86`):

| Method + path | Purpose | Request → Response | file:line |
|---|---|---|---|
| `POST /api/v1/notifications/send` | Send one custom notification | `CustomNotificationSend` → `CustomNotificationOut` 201 | `:28` |
| `POST /api/v1/notifications/broadcast` | Send to many users | `CustomNotificationBroadcast` → `list[CustomNotificationOut]` 201 | `:48` |
| `GET /api/v1/notifications/custom-inbox` | Custom inbox — `include_read`, `limit` | — → `list[CustomNotificationOut]` | `:68` |
| `POST /api/v1/notifications/custom-mark-read` | Mark custom read | `CustomNotificationMarkRead` → `CustomNotificationMarkReadResponse` | `:82` |

Loyalty endpoints are documented only in `docs/PLATFORM_CAPABILITIES.md:90-98` — **not** in `docs/API_FRONTEND_B2B2C.md`.

---

## Not for frontend

| Route | Auth | file:line |
|---|---|---|
| `GET /health` | none | `src/main.py:53` |
| `POST /webhooks/media/stream-started` | `X-Webhook-Secret` (`_require_webhook_secret`) | `src/interfaces/api/webhooks/media.py:92` |
| `POST /webhooks/media/stream-ended` | same | `:105` |
| `POST /webhooks/media/viewer-joined` | same | `:118` |
| Swagger `/docs`, ReDoc `/redoc`, `/openapi.json` | none | FastAPI defaults (`src/main.py:41-46`) |
| Platform→media `/internal/*`, media-side `WS /ws/sync/{scope}/{id}` | live in **xtc-media** repo | `API_CONTRACT.md` §1, §1b |

---

## Doc-vs-code drift (all verified against source)

1. **Pagination:** docs say `?page=&page_size=` (`docs/API_FRONTEND.md:220`); code uses `limit`/`offset` everywhere (`catalogue/api.py:194-195`, `conferences/api.py:80-81`, `activities/api.py:31-32`) — zero `page_size` matches in `src/domains`.
2. **Catalogue list filter** is `status_filter`, not `status` (`catalogue/api.py:193`).
3. **`GET /api/v1/tasks/my-completions` is unreachable:** registered at `api_custom.py:142`, *after* `GET /tasks/{task_id}` at `:94`; Starlette matches in registration order, `{task_id}` swallows the path → 422 on UUID validation. Fix: register `my-completions` before `{task_id}` (backend bug to report).
4. **`sync-token` response:** docs show `{token, urls:{hls_url,…}}` (`API_FRONTEND.md:245-257`); code returns `{token, sync_token, ws_sync_url, expires_in, scope_type, scope_id, role, permissions}` (`catalogue/api.py:269-278`, `conferences/api.py:195-230`).
5. **`PUT .../restream-targets` body:** docs show `{"targets":[...]}`; code takes a **bare JSON array** (`catalogue/api.py:284`).
6. **`PUT/GET /api/v1/conferences/{id}/audio-sync`** documented in `docs/API_FRONTEND_GAMING.md:300-302` — **not implemented** (0 matches for `audio-sync` in `src/`).
7. **Scope gaps:** `POST /credits/transfer` (docs: `ECONOMY_WRITE`) and all 22 loyalty/custom-notification routes enforce authentication only — no scope checks in code (`gamification/api.py:115-120`, `api_custom.py`, `notifications/api.py`).
8. **`docs/AI_REFERENCE.md` + `API_FRONTEND*.md` predate the loyalty endpoints**; `docs/API.md` is the code-faithful reference.
