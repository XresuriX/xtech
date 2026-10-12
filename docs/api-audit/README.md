# XTech ↔ XT-Platform API Audit

Examination deliverables for refactoring this frontend onto the
XT Platform API (`/api/v1`) — surfaces: "API Frontend" and "API Frontend B2B2C".

| # | Deliverable | Status |
|---|---|---|
| 01 | [Backend endpoint inventory](01-backend-endpoints.md) | done |
| 02 | [Frontend endpoint inventory](02-frontend-endpoints.md) | done |
| 03 | [Config & hosting analysis](03-config-hosting.md) | done |
| 04 | [Auth gap analysis](04-auth-gap.md) | done |
| 05 | [Endpoint gap matrix](05-endpoint-gap-matrix.md) | done |
| 06 | [Surface mapping (frontend vs B2B2C)](06-surface-mapping.md) | done |
| 07 | [Refactor plan draft](07-refactor-plan-draft.md) | done — 7 open decisions pending (see §2 of 07) |

Rules: no services started; xt-plat route source = source of truth over docs;
every endpoint claim cites `file:line`.

Sources: `xt-plat/docs/API_FRONTEND.md`, `xt-plat/docs/API_FRONTEND_B2B2C.md`,
`xt-plat/docs/API.md` (code-faithful), `xt-plat/src/**/api*.py` (ground truth).
