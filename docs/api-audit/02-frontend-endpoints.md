# 02 — Frontend Endpoint Inventory (xtech)

Sources: ripgrep over `xtech/src` (`rg -n '/api/' src`), verified per-file in the dirty working tree (2026-10-12).
Base-URL knobs: `APP_BASE_API` (all API calls) and `APP_BASE_CDN_API` (file/CDN calls).

**Totals:** 65 distinct `/api/...` string occurrences in code paths — **2 active**, **21 unrouted-live** (real HTTP code, page not in router), **~40 mocked** (HTTP commented out, `setTimeout` + `src/libs/data.ts`), **7 comment-only**. Plus 1 live CDN-origin fetch pattern and non-REST calls below.

**Route reachability (current `src/router/routes.ts`):** only `/admin` + landing pages + 404 are routed. No `meta.requireAuth` anywhere → `src/boot/requireAuth.ts` is inert. Everything marked "unrouted" lives on pages that existed in `git show HEAD:src/router/routes.ts` (388 lines) but were removed from the router.

---

## 1. Active (real HTTP today)

| Method | Path | Caller | Base var | Notes |
|---|---|---|---|---|
| POST | `/api/auth/refreshToken` | `src/boot/axios.ts:121` (401 interceptor), `src/stores/authenStore.ts:80` | `APP_BASE_API` | body `{refreshToken:{refreshToken}}`; store variant has no callers (dead) |
| GET | arbitrary file path | `src/api/FileManagerService.ts:97-102` (`fethCdnData`/`downloadCdnData`) | `APP_BASE_CDN_API` | used by `BaseImage.vue`, `BaseImageView.vue`, `BasePdfView.vue`, `BaseFileViewDialog.vue` |

## 2. Unrouted-live (real HTTP, page not in router)

All built by `useCrudList.ts` / `useCrudForm.ts` from `apiEndpoint + '/' + pascalToCamelCase(crudName)`:

| Method | Path | Built from | Status of page |
|---|---|---|---|
| GET | `/api/appUser?page=&size=&sort=&_q=&_keyword=` | `pages/user/index.vue:123-124` via `useCrudList.ts:93-100,106-137` | unrouted |
| DELETE | `/api/appUser/{id}` | `useCrudList.ts:321-325` | unrouted |
| GET | `/api/appUser/{id}` | `pages/user/view.vue:207-208` via `useCrudForm.ts:70-89` | unrouted |
| POST | `/api/appUser` (body `{data: entity}`) | `useCrudForm.ts:173-177` (action new/copy) | unrouted |
| PUT | `/api/appUser/{id}` (body `{data: entity}`) | `useCrudForm.ts:136-148,173-177` (action view) | unrouted |
| GET | `/api/permission?page=&size=&sort=code,asc&_q=&_keyword=` | `pages/permission/index.vue:123-124` | unrouted |
| DELETE | `/api/permission/{id}` | `useCrudList.ts:321-325` | unrouted |
| GET | `/api/permission/{id}` | `pages/permission/view.vue:104-105` | unrouted |
| POST | `/api/permission` (body `{data: entity}`) | `useCrudForm.ts:173-177` | unrouted |
| PUT | `/api/permission/{id}` (body `{data: entity}`) | `useCrudForm.ts:173-177` | unrouted |
| GET | `/api/appRole?page=&size=&sort=name,asc&_q=&_keyword=` | `pages/role/index.vue:139-140` | unrouted |
| DELETE | `/api/appRole/{id}` | `useCrudList.ts:321-325` | unrouted |
| GET | `/api/appRole/{id}` | `pages/role/view.vue:230-231` | unrouted |
| POST | `/api/appRole` (body `{data: entity}`) | `useCrudForm.ts:173-177` | unrouted |
| PUT | `/api/appRole/{id}` (body `{data: entity}`) | `useCrudForm.ts:173-177` | unrouted |
| GET | `/api/permission?page=0&size=10&sort=code,asc` | `pages/example/composables/use-axios.vue:34` | unrouted |
| GET | `/api/permission/findAllBackendPermission` | `use-axios.vue:42` | unrouted |
| GET | `/api/permission/1` | `use-axios.vue:50` | unrouted |
| GET | `/api/permission/notfound_url` (error demo) | `use-axios.vue:70` | unrouted |
| GET | `/api/permission?page=&size=&sort=` | `pages/example/composables/use-pagefecth.vue:25,39` → `usePageFetch.ts:44-51` | unrouted |
| GET | `/api/appUser{q}` | `pages/example/crud-table.vue:147` → `UserService.findAll` (mocked body) | unrouted |

## 3. Mocked service layer (HTTP commented out; URLs preserved)

### `src/api/AuthenService.ts`
| Method | Path | line | Invoked from |
|---|---|---|---|
| POST | `/api/auth/login` | `:16` | `pages/auth/login.vue:100-119` (**routed? no** — `/auth` removed from router) |
| POST | `/api/auth/logout` | `:32` | `composables/useAuth.ts:79` |
| POST | `/api/auth/refreshToken` | `:50` | unused (dead; active copy lives in `boot/axios.ts:121`) |
| DELETE | `/api/appUser/removeAccessTokenSession?id={id}` | `:64` | `pages/settings/security.vue:23` |
| POST | `/api/auth/requestVerifyCodeToResetPwd` | `:81` | `components/app/ForgotPassword.vue:101` |
| POST | `/api/auth/sendVerifyCodeToResetPwd` | `:97` | `ForgotPassword.vue:101` |
| POST | `/api/auth/resetPassword` | `:113` | `ForgotPassword.vue:101` |

### `src/api/UserService.ts` (all mocked)
| Method | Path | line |
|---|---|---|
| GET | `/api/appUser{q}` | `:18` |
| GET | `/api/appUser/currentUserData` | `:29` (no callers) |
| PUT | `/api/appUser/updateUserAvatar?fileManagerId={id}` | `:42` |
| PUT | `/api/appUser/updateUserCover?fileManagerId={id}` | `:58` |
| PUT | `/api/appUser/updateDefaultLocale/?locale={locale}` | `:72` |
| PUT | `/api/appUser/selfUpdatePassword` | `:85` |
| PUT | `/api/appUser/updateUserPassword/{userId}` | `:103` |
| PUT | `/api/appUser/updateUserPasswordByAdmin/{userId}` | `:121` |
| GET | `/api/appUser/currentAuthSession{q}` | `:136` |
| PUT | `/api/appUser/updatePersonalData` | `:150` (dup comment `:167`) |
| PUT | `/api/appUser/updateEmail` | `:178` |

### `src/api/PermissionService.ts` (all mocked)
| Method | Path | line |
|---|---|---|
| GET | `/api/permission/userAcl?getMenuList={n}` | `:8` — **never called; ACL never loaded** (`appStore.setPermissions()` unfed) |
| GET | `/api/permission{q}` | `:20` (`pages/test-page-fetch.vue:22`) |
| GET | `/api/permission/findAllBackendPermission` | `:31` (`pages/role/view.vue:213`) |
| GET | `/api/permission/findAllFrontendPermission` | `:42` (`pages/role/view.vue:213`) |

### `src/api/RoleService.ts` (all mocked)
| Method | Path | line |
|---|---|---|
| GET | `/api/appRole/findAllBackend` | `:8` (`pages/user/view.vue:191`) |
| GET | `/api/appRole/findAllSystemFrontend` | `:20` (no callers) |
| GET | `/api/appRole/findAllByCompanyAndFrontend?companyId={id}` | `:33` (no callers; multi-company seed) |
| GET | `/api/appRole/findAllByCompany` | `:44` (no callers) |
| GET | `/api/appRole/findAllByAuthAndFrontend` | `:55` (no callers) |

### `src/api/UserNotifyService.ts` (all mocked; 2 are no-op bodies)
| Method | Path | line |
|---|---|---|
| PUT | `/api/userNotify/updateFcmSetting` | `:13` (no-op) |
| PUT | `/api/userNotify/refreshFcmToken` | `:22` (no-op) |
| GET | `/api/userNotify/findAllByUser?page=&size=` | `:33` (`components/notification/NotificationBarMenu.vue:51`) |
| GET | `/api/userNotify/findCountAllNotRead?lastestNotifyId={id}` | `:46` (`composables/useNotification.ts:8` — which hard-sets `999` for testing) |
| PUT | `/api/userNotify/updateReadNotify/{notifyId}` | `:57` (no callers) |
| PUT | `/api/userNotify/updateReadNotifyAll` | `:68` (no callers) |

### `src/api/UtilService.ts` (mocked)
| Method | Path | line |
|---|---|---|
| GET | `/api/public/getOgMeta?url={link}` | `:8` (`components/base/OpenGraphItemAlt.vue:24`) |
| GET | `/api/public/appVersion` | `:26` (no callers) |

### `src/api/FileManagerService.ts` (upload/delete mocked; base = `APP_BASE_CDN_API`, `:15`)
| Method | Path | line |
|---|---|---|
| POST | `/api/fileManager/uploadApi` (multipart) | `:27` (`pages/settings/index.vue:22`, `components/base/MarkdownEditor.vue:75`) |
| DELETE | `/api/fileManager/deleteFileApi/{fileId}` | `:41` (no callers) |
| PUT | `/api/fileManager/updateUserAvatar?fileManagerId={id}` | `:55` (no callers) |
| PUT | `/api/fileManager/updateUserCover?fileManagerId={id}` | `:69` (no callers) |

### `src/api/SearchService.ts` (mocked; **module never imported anywhere**)
| Method | Path | line |
|---|---|---|
| GET | `/api/search/v2?page=&size=&{q}` | `:17` |

## 4. Comment-only (documentation in source, no code)

- `POST/PUT/DELETE /api/permission[...]` — `pages/example/composables/use-axios.vue:88,94,105` (inside `/* */` block)
- `POST /api/img/upload` — `components/base/MarkdownEditor.vue:104` (commented `axios.post`)
- `actionList: '/api/permission'` — `pages/permission/index.vue:136` (commented option)
- commented `http://192.168.7.249:8080` — `boot/axios.ts:26`
- non-endpoint matches: `https://randomuser.me/api/portraits/*` in `libs/data.ts` (mock fixture images) and service-module `import` lines — no API traffic

## 5. Non-REST network calls

| Kind | URL | Location |
|---|---|---|
| HLS stream | `https://xrcomms.xamaycatechnologies.cloud:8888/{room}.m3u8` (hardcoded fallback) | `pages/admin/index.vue:63,69,75,249`, `pages/landing/demo.vue:48`, `pages/landing/blog-player.vue:24` |
| MoQ/WebRTC relay | `https://relay.example.com/anon?name={room}` (fallback); `VITE_MOQ_URL` | `demo.vue:49,61`, `blog-player.vue:25` |
| Supabase | `createClient(...)` + `from('contacts').insert(...)` — **commented**, README:133-139 | `pages/landing/contact.vue:81-83,99` |
| `fetch()` (assets, no API base) | arbitrary URLs | `utils/fileUtil.ts:25,150`, `base/BasePdfView.vue:102,125` |

---

## 6. Request contract (what the backend must honor or the frontend must change)

**Headers per request** (`src/composables/useAxios.ts:153-177`, `src/boot/axios.ts:73-80`):
- `Authorization: Bearer <cookie _myappkey_token>` — set on `api.defaults` before every call (`useAxios.ts:153`)
- `Accept-Apiclient: default` — static (`boot/axios.ts:33`)
- `Accept-Language` — from cookie `LocaleKey` (request interceptor `boot/axios.ts:76`)
- `X-Sync-Active: 0|1` (`useAxios.ts:172`)
- Base URL per call: `req.baseURL ?? process.env.APP_BASE_API` (`useAxios.ts:155-159`); instance reset at `boot/axios.ts:27,118`, `authenStore.ts:73`, `usePreFetch.ts:52`

**Refresh flow** (`boot/axios.ts:81-154`): any 401 + refresh cookie present → single-flight `POST /api/auth/refreshToken`, queued retries replayed with new Bearer; refresh 403 → redirect `/auth/login`. Tokens stored in cookies `_myappkey_token` / `_myappkey_refresh_token` (`libs/constant.ts:6-7`, written `useAuth.ts:56-68`).

**List pagination** (`useCrudList.ts:106-137`): `?page={0-based}&size={n}&sort={col},{asc|desc}&_q={op:val...}&_keyword={text}` (`SearchParamiter='_q'`, `KeywordParamiter='_keyword'` — `libs/constant.ts:14-15`).

**List response envelope** (`useCrudList.ts:165-190`, `types/common.ts:294`): Spring-style `{ dataList, totalPages, ... }` (via `isListResponse`), with fallback to a bare array (`:183`).

**Write payload envelope** (`useCrudForm.ts:160-177`): body = `{ data: <entity> }` (`RequestDto`).

**Error expectations** (`useAxios.ts:43-86,129-137`): 4xx/5xx bodies shaped as `AppException` or `ResponseMessage` → rendered as toasts; `validateStatus: status < 400` (`boot/axios.ts:36`).

**JSON parsing:** `json-bigint` transform (`boot/axios.ts:39-49`) — ids are numeric/Snowflake-style in the old backend; xt-plat uses **UUIDs** (string-safe).
