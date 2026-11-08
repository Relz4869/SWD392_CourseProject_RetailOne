# RETAILONE — CODEX IMPLEMENTATION SPEC
## UC64 Create Staff Information & Account · UC66 Change Staff Account Status

> **Role:** Senior Full-Stack Engineer. Inspect the existing RetailOne workspace first, then **implement both Use Cases end to end**, not only a plan. Source of truth: `Major Features - UC description - Architecture.docx` (UC64, UC66); relevant Staff Management implementation/interaction diagrams if present; the actual repository and database schema. Also use `DESIGN-starbucks.md` **only for the UI design system**. Preserve existing conventions and working code. Report any material mismatch instead of silently inventing requirements.

## 1. Scope and required behavior

Implement **only UC64 and UC66**, plus minimal supporting staff listing/profile navigation and API reads required for these flows. Do not independently implement UC63, UC65, UC67, UC68 or other unrelated use cases. Both use cases are **Manager-only** and require server-side RBAC, not just hidden UI controls.

- **UC64:** Manager creates a staff profile and a linked login account, selects a Role, and sets account status to Active. Generate a unique User ID and a secure random initial password; persist only a password **hash**; mark the account as **must change password on first login**. Return the initial password through a secure, one-time response to the authorized Manager, and show it once for secure handover.
- **UC66:** Manager deactivates/locks or unlocks an existing staff account. On lock, immediately block future API requests and revoke all active sessions/tokens. On unlock, allow login with the existing credentials, except when another security rule (e.g., permanent lock) prevents it. Prevent Manager self-locking.

Use real API + database persistence; no mock-only data or decorative buttons. Prefer changes localized to Staff Management and existing shared auth/session infrastructure.

## 2. Required architecture and project organization

- **Language:** JavaScript / JSX.
- **Frontend:** Next.js 14 App Router + React 18; **Feature-first**; pages/routes in `frontend/src/app/`, staff UI/logic in `frontend/src/features/manage-staff/`, shared components/API client in `frontend/src/shared/`.
- **Backend:** Node.js 24 + Express 4; **Modular Monolith + Component-Based**, with `route → controller → service → repository → model` responsibilities inside `backend/src/modules/manage-staff/` (or the *actual equivalent* if the repository already has a standardized layout).
- **Database:** Verify the actual SQL Server connection/ORM/schema (or real database implementation) first; do not assume table/column names. Reuse shared user/role repositories, authentication middleware, password utility, and session/token infrastructure. Do not duplicate them inside Staff Management.
- **Object-oriented design:** Respect StaffController, StaffService, StaffRepository, UserRepository, RoleRepository, and related User/Role/Staff models from the Staff Implementation Class Diagram. Do not force every JavaScript module to be a class if the project convention differs.
- **Do not restructure unrelated code**, change existing API contracts casually, create unnecessary files/dependencies, or copy a repository/utility that already exists.

### Expected layout (adapt to the actual repository)

```text
backend/src/
├── modules/
│   └── manage-staff/
│       ├── staff.routes.js
│       ├── staff.controller.js
│       ├── staff.service.js
│       ├── staff.repository.js
│       └── staff.model.js              # only if consistent with existing ORM/schema
├── middlewares/                     # shared authentication + RBAC + account-status checks
├── config/
└── utils/                           # reuse password/session helpers

frontend/src/
├── app/
│   └── (dashboard)/staff/
│       ├── page.jsx                 # reuse existing staff list; minimal navigation only
│       └── create/page.jsx          # new staff/account creation
├── features/
│   └── manage-staff/
│       ├── components/              # StaffForm, account status dialog, errors/results
│       ├── hooks/                   # only if needed
│       └── services/                # staff API calls
└── shared/                           # common UI components / API client
```

The UI for account locking/unlocking may live in an existing staff profile or staff list action menu; do not create an unnecessary duplicate page.

## 3. Mapping messages to Staff Implementation Class Diagram

| UC | UI/View messages | Controller | Service | Repository / model | Result |
|---|---|---|---|---|---|
| **UC64** | `AdminDashboardView.showStaffCreationForm()` → `StaffFormView.submitStaffAndAccount(staffData)` | `StaffController.submitStaffAndAccount(staffData)` | `StaffService.checkDuplicateContactAndCreate(staffData)` / `createStaffAndAccount(staffData)` | `StaffRepository.existsByPhoneNumber`, `save`; `UserRepository.save`; `RoleRepository.findById`; related `Staff`, `User`, `Role` | `StaffFormView.showCreatedAccount(result)` or `showDuplicatePhoneError()` / `showValidationErrors(errors)` |
| **UC66** | `AdminDashboardView.showStaffAccountControls(staffId)` → `StaffAccountView.changeAccountStatus(staffId,status)` | `StaffController.changeAccountStatus(staffId,status)` | `StaffService.preventSelfLock(currentManagerId)` / `updateAccountStatusAndRevokeSessions(staffId,status)` | `StaffRepository.findById`; `UserRepository.findByStaffId`, `updateActiveStatus` (and existing session/token invalidation mechanism) | `StaffAccountView.showUpdatedAccountStatus()` or `showSelfLockDenied()` |

**Preserve actual diagram method names when possible**, adapting parameter representation to Express request handlers and existing codebase conventions. The diagram is conceptual: do not create one file per method. All relevant UI → Controller → Service → Repository → DB operations require success/error responses back to the UI. If sequence/communication diagrams exist in the workspace, inspect their guards, messages, returns, and alternative paths before implementation.

## 4. UC64 — Create Staff Information & Account

### Preconditions and normal flow 64.0

1. Only an authenticated **Manager** with user-creation permission can use the UI/API. Manager opens Staff Management and clicks **Add employee**.
2. Show **StaffFormView** with mandatory fields from UC: **Full name, Phone number, ID card**; select an existing **Role** and initial account status **Active**. Use the fields and identifiers of actual Staff/User/Role schema. Do not invent unrelated required fields.
3. Manager clicks **Save / Create Account**. Validate user input on both client and server. Server checks the selected Role exists and duplicates (phone and email **if email is collected/present**).
4. Service securely generates the new **User ID** through the established database mechanism and a **cryptographically random initial password**. Hash the password with the project's secure password-hashing mechanism (**bcrypt** where used by RetailOne). Never store, log, or email the plaintext password.
5. Create linked **Staff** and **User** records atomically in a database transaction; account is **Active**, and `mustChangePassword` (or equivalent existing flag) is set so the staff member must change the default password upon first login (UC70 integration). Never commit only one of the two records if the other fails.
6. Return a successful result with User ID and initial password to the authorized Manager over the existing protected HTTPS/session context; display it **once** with a clear secure-handover instruction. Don't expose it in audit logs, URLs, localStorage, analytics, or later GET endpoints. After dismissing the dialog, do not allow the plaintext password to be retrieved again. Navigate/update staff list using existing routes.

### Alternative flow 64.1 — Cancel

- If Manager clicks Cancel or leaves before Save, discard unsubmitted data; do **not** create Staff/User records. Respect existing unsaved-form behavior; a confirmation dialog is optional if the current UI already uses one.

### Exception flows

| Flow | Trigger | Required result |
|---|---|---|
| **64.0.E1** | Phone already belongs to a registered staff/account (or duplicate email if provided) | Reject save, show **`This Phone number already exists`** for duplicate phone, highlight the offending field; do not create records. Enforce uniqueness at the DB level when supported; handle races without leaking data. |
| **64.0.E2** | Missing Name/Phone or ID card with invalid format (UC example: letters in the ID field) | Validate and highlight fields immediately; server also rejects bad data. Do not create records. |
| DB/transaction failure | Insert fails for Staff or User | Roll back both; show a safe, retryable error; do not display a generated password as if the account was saved. |
| Permission failure | Non-Manager calls API directly | Return **403** (or existing standard) and do not reveal credentials/staff data. |

**Business rules:** BR-01, BR-02, BR-72 as referenced by UC64; inspect definitions if available. The user must change their generated password at first login. Do not invent a hard-coded default password. Preserve existing authentication flows and do not independently implement all of UC70 unless a minimal integration guard is required to satisfy this requirement.

## 5. UC66 — Change Staff Account Status

### Preconditions and normal flow 66.0 — Lock/Deactivate

1. An authenticated Manager opens an existing staff profile and selects **Deactivate** (or the existing account-control action).
2. Display a confirmation dialog. If Manager cancels, no state changes.
3. After confirmation, check at the **server** that the target Staff/User exists and the caller has Manager permission. Resolve the current Manager's real User/Staff identity and **reject self-lock**; do not trust identity sent by client.
4. Service marks the account **Locked/Inactive** in the database using the existing account-status representation, and revokes active sessions/access tokens using the authentication system already present (e.g., a session revocation store or token-version change).
5. Return success; show the new status in `StaffAccountView` and update the relevant staff UI. Future requests from this account must be rejected, including if a token was issued before locking. **Do not delete future shifts**: locking is not resignation.

### Alternative flow 66.1 — Unlock

1. Manager selects an account that is Locked and clicks **Unlock**.
2. Server checks authorization and account eligibility, updates account to **Active**, and confirms success.
3. The employee can sign in again with their existing credentials. Unlocking must **not restore/revalidate revoked tokens**. Do not override a permanent resignation lock or other security restriction.

### Exception flows

| Flow | Trigger | Required result |
|---|---|---|
| **66.0.E1 Self-Locking Prevention** | Manager tries to lock their own account | Reject before mutation, display **`Action denied. You cannot lock your own account`**. |
| **66.0.E2 Session termination sync error** | Token/cache invalidation fails or stale access token remains | Ensure **every protected API request** checks the live account status through shared authentication middleware or an equivalently reliable invalidation strategy. A locked user must not keep using APIs despite stale sessions. Surface operational error and avoid false security success. |
| Unauthorized / missing staff | Non-Manager or unknown target | Return **403 / 404** or existing API standard; no mutation. |

**Business rules:** BR-02. Disabling an account does not remove schedules or imply `employmentStatus = Resigned`. Keep the existing user and staff records intact. Respect `permanentlyLocked` (or the existing equivalent) if present.

### Token/session safety details

- Inspect the actual token/session model before coding. Do not assume JWT, Redis, or a cache exists.
- If the system uses signed stateless JWTs, changing a DB flag alone is insufficient **unless middleware checks that flag on each protected request**. Revoke via the existing token-version/session strategy if available; enforce account state server-side.
- If revocation and state mutation cannot be made atomic, design a safe fail-closed sequence: the locked state in the DB takes effect for every request; report any incomplete revocation rather than pretending it succeeded. Add only the minimal necessary integration.
- Test requests with a previously valid token immediately after locking, then after unlocking; previously revoked tokens should not regain access.

## 6. UI: use `DESIGN-starbucks.md` as a design reference

- **Functional spec here wins for behavior; `DESIGN-starbucks.md` controls visual style.** Apply its warm cream `#f2f0eb` canvas, green primary CTA `#00754A`, deep green `#1E3932` where appropriate, white 12px-radius cards, subtle shadows, pill-shaped buttons, clear typography, and responsive spacing.
- Use **Inter/Manrope or an existing licensed font**, not proprietary Starbucks typefaces. Do **not** use Starbucks logos/branding, rewards assets, floating ordering buttons, or unrelated shopping widgets.
- Adapt styles to the **RetailOne Manager dashboard** and reuse its existing sidebar, navigation, shared forms, toasts, loading indicators, and dialogs.
- UC64 UI: accessible Add employee form, Role selector from real data, inline field validation, submitting state, success screen/dialog showing initial password **only once**, explicit acknowledgment/secure handover.
- UC66 UI: clear **Active/Locked** account status, confirm dialog for Deactivate, Unlock action, self-lock rejection, loading/success/error states; destructive actions distinguishable without relying on color alone.
- Ensure keyboard accessibility, sufficient contrast, and responsive presentation. Do not sacrifice security or usability merely to mimic a visual pattern.

## 7. API, persistence, tests and acceptance criteria

- Inspect and reuse existing REST paths and response conventions; if missing, expose minimum needed endpoints for create Staff+User, view available Roles, update account status, and retrieve target account details. Do not duplicate routes.
- Apply auth, Manager RBAC, data validation, error mapping, and safe logging consistently. Never expose password hashes or plaintext passwords in ordinary GETs.
- Use the project's real DB schema and migration conventions. Preserve role relationships and User↔Staff linkage. If schema lacks `mustChangePassword`, account-status checks, or revocation support, implement the smallest safe, reviewed schema change consistent with project conventions or document a blocker; do not silently fake security behavior.
- Create minimal focused tests or use the project's existing test patterns; avoid extra testing frameworks or unnecessary packages.

**Required validation scenarios:**

- [ ] UC64 Manager creates a valid Staff + User; DB records are linked, account Active; generated password works only according to current auth policy, with forced first-login password change.
- [ ] UC64 Cancel creates nothing; duplicate phone/email prevents saves; missing name/phone and invalid ID format show field-level errors.
- [ ] UC64 DB failure rolls back both records; initial password never appears in logs or later responses; unauthorized API use returns 403.
- [ ] UC66 Manager locks another account; UI reflects Locked; active sessions are invalidated; a previously valid token cannot call protected API endpoints.
- [ ] UC66 Manager unlocks account; old credentials may be used to sign in again, but revoked old tokens cannot be reused.
- [ ] UC66 Manager cannot lock self; unauthorized and unknown-target actions fail safely.
- [ ] UC66 Lock/Unlock does **not** change employment status or delete future shifts; permanent locks cannot be bypassed.
- [ ] Existing build/lint/tests pass or any pre-existing failure is clearly identified; both screens match the supplied RetailOne-adapted UI design.

## 8. Execution requirements

1. Inspect repository, auth, roles, staff/user schemas, migrations, Staff diagrams, and existing styles first. Record actual paths before changing code.
2. Implement both UCs end-to-end; integrate frontend/backend/database. Reuse existing components and services.
3. Run available build/lint/tests and manually or programmatically exercise key normal, alternative, and exception paths.
4. Fix issues introduced by the changes. Do **not** stop after planning.
5. Report concisely: files changed, endpoints and UI routes, tests run/results, any schema/migration or security limitations, and any conflict between UC description and existing code.

> **Important:** This specification is grounded in UC64/UC66 descriptions and the Staff Implementation Class Diagram provided by the project. Other Use Cases, full authentication internals, exact table names and deployment credentials are **not** supplied here; inspect the real repository and report unsupported assumptions rather than inventing them.
