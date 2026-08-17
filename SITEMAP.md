# I-Wash-Noda — Build Sitemap & Page Specs

> A page-by-page build blueprint for the **I-Wash-Noda laundry service platform**, generated from the actual Express routes (`apps/api/src/routes/*` + `apps/api/src/server.ts`) and Prisma schema. Every page below tells you exactly which endpoint(s) it calls, what it displays, and what the user can do on it.

---

## 1. Conventions

| Item | Value |
| --- | --- |
| API base URL | `http://localhost:3000/api` (prod: `API_URL`) |
| Swagger UI | `http://localhost:3000/docs` |
| Web app (Next.js) | `http://localhost:3001` |
| Auth method | HTTP-only cookies: `access_token` (30 min) + `refresh_token` (7 days). All authenticated requests must send `credentials: "include"`. |
| Step cookie | `temp_jwt` cookie is set during multi-step flows (register / reset password / change email) and consumed by `requireStep` middleware. |
| Pagination | Some list endpoints support pagination; not all (see `feature.md` TODOs). |
| Time format | `HH:mm` for shift times; ISO 8601 UTC for timestamps. |

### 1.1 Roles

| Role | Description | Apps it logs into |
| --- | --- | --- |
| `super_admin` | Full system access, creates outlets/items/admins | Super Admin dashboard |
| `outlet_admin` | Runs one outlet (orders, proofs, complaints, schedules, walk-ins) | Outlet Admin dashboard |
| `driver` | Picks up and delivers laundry | Driver app |
| `worker` | Processes laundry at a station (`washing`, `ironing`, `packing`) | Worker app |
| `customer` | Regular end user | Customer app |

### 1.2 Enums (from Prisma — use these exact values)

**Order status flow** (`OrderStatus`):

```
waiting_for_driver_pickup → out_for_pickup → in_transit_to_outlet → arrived_at_outlet
→ washing_in_progress → ironing_in_progress → packing_in_progress
→ waiting_for_payment → waiting_for_driver_deliver → out_for_delivery → delivered
→ finished
(anywhere → complaint_received, cancelled)
```

- `StationName` / `WorkerStation`: `washing`, `ironing`, `packing`
- `PaymentMethod`: `manual`, `payment_gateway`
- `PaymentProofStatus`: `pending`, `approved`, `rejected`
- `ComplaintStatus`: `pending`, `resolved`, `rejected`
- `MismatchStatus`: `pending`, `approved`, `rejected`
- `WorkerShiftDay`: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- `OrderSource`: `customer_app`, `walk_in`

---

## 2. Verified API Endpoint Map

> The single source of truth, traced from `server.ts` route mounting + each route file. (This replaces the outdated `apiDocs.md` table.)

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/` | public | Health check |
| GET | `/docs` | public | Swagger UI |

### Authentication & Setup

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/setup/` | public | Is first super-admin setup required? (409 if exists) |
| POST | `/api/setup/` | public | Create first `super_admin` (rate-limited) |
| POST | `/api/register` | public | Step 1: send OTP to email (rate-limited 10) |
| POST | `/api/verify` | public + `temp_jwt`(step 1) | Step 2: verify OTP body `{token}` or query `?token=` (rate-limited 5) |
| POST | `/api/complete-register` | public + `temp_jwt`(step 2) | Step 3: set name/password/phone/role (rate-limited 3) |
| POST | `/api/resend-otp` | public | Resend OTP (rate-limited 3) |
| POST | `/api/login` | public | Email + password login, sets cookies |
| GET | `/api/logout` | auth | Clear cookies |
| GET | `/api/refresh` | auth (`refresh_token`) | Rotate access + refresh tokens |
| POST | `/api/reset-password-request` | public | Send reset OTP |
| POST | `/api/reset-password-confirm` | `temp_jwt`(step 69) | Confirm reset with OTP + new password |
| GET | `/api/me` | auth | Get profile |
| PUT | `/api/me` | auth | Update name/password |
| POST | `/api/change-email-request` | auth | Send OTP to new email |
| PUT | `/api/change-email-confirm` | auth + `temp_jwt`(step 67) | Confirm new email with OTP |
| ALL | `/api/auth/*splat` | public | Better Auth (Google/GitHub/Twitter OAuth, sessions) |

### Addresses

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/addresses/` | auth | List my addresses |
| POST | `/api/addresses/` | auth | Create address |
| PUT | `/api/addresses/:id` | auth | Update address |
| DELETE | `/api/addresses/:id` | auth | Delete address |
| PUT | `/api/addresses/:id/set-default` | auth | Set default address |

### Outlets (public) & Items (public-ish)

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/outlets/coverage?lat=&lng=` | public | Outlets covering a lat/lng |
| GET | `/api/outlets/` | public | List all outlets |

### Customer / Pickup / Orders

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/pickup-requests/coverage-check` | customer | Is my default address within coverage? |
| POST | `/api/pickup-requests/` | customer | Create pickup request `{addressId, outletId}` |
| DELETE | `/api/pickup-requests/:id` | customer | Cancel a still-pending pickup request |
| GET | `/api/pickup-requests/status` | customer | Latest order status for the user |
| GET | `/api/orders/active` | customer | Currently in-progress order |
| GET | `/api/orders/complete` | customer | Most recently completed order |
| POST | `/api/orders/:orderId/payment/:paymentMethod` | customer | Set `payment_gateway` or `manual` |
| GET | `/api/orders/:orderId/payment-gateway` | customer | Get Midtrans Snap token + redirect URL |
| POST | `/api/orders/:orderId/payment` | customer | Upload payment proof `{urlProof}` (manual) |
| POST | `/api/orders/:orderId/payment/cancel` | customer | Cancel current payment method / expire pending Snap |
| POST | `/api/orders/:orderId/complete` | customer | Confirm order received → `finished` |
| POST | `/api/orders/:orderId/complaint` | customer | Submit complaint `{complaintMessage, complaintImage}` |

### Driver — Pickup

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/pickup-requests/` | driver | Pending pickups in my outlet |
| POST | `/api/pickup-requests/:id/accept` | driver | Accept pickup |
| GET | `/api/pickup-requests/accepted` | driver | My accepted pickup jobs |
| PATCH | `/api/pickup-requests/:id/next` | driver | Advance pickup status |
| GET | `/api/pickup-requests/already-picked-up` | driver | My completed pickups |

### Driver — Delivery

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/driver/delivery-requests/available` | driver | Pending deliveries in my outlet |
| POST | `/api/driver/delivery-requests/:deliveryId/accept` | driver | Accept delivery |
| PATCH | `/api/driver/delivery-requests/:deliveryId/next` | driver | Advance delivery status |
| GET | `/api/driver/delivery-requests/active` | driver | My in-progress deliveries |
| GET | `/api/driver/delivery-requests/complete` | driver | My completed deliveries |

### Worker (Station)

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/workers/available` | worker | Orders waiting at my station |
| GET | `/api/workers/active` | worker | Orders I'm processing |
| POST | `/api/workers/:orderId/accept` | worker | Claim an order at my station |
| POST | `/api/workers/reinput/:orderId` | worker | Re-input item quantities (detects mismatch) |
| POST | `/api/workers/complete/:orderId` | worker | Finish my station → next station |
| GET | `/api/workers/complete` | worker | My completed jobs history |

### Outlet Admin — Orders

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/orders/` | outlet_admin | All orders in my outlet |
| PATCH | `/api/admin/orders/:orderId` | outlet_admin | Update order items + total weight |
| GET | `/api/admin/orders/payment-proof/` | outlet_admin | Pending payment proofs |
| POST | `/api/admin/orders/payment-proof/:id/:action` | outlet_admin | Approve/reject proof (approve → auto delivery request) |
| GET | `/api/admin/orders/complaints` | outlet_admin | Pending complaints |
| POST | `/api/admin/orders/complaints/:complaintId/:status` | outlet_admin | Resolve/reject complaint |

### Outlet Admin — Walk-in Customers & Mismatches

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/admin/walk-in-customer/` | outlet_admin | Create walk-in customer |
| GET | `/api/admin/walk-in-customer/?keyword=` | outlet_admin | Search walk-in customers |
| PATCH | `/api/admin/walk-in-customer/:id` | outlet_admin | Update walk-in customer |
| DELETE | `/api/admin/walk-in-customer/:id` | outlet_admin | Delete walk-in customer |
| POST | `/api/admin/walk-in-customer/orders/:id` | outlet_admin | Create manual order for walk-in customer |
| GET | `/api/admin/mismatch/?stationName=` | outlet_admin | List mismatches |
| GET | `/api/admin/mismatch/:orderId/:stationName` | outlet_admin | Mismatch detail |
| PUT | `/api/admin/mismatch/:orderId/:stationName` | outlet_admin | Approve/reject mismatch items + set final qty |

### Outlet Admin — Schedule & Staff & Items

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/schedule/?role=&station=&name=` | outlet_admin, super_admin | List schedules (with dashboard counts) |
| GET | `/api/admin/schedule/summary-dashboard` | outlet_admin, super_admin | Station coverage summary per day |
| GET | `/api/admin/schedule/no-shift-workers?keyword=&role=` | outlet_admin, super_admin | Workers/drivers without a schedule |
| GET | `/api/admin/schedule/:id` | outlet_admin, super_admin | Get one worker's schedule |
| POST | `/api/admin/schedule/:id` | outlet_admin, super_admin | Create/update weekly schedule |
| POST | `/api/admin/register` | outlet_admin, super_admin | Register internal user (worker/driver/outlet_admin) |
| GET | `/api/admin/users` | outlet_admin, super_admin | List all users |
| PATCH | `/api/admin/users` | outlet_admin, super_admin | Change user role |
| DELETE | `/api/admin/users/:userId` | outlet_admin, super_admin | Remove user |
| GET | `/api/admin/items/` | outlet_admin, super_admin | List items |
| GET | `/api/admin/items/search?name=` | outlet_admin, super_admin | Search items |

### Super Admin Only

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/admin/outlets/` | super_admin | Create outlet |
| PUT | `/api/admin/outlets/:id` | super_admin | Update outlet |
| DELETE | `/api/admin/outlets/:id` | super_admin | Delete outlet |
| GET | `/api/admin/items/:id` | super_admin | Get one item |
| POST | `/api/admin/items/` | super_admin | Create item |
| PUT | `/api/admin/items/:id` | super_admin | Update item |
| DELETE | `/api/admin/items/:id` | super_admin | Delete item |

### Infrastructure

| Method | Full path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/signature/:folder{/:params}{/:unique}` | auth | Cloudinary signed upload URL (`avatars`, `payment-proofs`, `complaints`; rate-limited 5) |
| POST | `/api/midtrans/notification` | public (webhook) | Midtrans payment status webhook |

> Note: all `:id`-less route variants (e.g. `PUT /api/addresses/` with no id) simply return an "id required" error — no UI needs them, but the client should always send the id.

---

## 3. Sitemap Tree (pages grouped by app)

```
SHARED AUTH & ONBOARDING
├── /setup              Create first super admin
├── /login              Login (email/password + social)
├── /register           Register step 1 (email)
├── /register/verify    Register step 2 (OTP)
├── /register/complete  Register step 3 (profile)
├── /forgot-password    Reset request
├── /reset-password     Reset confirm (OTP)
├── /profile            Profile, change email, logout

CUSTOMER APP
├── /                   Home / outlets + coverage
├── /location           Choose location (GPS/pinpoint)
├── /addresses          Address book
├── /addresses/new      Add address
├── /addresses/:id      Edit address
├── /pickup             Request pickup
├── /order              Active order status + tracking
├── /order/:id/payment  Payment (gateway / manual proof)
├── /order/complete     Completed order
├── /order/:id/complaint  Submit complaint

DRIVER APP
├── /jobs/pickup        Available pickups
├── /jobs/pickup/:id    Pickup detail → accept → advance status
├── /jobs/pickup/accepted    My accepted pickups
├── /jobs/pickup/history     Completed pickups
├── /jobs/delivery      Available deliveries
├── /jobs/delivery/:id  Delivery detail → accept → advance status
├── /jobs/delivery/active    Active deliveries
├── /jobs/delivery/history   Completed deliveries
├── /schedule           My shift schedule

WORKER APP
├── /jobs/available     Available jobs at my station
├── /jobs/active        My in-progress jobs
├── /jobs/:id/process   Re-input quantities + accept
├── /jobs/history       My completed jobs
├── /schedule           My shift schedule

OUTLET ADMIN DASHBOARD
├── /admin              Dashboard (stats)
├── /admin/orders       All orders
├── /admin/orders/:id   Order detail / edit items
├── /admin/payments     Payment proofs review
├── /admin/complaints   Complaints review
├── /admin/mismatch     Mismatch list
├── /admin/mismatch/:orderId/:station  Mismatch detail
├── /admin/walk-in      Walk-in customers (list + search + CRUD)
├── /admin/walk-in/new  Create walk-in customer
├── /admin/orders/manual/:walkinId  Create manual order
├── /admin/schedule     Schedules list + create
├── /admin/schedule/summary  Schedule dashboard
├── /admin/staff        Staff management
├── /admin/items        Items list/search

SUPER ADMIN DASHBOARD
├── /super/outlets      Outlet CRUD
├── /super/items        Item CRUD
├── /super/staff        Staff role management
```

---

## 4. Shared Auth & Onboarding Pages

> Used by all 5 apps. Decide the auth redirect: after login the client should route by `user.role` (see `/api/login` response).

### 4.1 Setup First Super Admin — `/setup`

- **Access:** public, only reachable when `GET /api/setup/` returns `{ setupRequired: true }`. If a super admin already exists the API returns 409.
- **Purpose:** Bootstrap the platform — create the very first `super_admin` account.
- **API calls:**
  - `GET /api/setup/` → `{ success, message, data: { setupRequired } }`. If `409` → redirect to login.
  - `POST /api/setup/` body `{ email, name, password }` (password min 6) → `201` → auto-login and redirect to Super Admin dashboard.
- **Form fields:**
  - `email` — text, must be a valid email.
  - `name` — text, min 2 chars.
  - `password` — password, min 6 chars (+ confirm field).
- **UI/actions:** centered card with logo, submit button, loading state, error banner (409 "Super admin already exists", 429 rate limit).
- **States:** checking (loading), ready (show form), redirect (already set up).

### 4.2 Login — `/login`

- **Access:** public.
- **Purpose:** Authenticate any role. Route to the right app afterward.
- **API calls:**
  - `POST /api/login` body `{ email, password }` → `{ success, message, data: { name, email, role, worker_station } }`. Sets cookies. Route by `role`.
  - Social login → Better Auth: redirect to `/api/auth/sign-in/{google|github|twitter}`.
  - `GET /api/refresh` + `GET /api/me` on app boot to restore session.
- **Form fields:** `email`, `password`. Errors: 400 missing fields, 401 invalid credentials.
- **UI/actions:** email+password form, "Sign in with Google" button, links to register + forgot password. Keep the JWT-cookie + Better Auth paths separate (don't mix session types).

### 4.3 Register (3 steps) — `/register`, `/register/verify`, `/register/complete`

- **Access:** public. Flow is guarded by the `temp_jwt` cookie + `requireStep` middleware.
- **Step 1** `POST /api/register` body `{ email }` → 201, sets `temp_jwt` (step 1). Validate email + rate limit (10).
- **Step 2** `POST /api/verify` body `{ token }` (6 digits) OR `?token=` hash (email link). Requires step 1 cookie. → 201.
- **Step 3** `POST /api/complete-register` body `{ email, name, password, phone?, role? }` → 201 → auto-login (sets access/refresh) → redirect to app.
- **Pages:**
  - `/register` — one email field, "Continue".
  - `/register/verify` — 6-digit OTP input, countdown + "Resend" (calls `POST /api/resend-otp` `{email}`), plus the email-link path (deep link with `?token=`).
  - `/register/complete` — name, phone (optional), password + confirm. Default role `customer`.
- **States:** step indicator (1→2→3), resend cooldown timer, invalid/expired token error.

### 4.4 Forgot / Reset Password — `/forgot-password`, `/reset-password`

- **Access:** public.
- **API calls:**
  - `POST /api/reset-password-request` `{ email }` → 200 (sets `temp_jwt` step 69).
  - `POST /api/reset-password-confirm` `{ email, password, token }` (token = 6-digit OTP) → 200 → redirect to login.
- **Pages:** `/forgot-password` (email input) → `/reset-password` (token + new password + confirm).
- **States:** sent confirmation, invalid/expired token error, resend cooldown if provided.

### 4.5 Profile & Account — `/profile`

- **Access:** any authenticated role.
- **API calls:**
  - `GET /api/me` → user object `{ id, email, name, phone, role, emailVerified, createdAt }`.
  - `PUT /api/me` body `{ name?, password? }` (note: phone is not updatable via API).
  - `POST /api/change-email-request` `{ email }` → sets `temp_jwt` step 67.
  - `PUT /api/change-email-confirm` `{ email, token }` (needs access token + step 67 cookie) → 200.
  - `GET /api/logout` → clear cookies.
- **UI:** read-only fields (email, phone, role) + editable name + change password (uses `PUT /api/me`) + change email flow (2-step OTP) + avatar upload (via `/api/signature/avatars` → Cloudinary, optional) + Logout button.
- **States:** user not found (404), token expired (401 → refresh → retry).

---

## 5. Customer App

> Role: `customer`. Nav bar: Home, Addresses, Pickup, My Order, Profile.

### 5.1 Home / Landing — `/`

- **Access:** public (registration not required).
- **Purpose:** Let user pick a location and see which outlets can serve them + base pricing.
- **API calls:**
  - `GET /api/outlets/` → all outlets `{ id, name, address, ... }`.
  - `GET /api/outlets/coverage?lat=&lng=` → outlets covering the coordinates `{ id, name, address, lat, lng, maxDistanceKm, pricePerKm, pricePerKg }`. 404/empty = "no outlets in your area".
- **UI:** hero + "Detect my location" button (Google Maps geolocation, already scaffolded under `apps/web/app/(dropdown-location)`), list of nearby outlets with distance, prices, CTA → `/pickup`.
- **States:** loading skeleton, "no coverage in your area" empty state.

### 5.2 Location / GPS — `/location`

- **Access:** public/customer.
- **Purpose:** Get accurate coordinates for coverage check. Existing scaffolding: `gps-api`, `location`, `pinpoint`, `radius-outlet` under `(dropdown-location)`.
- **API calls:** `GET /api/outlets/coverage?lat=&lng=` (live re-check as the marker moves).
- **UI:** map with draggable pin, "use current location", selected coordinates preview, "confirm location" → continues to pickup flow.

### 5.3 Address Book — `/addresses`

- **Access:** customer (auth).
- **API calls:**
  - `GET /api/addresses/` → `{ success, data: [{ id, label, address, lat, lng, isDefault }] }`.
  - `DELETE /api/addresses/:id` → confirm dialog.
  - `PUT /api/addresses/:id/set-default` → set default badge.
- **UI:** list of address cards (label, full address, default badge), Edit + Delete + Set-default actions, "Add new address" button. Auto-pick default address for checkout.
- **States:** empty state → prompt to add first address.

### 5.4 Add / Edit Address — `/addresses/new`, `/addresses/:id`

- **Access:** customer (auth).
- **API calls:**
  - Create: `POST /api/addresses/` body `{ label, address, lat, lng, isDefault? }`.
  - Update: `PUT /api/addresses/:id` body `{ label?, address?, lat?, lng?, isDefault? }`.
- **Form fields:** `label` (Home/Office/etc.), `address` (street text), map picker for `lat`/`lng`, `isDefault` toggle.
- **States:** 400 validation errors, 404 not found.

### 5.5 Request Pickup — `/pickup`

- **Access:** customer (auth).
- **Purpose:** The funnel entry: address → coverage → confirm outlet → create request. Only one active order allowed.
- **API calls:**
  - `GET /api/pickup-requests/coverage-check` → `{ hasAddress, withinCoverage, nearestOutlet, address }`. Guards the flow (no address → redirect to address creation; not covered → show message).
  - `GET /api/outlets/coverage?lat=&lng=` (optional fallback list of available outlets).
  - `POST /api/pickup-requests/` body `{ addressId, outletId }` → 201 `{ id, userId, addressId, outletId, status, createdAt }`.
- **UI:** step wizard — 1) pick address, 2) pick outlet, 3) review + submit. Success screen → link to `/order`.
- **States:** 400 missing ids, 409 already has active order.

### 5.6 Active Order Status & Tracking — `/order`

- **Access:** customer (auth).
- **API calls:**
  - `GET /api/orders/active` → `{ id, status, totalKilo, totalPrice, createdAt, items[], outlet }`.
  - `GET /api/pickup-requests/status` → latest pickup/order status.
- **UI:** status stepper mapped to `OrderStatus` (waiting_for_driver_pickup → out_for_pickup → in_transit_to_outlet → arrived_at_outlet → washing/ironing/packing_in_progress → waiting_for_payment → waiting_for_driver_deliver → out_for_delivery → delivered), order summary (items, kg, price, outlet), driver contact info if assigned. When `waiting_for_payment` → CTA to `/order/:id/payment`.
- **States:** 404 "no active order" → empty state.

### 5.7 Payment — `/order/:id/payment`

- **Access:** customer (auth).
- **API calls:**
  - `POST /api/orders/:orderId/payment/:paymentMethod` where `paymentMethod ∈ { payment_gateway, manual }` → set method.
  - **Gateway path:** `GET /api/orders/:orderId/payment-gateway` → `{ token, redirect_url }` → open Midtrans Snap (redirect or popup).
  - **Manual path:** upload image → get Cloudinary URL via `GET /api/signature/payment-proofs/:orderId/:unique` → `POST /api/orders/:orderId/payment` `{ urlProof }` → status `pending`.
  - **Cancel:** `POST /api/orders/:orderId/payment/cancel` (clears method / expires pending Snap).
- **UI:** two payment option cards (Gateway vs Manual Transfer), bank transfer instructions for manual, image upload with preview, "I've paid" button, cancel/change method link.
- **States:** 409 already paid / method already set / order not eligible; 403 not your order.

### 5.8 Completed Order — `/order/complete`

- **Access:** customer (auth).
- **API calls:** `GET /api/orders/complete` → most recent finished order.
- **UI:** completion summary (kg, total, items, completedAt), reorder CTA (starts new pickup), link to complaint if unhappy. Also used to trigger `POST /api/orders/:orderId/complete` ("Confirm received") from the delivery screen.

### 5.9 Submit Complaint — `/order/:id/complaint`

- **Access:** customer (auth).
- **API calls:** `POST /api/orders/:orderId/complaint` `{ complaintMessage, complaintImage }` (image via `/api/signature/complaints/`).
- **Form:** message textarea (required) + optional image upload. → sets order status `complaint_received`.
- **States:** 400 validation, success confirmation.

---

## 6. Driver App

> Role: `driver`. Context is resolved from the driver's `outlet_id`. If no shift today, `ensureWorkerOnShift` blocks job endpoints — show "not on shift" screen and link to schedule. Nav: Pickup Jobs, Delivery Jobs, History, Schedule.

### 6.1 Available Pickups — `/jobs/pickup`

- **Access:** driver.
- **API call:** `GET /api/pickup-requests/` → pending pickups in my outlet (with customer `user` + `address`).
- **UI:** list of request cards (customer name/phone, address label, created time). "Accept" per item → `POST /api/pickup-requests/:id/accept`. Card shows state transitions `waiting_for_driver_pickup → out_for_pickup`.
- **States:** empty list ("no pending pickups").

### 6.2 Accepted / Active Pickups — `/jobs/pickup/accepted`, `/jobs/pickup/:id`

- **Access:** driver.
- **API calls:**
  - `GET /api/pickup-requests/accepted` → my accepted pickups.
  - `PATCH /api/pickup-requests/:id/next` → advance status (no body required; server moves to next step: out_for_pickup → in_transit_to_outlet).
- **UI:** detail screen with customer + address + route to destination (map), big "Next step" button, status badge. When pickup completes, order becomes `arrived_at_outlet` at the outlet.
- **States:** not-found, already-completed.

### 6.3 Pickup History — `/jobs/pickup/history`

- **Access:** driver.
- **API call:** `GET /api/pickup-requests/already-picked-up` → my completed pickups (`status: done`, `completedAt`).
- **UI:** simple history list with completion timestamps.

### 6.4 Available Deliveries — `/jobs/delivery`

- **Access:** driver.
- **API call:** `GET /api/driver/delivery-requests/available` → pending deliveries with `order { totalKilo, totalPrice, address }`.
- **UI:** cards + "Accept" → `POST /api/driver/delivery-requests/:deliveryId/accept` (assigns driver, status `accepted` → `waiting_for_driver_deliver`).

### 6.5 Active Deliveries — `/jobs/delivery/active`, `/jobs/delivery/:id`

- **Access:** driver.
- **API calls:**
  - `GET /api/driver/delivery-requests/active` → in-progress deliveries.
  - `PATCH /api/driver/delivery-requests/:deliveryId/next` → advance (out_for_delivery → delivered).
- **UI:** delivery detail with destination address + map, "Mark delivered" button. After `delivered`, cron auto-marks `finished` after 24h.

### 6.6 Delivery History — `/jobs/delivery/history`

- **Access:** driver.
- **API call:** `GET /api/driver/delivery-requests/complete` → completed deliveries with `completedAt`.

### 6.7 My Schedule — `/schedule`

- **Access:** driver.
- **API call:** `GET /api/admin/schedule/:id` (id = my user id) — note this endpoint applies `ensureWorkerOnShift` to verify on-shift workers.
- **UI:** weekly view (mon–sun) of my shifts (start/end time, station n/a for drivers). Empty state → "no shift assigned, contact outlet admin".

---

## 7. Worker App

> Role: `worker`. Worker is tied to one `worker_station` (`washing`/`ironing`/`packing`) set in the user record, and must be on shift (`ensureWorkerOnShift`). Nav: Available, Active, History, Schedule.

### 7.1 Available Jobs — `/jobs/available`

- **Access:** worker (on shift).
- **API call:** `GET /api/workers/available` → orders at my station awaiting processing (status like `arrived_at_outlet` for washing, `washing_in_progress`→ironing, etc.), with items + total kilo.
- **UI:** job cards; "Process" → `/jobs/:id/process`. Workers can accept multiple jobs.

### 7.2 Process / Re-input — `/jobs/:id/process`

- **Access:** worker.
- **API calls:**
  - `POST /api/workers/:orderId/accept` → claim the job for myself.
  - `POST /api/workers/reinput/:orderId` body `{ items: [{ itemId, itemQuantity }] }` → count the actual laundry. If quantities match → no mismatch. If different → creates a `pending` mismatch log for the outlet admin.
- **Form:** per-item quantity steppers (pre-filled with expected quantity from the order), submit. Show "mismatch created — waiting for admin approval" info when a conflict exists.
- **UI:** item list with name + quantity input (1–100), total items counter, submit button.

### 7.3 Complete Job — from `/jobs/active`

- **Access:** worker.
- **API call:** `POST /api/workers/complete/:orderId` → marks my station done, order advances to next station (washing → ironing → packing → `waiting_for_payment`).
- **UI:** "Mark done" button on active job detail; confirmation dialog.

### 7.4 Active Jobs — `/jobs/active`

- **Access:** worker.
- **API call:** `GET /api/workers/active` → jobs I'm currently processing (status `washing_in_progress` / `ironing_in_progress` / `packing_in_progress`), with workerId + startedAt.
- **UI:** active job list, each with "Mark done" → `/jobs/active`.

### 7.5 History — `/jobs/history`

- **Access:** worker.
- **API call:** `GET /api/workers/complete` → my completed jobs (`washing_completed`, etc. — see actual statuses returned by controller) with timestamps.

### 7.6 My Schedule — `/schedule`

- **Access:** worker.
- **API call:** `GET /api/admin/schedule/:id` (my user id) → my weekly shifts with `station` shown.
- **UI:** weekly grid (mon–sun) with start/end and station label.

---

## 8. Outlet Admin Dashboard

> Role: `outlet_admin`. Everything is scoped to the admin's outlet via `resolveContext`. Layout: sidebar (Dashboard, Orders, Payments, Complaints, Mismatch, Walk-in, Schedule, Staff, Items).

### 8.1 Dashboard — `/admin`

- **API calls:**
  - `GET /api/admin/schedule/summary-dashboard` → `{ totalWorkers, stations: { washing: {mon: n,...}, ironing: {...}, packing: {...} } }`.
  - Optionally `GET /api/admin/orders/` for counts.
- **UI:** stat cards (total workers, station coverage per day), quick links to schedule + orders.

### 8.2 Orders — `/admin/orders`

- **API call:** `GET /api/admin/orders/` → all orders in my outlet with `user { name, email }`, source (`customer_app`/`walk_in`), status, totals.
- **UI:** filterable table (by status, source), row click → `/admin/orders/:id`.

### 8.3 Order Detail / Edit — `/admin/orders/:id`

- **API call:** `PATCH /api/admin/orders/:orderId` body `{ totalWeights, items: [{ id?, name?, quantity }] }` (item: either existing `id` or a new `name`; server auto-creates). Recalculates pricing.
- **UI:** edit total kg + per-item quantity; add item by searching existing items (via `GET /api/admin/items/search?name=`) or typing a new name; price recalculation preview; save.

### 8.4 Payment Proofs — `/admin/payments`

- **API calls:**
  - `GET /api/admin/orders/payment-proof/` → pending proofs with order + user.
  - `POST /api/admin/orders/payment-proof/:id/:action` where `action ∈ { approved, rejected }` → approving also creates the delivery request automatically for `customer_app` orders.
- **UI:** gallery of proof images with customer + amount; Approve / Reject buttons per item; refresh after action.

### 8.5 Complaints — `/admin/complaints`

- **API calls:**
  - `GET /api/admin/orders/complaints` → pending complaints with order + user.
  - `POST /api/admin/orders/complaints/:complaintId/:status` where `status ∈ { resolved, rejected }` body `{ adminResponse }`.
- **UI:** complaint cards (message, image, order), textarea for response, Resolve / Reject buttons.

### 8.6 Mismatches — `/admin/mismatch`

- **API calls:**
  - `GET /api/admin/mismatch/?stationName=` (optional filter) → list of `{ orderId, stationName, items[{itemId,itemName,expectedQty,actualQty,difference}], reportedAt, workerId }`.
- **UI:** filter chips by station, list rows → click to detail.

### 8.7 Mismatch Detail — `/admin/mismatch/:orderId/:station`

- **API calls:**
  - `GET /api/admin/mismatch/:orderId/:stationName` → detail incl. worker + per-item status.
  - `PUT /api/admin/mismatch/:orderId/:stationName` body `{ finalQuantities: [{ itemId, latestQuantity }], itemDecisions: [{ itemId, status (approved|rejected), adminNote? }] }`.
- **UI:** table with expected vs re-input vs difference, per-item Approve/Reject + note, final quantity input, Save.

### 8.8 Walk-in Customers — `/admin/walk-in`, `/admin/walk-in/new`, `/admin/walk-in/:id`

- **API calls:**
  - `GET /api/admin/walk-in-customer/?keyword=` → search by name/phone (debounced).
  - `POST /api/admin/walk-in-customer/` `{ name, phone }` (Indonesian phone regex `^(?:\+62|62|0)8[1-9][0-9]{6,11}$`).
  - `PATCH /api/admin/walk-in-customer/:id` `{ name?, phone? }` (at least one).
  - `DELETE /api/admin/walk-in-customer/:id`.
- **UI:** search box + results list, create/edit modal with name+phone validation, delete confirm. From a customer row → "Create order" → `/admin/orders/manual/:walkinId`.

### 8.9 Manual Order — `/admin/orders/manual/:walkinId`

- **API call:** `POST /api/admin/walk-in-customer/orders/:id` body:
  ```json
  {
    "pickup_fee": 0, "delivery_fee": 0, "laundry_price": 0, "total_amount": 0,
    "total_kilo": 5, "status": "arrived_at_outlet", "paid": true, "source": "walk_in",
    "items": [{ "id": "uuid", "quantity": 2 }]
  }
  ```
  Fees/status/source are locked (server rejects anything else). Item can be existing `id` or new `name`.
- **UI:** form with total kg, item lines (search existing or type new), paid toggle, submit.

### 8.10 Schedule Management — `/admin/schedule`

- **API calls:**
  - `GET /api/admin/schedule/?role=&station=&name=` (name = `asc`/`desc` sort) → schedule rows + dashboard counts (total worker, total driver, total schedule, on duty today).
  - `GET /api/admin/schedule/no-shift-workers?keyword=&role=` → addable workers (debounced search, role filter).
  - `POST /api/admin/schedule/:id` body `{ schedules: [{ day: "mon", start: "08:00", end: "16:00" }] }` (day ∈ mon–sun; server validates overlap). Replaces the weekly set.
  - `GET /api/admin/schedule/summary-dashboard` → coverage grid.
- **UI:** table of workers × week, pick worker (search) → schedule editor with day/time rows (existing scaffold: `apps/web/app/(schedule)/`), add-day button, remove row, save. Overlap → 400 error message.
- **States:** loading, empty (no-shift workers list), validation errors.

### 8.11 Staff Management — `/admin/staff`

- **API calls:**
  - `GET /api/admin/users` → all users with role + outlet.
  - `POST /api/admin/register` `{ email, role, outlet_id }` (outlet required for driver/outlet_admin) → sends verification email, user must verify.
  - `PATCH /api/admin/users` `{ userId, role }` → change role.
  - `DELETE /api/admin/users/:userId` → remove user.
- **UI:** staff table (email, role, outlet), "Add staff" modal (email + role + outlet picker), role dropdown per row, remove confirm.

### 8.12 Items — `/admin/items`

- **API calls:**
  - `GET /api/admin/items/` → all items.
  - `GET /api/admin/items/search?name=` → debounced search (used in order forms too).
- **UI:** simple list/search. (CRUD buttons shown for super_admin only — see §9.2.)

---

## 9. Super Admin Dashboard

> Role: `super_admin`. Everything in the Outlet Admin dashboard plus the system-level CRUD below. Layout: sidebar (Outlets, Items, Staff) + reuse admin pages.

### 9.1 Outlets CRUD — `/super/outlets`

- **API calls:**
  - `POST /api/admin/outlets/` body `{ name, address, lat, lng, max_distance_km, price_per_km, price_per_kg }`.
  - `PUT /api/admin/outlets/:id` — any subset of the same fields.
  - `DELETE /api/admin/outlets/:id`.
  - (list via public `GET /api/outlets/`).
- **UI:** outlet table, create/edit form (name, address, map picker, coverage km, price/km, price/kg), delete confirm.

### 9.2 Items CRUD — `/super/items`

- **API calls:**
  - `GET /api/admin/items/:id` → one item.
  - `POST /api/admin/items/` `{ name }`.
  - `PUT /api/admin/items/:id` `{ name }`.
  - `DELETE /api/admin/items/:id`.
- **UI:** item list (from `GET /api/admin/items/`), inline add/edit name, delete confirm.

### 9.3 Staff & Roles — `/super/staff`

- **API calls:** same as §8.11 but super_admin can also promote users to `super_admin` / `outlet_admin`, and create outlets (see 9.1).
- **UI:** staff table with role management, add staff, remove.

---

## 10. Cross-cutting Notes

1. **Session restore:** every app should call `GET /api/refresh` → `GET /api/me` on mount; on 401 redirect to `/login`.
2. **Error shape:** `{ success: false, message: "..." }`; handle 400 (validation), 401 (unauth), 403 (wrong role), 404 (missing), 409 (conflict), 429 (rate limit).
3. **File uploads:** always 2-step — `GET /api/signature/:folder[/:params][/:unique]` → upload to Cloudinary with the signed params → send returned URL to the API. Folders: `avatars`, `payment-proofs`, `complaints`.
4. **Status strings:** use the exact `OrderStatus` enum values from §1.2 everywhere (they power all progress UIs).
5. **Known backend gaps** (from `feature.md`, plan UI accordingly): order detail-by-id history endpoint missing; marking walk-in orders `finished` by admin missing; pagination not applied to all list endpoints; some list endpoints lack filters.
