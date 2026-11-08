# RetailOne UC64 / UC66 implementation

Implemented directly in the existing JavaScript modular monolith and Next.js App Router project, using `CODEX_RETAILONE_UC64_UC66.md` for behavior and `DESIGN-starbucks.md` for visual styling. Staff Management follows the repository's established `backend/src/components/` layout. The UI remains Vietnamese as requested earlier; RetailOne branding and shared components are retained.

## Message and persistence mapping

| Flow | View / controller | Service | Repository / DB |
|---|---|---|---|
| UC64 open form | `StaffFormView`, GET `/api/staff/roles` | `getRoles` | New shared auth `RoleRepository.findAll`, existing Roles table |
| UC64 submit | `StaffFormView.submit` → `StaffController.submitStaffAndAccount` | `createStaff` / `validate` | `RoleRepository.findById`, `StaffRepository.existsByPhoneNumber`, `findDuplicateContacts`, shared `UserRepository.save`, `StaffRepository.save`; Users + Staff in one transaction |
| UC64 show credentials | One-time native modal; POST `/api/staff` returns 201 | Returns credentials only after commit | Only bcrypt hash is persisted; no credential retrieval endpoint |
| Minimal staff list/detail | `StaffListView`; GET `/api/staff`, GET `/api/staff/:id` | `listStaff`, `getStaff` | Staff models and shared User/Role repositories; password hashes, token versions and ID-card values omitted from public reads |
| UC66 lock/unlock | `StaffListView` confirmation → `StaffController.changeAccountStatus`; PATCH `/api/staff/:id/account-status` with `{ isActive: "locked" | "active" }` | `changeAccountStatus` | Resolve Staff/User, compare actual caller identity, check resignation; shared `UserRepository.updateActiveStatus` changes status and increments tokenVersion atomically |
| Minimal first-login integration | `/change-password`, POST `/api/auth/change-password` | Existing auth service `changePassword` | Existing bcrypt utility and shared User repository; update hash, clear first-login flag, increment tokenVersion, return fresh session |

No source DOCX, Staff sequence/communication diagram, or detailed Business Rules file was found in the working tree. The supplied spec's class/message responsibilities were followed. The complete definitions of BR-01, BR-02 and BR-72 cannot be independently verified; they have not been invented.

## Behavior and security

- Every Staff endpoint requires existing authentication, actual Manager role, and its existing operation permission. Manager role alone does not bypass feature permissions. Legacy `STAFF_LOCK` grants are expanded to `STAFF_CHANGE_STATUS` for existing DB data/tokens, just as the existing promotion compatibility mapping works. Stored grants are preserved.
- Required creation fields: full name, phone, numeric ID card and an existing role. Email is optional and checked for duplication when supplied. Salary fields are not added to the form; existing DB defaults are used. Initial status is Active and cannot be changed to Locked through the creation API.
- Schema bounds are enforced: name <=100 characters, phone <=20 characters (digits with an optional initial `+`), ID card 1–20 digits, email <=100 characters. No unsupported fixed national phone/ID length is imposed. Email is trimmed/lowercased. The schema's existing phone and ID uniqueness constraints remain authoritative.
- SQL Server generates numeric User/Staff IDs. A cryptographically random login name is generated in the existing username column. Initial passwords use 18 random bytes (144 bits), encoded as 24 base64url characters. The existing bcryptjs utility hashes them; there is no shared/default password.
- Staff/User creation is atomic. The new account is `active`, `requirePasswordChange=true`. Failed inserts roll back the linked User as well. A module transaction lock serializes staff/account mutations; SQL uniqueness constraints protect against other writers. Duplicate phone returns the exact API message `This Phone number already exists` and a field error; the UI renders it in Vietnamese.
- A successful POST returns `{ staff, credentials: { userId, username, initialPassword } }` with `Cache-Control: no-store` and `Pragma: no-cache`. The password is shown in component state only, with an explicit secure-handover acknowledgment. Dismissal clears the state. It is not placed in URLs, browser storage, ordinary GET responses, logs or email. Staff responses are also marked non-cacheable. No plaintext password is persisted for later retrieval.
- If the initial response is lost after commit, plaintext credentials cannot be recovered. The UI tells the Manager to inspect the staff list before retrying; duplicate phone/ID constraints prevent another account for the same submitted identity. Password reset/recovery remains outside UC64/66 scope.
- Every protected request loads current account status and compares the signed token version against the DB version. Lock and Unlock each increment that version in the same SQL update as the status change. Unlocking restores login eligibility with existing credentials but cannot restore revoked tokens. There is no asynchronous cache invalidation step that could silently fail.
- Self-lock compares the target User ID to `req.user.userId` resolved by authentication, ignoring client-supplied identities. Exact API rejection: `Action denied. You cannot lock your own account`; the UI gives a Vietnamese explanation and disables the self-lock control.
- The schema has no separate permanent-lock flag. Its existing equivalent is resignation: `employmentStatus='resigned'` blocks login and reactivation. Locking alone never changes employment status or deletes future schedules.
- New/flagged accounts may access `/api/auth/me` and `/api/auth/change-password`, but business APIs return `PASSWORD_CHANGE_REQUIRED` until the password changes. The UI redirects to `/change-password` on login and also guards direct business-page navigation.
- Password change verifies the current password, rejects reuse, hashes the new password, clears the first-login flag and revokes the bootstrap token. The UI stores only the new signed session, never password fields. The minimal password policy is 12 characters minimum and 72 UTF-8 bytes maximum (bcrypt boundary); this is an implementation security choice, not an invented BR definition.
- Existing versionless tokens are treated as version zero to preserve current sessions after migration. Once a user's tokenVersion changes, those old tokens are permanently invalid. Existing accounts already marked `requirePasswordChange` must now complete that change before using business APIs.

## Database changes

`Database/migrations/002_staff_account_security.sql` has been applied successfully to the configured database:

- Adds `Users.tokenVersion INT NOT NULL DEFAULT 0` for token revocation.
- Adds filtered unique index `UX_Staff_Email` for non-null email values.

The migration does not delete/rewrite existing records, and can be rerun with `npm.cmd run migrate:staff`. Existing email duplicates were checked before application; none were found. Schema verification reports zero model/DB discrepancies.

## UI and routes

- `/staff`: real staff listing, role/account/employment labels, search, status filter, lock/unlock confirmation and self-lock/permanent-lock explanation.
- `/staff/create`: required fields, real role options, inline errors, submitting lock, cancellation and the one-time credential modal.
- `/change-password`: minimum first-login password handover completion; business navigation is blocked until successful.
- The Staff sidebar entry is enabled. Existing promotions and other modules remain available according to their permissions.

Staff UI uses existing Inter typography, warm cream canvas, white cards with 12px corners, layered shadows, green pill CTAs and a deep-green feature band. Native dialogs provide modal focus/keyboard behavior; form columns collapse on mobile. There are no Starbucks logos, proprietary fonts, Rewards assets or ordering widgets, and no new dependencies.

## Verification

| Check | Result |
|---|---|
| Backend unit/API suite | PASS — 65 tests |
| Real Staff SQL/HTTP suite | PASS — 10 tests, no skips |
| Promotion SQL regression suite | PASS — 7 tests |
| Frontend production build | PASS — includes `/staff`, `/staff/create`, `/change-password` |
| Model-schema check | PASS — zero discrepancies |
| Whitespace check | PASS |

The Staff SQL/HTTP suite verifies linked creation, random-password hashing and one-time/no-cache response, no credentials/hashes in GET, duplicate phone/email/ID and invalid fields/roles, rollback after User insert when Staff insert fails, first-login restrictions and password change, bootstrap-token rejection, live lock rejection, unlock with old-token rejection, fresh login with existing credentials, Manager-only RBAC, self-lock rejection even with a spoofed caller ID in the body, missing targets, rollback of a failed status/revocation write, resignation restrictions, preserved employment/future shifts, and concurrent duplicate submissions.

Isolated Chrome checks against the local production build verified required-field errors without creating accounts, Cancel/Stay/discard, duplicate-phone field highlighting, the generated credential modal, absence of the initial password from localStorage/sessionStorage, removal of credentials after acknowledgment, lock confirmation Cancel with no PATCH, confirmed lock/unlock persistence, first-login redirection, inability to bypass the password-change page through Products, successful password change and rejection of the old bootstrap token. The browser used a temporary isolated profile for cross-port testing; these are not browser CORS/TLS tests. Temporary Staff/User/schedule fixtures were removed after tests, and no generated passwords were printed.

## Changed areas and running

- Staff component: existing controller/service/repository/routes, plus focused service and HTTP tests.
- Auth component: reused User repository and models, added Role repository, live token/version/first-password guard, and minimal password-change API.
- Frontend: staff feature components/API/CSS, thin staff routes, Staff menu entry, and auth password-change component/route/session integration.
- Database/scripts: the additive migration, `migrate-staff.js`, `staff-sql-check.js`, and two package scripts.

From `backend/`:

```powershell
npm.cmd run migrate:staff
npm.cmd run check-models
npm.cmd test
npm.cmd run test:staff:sql
npm.cmd run dev
```

From `frontend/`, use `npm.cmd run dev`, then sign in as a Manager and open `/staff`. Production verification uses `npm.cmd run build` and `npm.cmd start`. The repository has no separate lint script.

There are no remaining local execution blockers. Full source-diagram/BR conformance remains limited by missing source documents. Local testing uses localhost HTTP; production credential handover requires the deployment's HTTPS transport. This work does not add production certificates, password reset, resignation, staff editing, or unrelated UC screens.
