# RetailOne promotion implementation

Implemented against `CODEX_RETAILONE_UC53_UC54_UC56.md` and `DESIGN-starbucks.md`.

## Implementation mapping

The existing backend uses `src/components/`, so that structure is preserved. Frontend routing remains in App Router; feature logic is in `features/manage-promotion/`.

| UC step / message | Controller → service → repository | API | Tables |
|---|---|---|---|
| UC53 submit | `submitPromotion` → `createPromotion` / `validate` → `save` | POST `/api/promotions` | Promotions |
| UC53 resume/save/publish draft | `updateDraft` → `updateDraft` → `findById`, `save` | PUT `/api/promotions/:id/draft` | Promotions |
| Supporting list | `loadPromotions` → `loadPromotions` → `findAll` | GET `/api/promotions` | Promotions |
| UC54 load details and targets | `getDetail` → `getDetail` → `findById`, `findPromotionTargets`, existing product/category repositories | GET `/api/promotions/:id` or `/:id/targets` | Promotions, PromotionProducts, Products, Categories, PromotionProductExclusions |
| UC54 overlap/assign | `submitPromotionTargets` → `assignProducts`, `conflictsFor` → `findOverlappingPromotions`, `savePromotionTargets`, `excludeProduct`, `removeTarget` | PUT `/api/promotions/:id/targets` | PromotionProducts, PromotionProductExclusions |
| UC54 immediate removal | `removeTarget` → `removeTarget` → `removeTarget` | DELETE `/api/promotions/:id/targets/:targetId` | PromotionProducts |
| UC56 confirm delete | `confirmDeletePromotion` → `deletePromotion` → `findById`, `invoiceUsage`, `deleteOrHide` | DELETE `/api/promotions/:id` | Promotions, Invoices, cascade assignment/exclusion links |

No source DOCX, diagrams, or detailed Business Rules document exists in the working tree. The supplied brief's message mapping was used; source diagram messages were not independently verified. BR-02, BR-24, and BR-65 still require the team's complete definitions.

## Behavior and decisions

- Manager role **and** the operation-specific existing permission are required at the API. Authentication uses the existing middleware; there is no production bypass.
- Published status retains the schema's stored `Active` value. `Upcoming` and `Expired` are derived from server time. `Draft`, `Disabled`, and `Deleted` never become active automatically.
- Drafts may omit name, discount type/value, and dates. Supplied values are still validated. Minimum invoice value defaults to the schema's existing zero. Drafts can be resumed and published with the same ID; publish precedes assignment.
- Creation requires an `Idempotency-Key`, persisted with a body hash. The form retains its key for retries of the same payload and synchronously locks submission against double-clicks. Reusing a key with a different payload returns 409.
- API timestamps require an explicit offset. The UI uses GMT+7; repository conversion explicitly preserves the existing Asia/Bangkok DATETIME2 wall-time convention regardless of the machine timezone.
- Assignment is **append**, not replace: `{ productIds: [], categoryIds: [] }`. Duplicate selections are collapsed; SQL uniqueness indexes also protect links. Removal is an immediate separate DELETE by **assignment ID**, not product ID.
- Category links cover the exact category, including future selling products. Subcategories are selected separately. Inactive products never qualify at checkout and cannot be assigned directly.
- Overlap returns 409 with named conflicts. Confirmation supplies `resolution: "overwrite" | "keep"` and the displayed `conflictKeys`. Conflicts are recomputed under the transaction lock; newly encountered conflicts require another confirmation.
- Keep original skips the entire conflicting selected target, including an entire selected category if it conflicts. Outcomes identify each requested target. Nonconflicting selections can still be added.
- Overwrite transfers conflicting direct links or a matching category link. When overwriting only one product covered by an old category, an explicit exclusion preserves coverage for the other members. Category transfer includes future members. Existing invoice values are never updated.
- Category-derived coverage is labeled separately in the UI. Removing a direct link does not pretend to remove remaining category coverage; the UI explains that the category link must also be removed.
- Promotion mutations use one SQL transaction and a transaction-owned application lock. Catalog reads use HOLDLOCK; overlap and invoice reference reads use transaction locks. Failed writes roll back through the existing transaction helper.
- Active deletion is rejected before invoice checks. PAID history causes soft deletion; any other invoice reference also causes soft deletion to preserve foreign keys. Otherwise deletion is hard, with assignment/exclusion links removed by cascade. Deleted promotions are excluded from list and sales resolution.
- `salesService.getApplicablePromotions(productId, invoiceValue, variantId?)` resolves current eligibility from SQL on every call, including category exclusions and minimum invoice value. The existing sales component has **no checkout UI, checkout endpoint, or discount/payment implementation**. This contract is connected, but an operational POS and budget consumption cannot be demonstrated here. The optional maximum budget is persisted; no new checkout was invented.
- The schema originally rejected zero discounts and equal start/end times. The migration permits nonnegative discounts and `endDate >= startDate`, following the brief's explicit exceptions, while preserving percentage and budget bounds.

## Files changed

- Backend promotion controller, service, repository, model and routes in `backend/src/components/manage-promotion/`, plus service/API tests.
- Existing product repository: reusable catalog query returning Product models. Existing category repository: transaction-safe catalog read.
- Existing sales contract: real invoice usage and current promotion resolution, replacing the promotion usage stub.
- `Database/migrations/001_promotion_flows.sql`: nullable draft fields, Draft status, publish completeness constraint, request idempotency fields/index, and category-product exclusions. Existing rows are not rewritten or dropped.
- `backend/scripts/migrate-promotions.js`, `backend/scripts/promotion-sql-check.js`, and package scripts for migration and real SQL verification.
- Frontend promotion list, form, assignment view, dialog, CSS module and API client in `frontend/src/features/manage-promotion/`; thin `/promotions`, `/promotions/create`, and `/promotions/[id]/assign` routes.
- Shared menu, dashboard responsive styles, typography, and UI styles; `.gitignore` ignores the local npm cache used during dependency installation.

The supplied design is adapted using the existing warm cream canvas, tiered green palette, white cards, 12px corners, pill buttons and restrained layered shadows. Inter substitutes for proprietary fonts. RetailOne names and navigation are retained; no Starbucks marks, imagery, proprietary fonts, or Rewards treatments are copied. Gold was removed from general dashboard role/banner surfaces. Mobile navigation and form columns reflow; reduced-motion rules remain available.

Existing working-tree deletions of `Doc/` files and environment example files were left intact. No new runtime dependencies were added.

## Verification results

### Vietnamese interface

At the user's request, promotion headings, buttons, forms, confirmations, overlap prompts, validation/errors, assignment outcomes and statuses now display in Vietnamese. Dates and discount amounts use `vi-VN` formatting. The existing English API messages, permission keys and stored status values remain unchanged; `promotionText.js` translates the presentation layer. This supersedes the brief's English UI wording for the current interface. The frontend production build and checks of the required message/status translations pass. Existing Vietnamese screens and RetailOne branding are retained.

### Latest use-case and message audit

Reviewed the UC53/54/56 normal, alternative and exception flows again against the supplied brief. Corrected category reassignment so a previously excluded member is restored only after overlap resolution; made an identical draft-publish retry return the saved result rather than reject it; allowed the unchanged form to retry an uncertain save after its start time has passed (the server still validates new writes); added the draft-save success notice and human-readable assignment outcomes; prevented duplicate Back-guard history entries under Strict Mode. Development and production Next caches now use separate directories so production checks cannot corrupt an open dev session.

Current verification: **56 backend tests, seven real SQL tests, and the production build pass**. The SQL suite also checks simultaneous creation retries, publish retries, category restoration, and category-to-category overwrite with future members.

An isolated Chrome session against the local production build verified: Manager action visibility; the exact delete confirmation; Delete Cancel with no mutation; exact invalid-time/discount messages; Cancel/Stay and internal navigation retaining form data; browser Back cancellation retaining the mounted form; partial draft save with success notice; draft resume; direct publish-to-assignment redirect; exact empty-selection warning; inactive checkbox disabling; the exact overlap message with real names; overlap Cancel preserving SQL links; Keep original; Overwrite; immediate assignment removal; and Delete Agree for an upcoming promotion. Temporary audit records were removed afterward. The test browser used an isolated profile for local cross-port testing, so this audit is not a browser CORS check.

Still outside verified scope: a complete checkout/POS implementation is absent, and the complete definitions of BR-02/BR-24/BR-65 are not supplied. Promotion eligibility and paid-invoice preservation are tested at the existing sales contract and SQL boundaries. Browser simulation of every network failure and every popup-close gesture was not performed; save failure/rollback behavior is covered by backend tests.

### Follow-up verification after database configuration was corrected

The existing database grants Manager `PROMOTION_MANAGE` instead of the three granular mutation keys. Authentication and session loading now expand that legacy key to `PROMOTION_CREATE`, `PROMOTION_ASSIGN_PRODUCT`, and `PROMOTION_DELETE`, without changing stored grants. Existing signed tokens are supported, and the Manager role check remains enforced. Live `/auth/me` returns the expanded permissions; create/assign/delete probes reach validation/not-found checks rather than 403. After this fix, 55 backend tests and all six SQL checks pass. Reloading the browser refreshes its permission state and reveals the Create, Assign products and Delete actions.

The earlier SQL authentication blocker is resolved, and a private JWT secret is now configured locally. The migration's filtered-index creation was corrected to compile after its new column exists. Migration application succeeded, model verification reports zero discrepancies, and all six real SQL integration tests pass without skips, including rollback and preservation of paid-invoice amounts. The 54 backend tests also pass. Authenticated browser interactions and a complete POS checkout remain unverified. The table below records the initial implementation run; its SQL-blocked entries are superseded by these results.

| Check | Result | Evidence / limit |
|---|---|---|
| Existing plus new backend tests | PASS | `npm.cmd test`: 54 passing tests |
| UC53 validation, partial draft, status, create retry, draft edit, write failure propagation | PASS at unit boundary | Repository methods isolated using node:test mocks; no SQL persistence claim |
| UC54 selection, duplicates, inactive rejection, overlap confirmation/keep/overwrite, category-derived coverage, future members, immediate removal | PASS at unit boundary | Tests exercise service decisions and sales resolver with repository boundaries isolated |
| UC56 active-first check, hard/soft decision, paid/other references, not-found and write failure | PASS at unit boundary | Historical SQL values still require the SQL suite |
| Manager role and per-operation permissions, 401/403, response envelopes | PASS | HTTP tests use real Express routes and JWT verification, with account lookup and selected service calls isolated |
| Frontend production build | PASS | Next 14 production compilation, page generation and route manifest |
| Production HTTP smoke check | PASS | `/login`, `/promotions`, `/promotions/create`, `/promotions/1/assign` return 200 with the RetailOne document; authenticated interactions remain unverified |
| Whitespace check | PASS | `git diff --check` |
| Migration application | BLOCKED | SQL Server returns `ELOGIN`; migration has not been applied |
| Model-schema verification | BLOCKED | `npm.cmd run check-models` fails SQL authentication |
| Real SQL integration suite | BLOCKED | `npm.cmd run test:promotions:sql` fails before fixtures can be created: `ELOGIN` |
| Browser clicks: cancel/stay, Back, inline errors, network retry, redirects, Agree/Cancel | NOT VERIFIED | UI code is implemented and builds; no authenticated browser session was exercised |
| SQL uniqueness, atomic overwrite, rollback, paid-invoice amount preservation, live multi-POS behavior | NOT VERIFIED | Database authentication and the missing checkout implementation prevent end-to-end confirmation |

The explicit SQL suite creates uniquely named test categories/products/promotions and removes only its own records afterward. It checks persistence, draft publishing, retry, future category members, inactive rejection, active-delete blocking, overlap decisions, rollback after an injected mid-write failure, direct removal and hard deletion. Paid-history verification requires one existing Staff and Counter record and otherwise reports a skip. Run against a development/test database.

## Run and finish verification

1. Correct SQL Server login configuration in `backend/.env`. The current connection fails with `ELOGIN`. Configure a private `JWT_SECRET` as well; it is currently absent. Do not put database credentials in frontend public environment variables.
2. From `backend/`, run:

   ```powershell
   npm.cmd run migrate:promotions
   npm.cmd run check-models
   npm.cmd test
   npm.cmd run test:promotions:sql
   npm.cmd run dev
   ```

   The migration runner skips an already completed migration and rejects a partially applied schema. SQL can also be reviewed in `Database/migrations/001_promotion_flows.sql` before execution.

3. From `frontend/`, run `npm.cmd run dev`. If needed, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api` in `.env.local`. Sign in as a seeded Manager, then open `/promotions`.
4. Exercise Save → assignment, incomplete draft → resume → publish, invalid inputs, Cancel/Stay/Back, failed-save retry, direct/category selection, overlap Cancel/Keep original/Overwrite, direct/category removal and deletion Agree/Cancel. Verify inactive, expired, disabled and active cases against the real database.
5. From `frontend/`, run `npm.cmd run build`; use `npm.cmd start` to serve the production build. There is no separate lint script or configured frontend browser-test suite in this repository.

Completion is conditional on the blocked SQL and authenticated browser checks. No live database or POS end-to-end success is claimed.
