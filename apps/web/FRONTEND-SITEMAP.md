# I-Wash-Noda — Frontend Sitemap

> Page-by-page build reference for the **I-Wash-Noda laundry service web app** (`apps/web`). Covers all 49 pages across 6 role groups with navigation, UI sections, form fields, component references, and states. For full API endpoint specs, request/response shapes, and enum values, see `SITEMAP.md` (root).

---

## 1. Overview

| Item | Value |
| --- | --- |
| Total pages | 49 |
| Framework | Next.js (App Router) |
| Web app URL | `http://localhost:3001` |
| API base URL | `http://localhost:3000/api` |
| Auth method | HTTP-only cookies: `access_token` (30 min) + `refresh_token` (7 days). All authenticated requests send `credentials: "include"`. |
| UI library | shadcn/ui + Tailwind CSS v4 |
| Form library | Tanstack Form + Zod validation |
| State (server) | React Query (Tanstack Query) |
| Toast notifications | Sonner (top-center, rich colors) |
| Maps | `@react-google-maps/api` — Google Maps via API key |
| File uploads | Cloudinary (2-step: signed URL → upload → send `secure_url` to API) |
| Language | Indonesian (`lang="id"`) |

### 1.1 Role Breakdown

| Role | Description | Pages | Shell component | Layout style |
| --- | --- | --- | --- | --- |
| (none) | Public + auth pages used by all roles | 8 | `AuthShell` | Centered card on teal gradient |
| `customer` | Regular end user | 10 | `CustomerShell` | Bottom tab bar (mobile) |
| `driver` | Pickup & delivery driver | 9 | `DriverShell` | Bottom tab bar (mobile) |
| `worker` | Station processor (washing/ironing/packing) | 5 | `WorkerShell` | Custom header with inline nav |
| `outlet_admin` | Manages one outlet | 14 | `AdminShell` | Sidebar (desktop) / horizontal scroll (mobile) |
| `super_admin` | System-wide admin | 3 | `SuperShell` | Fixed sidebar (desktop) / top bar (mobile) |

### 1.2 Navigation Map

#### Customer — bottom tab bar (`CustomerShell`)

| Tab | Route | Icon reference |
| --- | --- | --- |
| Beranda | `/` | Home |
| Alamat | `/addresses` | MapPin |
| Jemput | `/pickup` | Truck |
| Pesanan | `/order` | Package |
| Profil | `/profile` | User |

#### Driver — bottom tab bar (`DriverShell`)

| Tab | Route | Icon reference |
| --- | --- | --- |
| Jemput | `/jobs/pickup` | Package |
| Antar | `/jobs/delivery` | Truck |
| Jadwal | `/schedule` | Calendar |

#### Worker — custom header nav (`WorkerShell`)

| Link | Route |
| --- | --- |
| Tersedia | `/jobs/available` |
| Aktif | `/jobs/active` |
| Riwayat | `/jobs/history` |

> Schedule accessible via header icon or direct route `/schedule`.

#### Outlet Admin — sidebar (`AdminShell`)

| Link | Route |
| --- | --- |
| Dashboard | `/admin` |
| Pesanan | `/admin/orders` |
| Pembayaran | `/admin/payments` |
| Keluhan | `/admin/complaints` |
| Mismatch | `/admin/mismatch` |
| Walk-in | `/admin/walk-in` |
| Jadwal | `/admin/schedule` |
| Staf | `/admin/staff` |
| Item | `/admin/items` |

#### Super Admin — sidebar (`SuperShell`)

| Link | Route |
| --- | --- |
| Outlet | `/super/outlets` |
| Item | `/super/items` |
| Staf | `/super/staff` |

> Super Admin also has access to all Outlet Admin pages (§6).

---

## 2. Sitemap Tree

```
SHARED AUTH & ONBOARDING
├── /setup                         Create first super admin
├── /login                         Email/password + social login
├── /register                      Step 1: email
├── /register/verify               Step 2: OTP
├── /register/complete             Step 3: profile
├── /register/telegram-email       Telegram OAuth email collection
├── /forgot-password               Reset request
├── /reset-password                Reset confirm (OTP)
├── /profile                       Profile, change email, logout

CUSTOMER APP
├── /                              Home / outlet map / coverage
├── /location                      GPS / pinpoint location picker
├── /addresses                     Address book
├── /addresses/new                 Add address
├── /addresses/[id]                Edit address
├── /pickup                        Request pickup (step wizard)
├── /order                         Active order status & tracking
├── /order/[id]/payment            Payment (gateway / manual proof)
├── /order/[id]/complaint          Submit complaint
├── /order/complete                Completed order summary

DRIVER APP
├── /jobs/pickup                   Available pickups
├── /jobs/pickup/[id]              Pickup detail → accept → advance status
├── /jobs/pickup/accepted          My accepted pickups
├── /jobs/pickup/history           Completed pickups
├── /jobs/delivery                 Available deliveries
├── /jobs/delivery/[id]            Delivery detail → accept → advance status
├── /jobs/delivery/active          Active deliveries
├── /jobs/delivery/history         Completed deliveries
├── /schedule                      My shift schedule

WORKER APP
├── /jobs/available                Available jobs at my station
├── /jobs/active                   My in-progress jobs
├── /jobs/[id]/process             Re-input quantities + accept
├── /jobs/history                  My completed jobs
├── /schedule                      My shift schedule

OUTLET ADMIN DASHBOARD
├── /admin                         Dashboard (stats)
├── /admin/orders                  All orders
├── /admin/orders/[id]             Order detail / edit items
├── /admin/orders/manual/[walkinId] Create manual order for walk-in
├── /admin/payments                Payment proofs review
├── /admin/complaints              Complaints review
├── /admin/mismatch                Mismatch list
├── /admin/mismatch/[orderId]/[station] Mismatch detail
├── /admin/walk-in                 Walk-in customers (list + search + CRUD)
├── /admin/walk-in/new             Create walk-in customer
├── /admin/schedule                Schedule management
├── /admin/schedule/summary        Station coverage grid
├── /admin/staff                   Staff management
├── /admin/items                   Items list / search

SUPER ADMIN DASHBOARD
├── /super/outlets                 Outlet CRUD
├── /super/items                   Item CRUD
├── /super/staff                   Staff & roles management
```

---

## 3. Shared Auth & Onboarding (8 pages)

> All pages use `AuthShell` — centered card layout with `BrandLogo` on top and teal gradient background. These pages are public or lightly authenticated and shared across all 5 roles.

### 3.1 Setup First Super Admin — `/setup`

| Item | Detail |
| --- | --- |
| **Route** | `app/setup/page.tsx` |
| **Access** | Public — only reachable when `GET /api/setup/` returns `{ setupRequired: true }`. If a super admin already exists the API returns 409 → redirect to `/login`. |
| **Purpose** | Bootstrap the platform — create the very first `super_admin` account. |

**UI sections:**

1. Centered card with `BrandLogo` + app name
2. Form: `email` (text), `name` (text, min 2), `password` (min 6) + confirm
3. Submit button with loading state
4. Error banner for 409 ("Super admin already exists") and 429 (rate limit)

**API calls:**

- `GET /api/setup/` → `{ setupRequired }`. If 409 → redirect to `/login`.
- `POST /api/setup/` body `{ email, name, password }` → 201 → auto-login → redirect to `/super/outlets`.

**States:** checking (loading), ready (show form), redirect (already set up).

**Components:** `BrandLogo`, `ErrorBanner`, shadcn `Card`.

---

### 3.2 Login — `/login`

| Item | Detail |
| --- | --- |
| **Route** | `app/login/page.tsx` |
| **Access** | Public |
| **Purpose** | Authenticate any role. After login, route to the correct app by `user.role`. |

**UI sections:**

1. `BrandLogo` + heading
2. Email + password form
3. "Sign in with Google" / GitHub / Twitter buttons (via Better Auth)
4. Link: "Create new account" → `/register`
5. Link: "Forgot password?" → `/forgot-password`
6. Error states: invalid credentials (401), missing fields (400)

**API calls:**

- `POST /api/login` body `{ email, password }` → sets cookies, returns `{ name, email, role, worker_station }`.
- Social: redirect to `/api/auth/sign-in/{google|github|twitter}`.
- Session restore on app boot: `GET /api/refresh` + `GET /api/me`.

**Post-login redirect map (from `session-store.ts`):**

| Role | Redirect to |
| --- | --- |
| `customer` | `/` |
| `driver` | `/jobs/pickup` |
| `worker` | `/jobs/available` |
| `outlet_admin` | `/admin` |
| `super_admin` | `/super/outlets` |

**Components:** `BrandLogo`, `ErrorBanner`, `SocialButtons` (`components/auth/social-buttons.tsx`).

---

### 3.3 Register Step 1 — `/register`

| Item | Detail |
| --- | --- |
| **Route** | `app/register/page.tsx` |
| **Access** | Public |
| **Purpose** | Collect email and send OTP for verification. |

**UI sections:**

1. Step indicator: **1** → 2 → 3 (`StepIndicator` component)
2. `BrandLogo` + heading
3. Email input field
4. "Continue" submit button with loading state
5. Error: invalid email, rate limit (429)

**API calls:**

- `POST /api/register` body `{ email }` → 201, sets `temp_jwt` cookie (step 1).

**Components:** `StepIndicator`, `BrandLogo`, `ErrorBanner`, shadcn `Input`, shadcn `Card`.

---

### 3.4 Register Step 2 — `/register/verify`

| Item | Detail |
| --- | --- |
| **Route** | `app/register/verify/page.tsx` |
| **Access** | Requires `temp_jwt` from step 1 (`requireStep` middleware) |
| **Purpose** | Verify the OTP sent to the user's email. |

**UI sections:**

1. Step indicator: 1 → **2** → 3
2. 6-digit OTP input (`OtpInput` component)
3. Resend link + countdown cooldown timer → calls `POST /api/resend-otp` `{ email }`
4. Invalid / expired token error banner

**API calls:**

- `POST /api/verify` body `{ token }` (6 digits) or query `?token=` (email link deep path) → 201, advances `temp_jwt` to step 2.

**Components:** `StepIndicator`, `OtpInput` (`components/shared/OtpInput.tsx`), `ErrorBanner`.

---

### 3.5 Register Step 3 — `/register/complete`

| Item | Detail |
| --- | --- |
| **Route** | `app/register/complete/page.tsx` |
| **Access** | Requires `temp_jwt` from step 2 |
| **Purpose** | Collect profile details and complete registration. |

**UI sections:**

1. Step indicator: 1 → 2 → **3**
2. Form fields: `name` (text, min 2), `phone` (optional, Indonesian format), `password` (min 6) + confirm
3. Submit button → auto-login → redirect to app by role (default `customer`)

**API calls:**

- `POST /api/complete-register` body `{ email, name, password, phone?, role? }` → 201 → sets `access_token` + `refresh_token` cookies.

**Components:** `StepIndicator`, `BrandLogo`, `form-field` (`FieldInput` + `FieldError`), shadcn `Card`.

---

### 3.6 Register via Telegram — `/register/telegram-email`

| Item | Detail |
| --- | --- |
| **Route** | `app/register/telegram-email/page.tsx` |
| **Access** | Public (reachable after Telegram OAuth) |
| **Purpose** | Collect email for users who signed up via Telegram and don't have an email yet. |

**UI sections:**

1. Email input form
2. Submit → links the Telegram account to the email
3. Redirect to profile or login

**Components:** `BrandLogo`, shadcn `Input`, `ErrorBanner`.

---

### 3.7 Forgot Password — `/forgot-password`

| Item | Detail |
| --- | --- |
| **Route** | `app/forgot-password/page.tsx` |
| **Access** | Public |
| **Purpose** | Send a password reset OTP to the user's email. |

**UI sections:**

1. Email input field
2. Submit → "Check your email" confirmation message
3. Link back to login

**API calls:**

- `POST /api/reset-password-request` body `{ email }` → 200, sets `temp_jwt` (step 69).

**States:** loading, sent confirmation, error (unknown email, rate limit).

**Components:** `BrandLogo`, `ErrorBanner`, shadcn `Card`.

---

### 3.8 Reset Password — `/reset-password`

| Item | Detail |
| --- | --- |
| **Route** | `app/reset-password/page.tsx` |
| **Access** | Requires `temp_jwt` from forgot-password request |
| **Purpose** | Confirm OTP and set a new password. |

**UI sections:**

1. 6-digit OTP input (`OtpInput`)
2. New password field (min 6) + confirm
3. Submit → redirect to `/login`
4. Invalid / expired token error

**API calls:**

- `POST /api/reset-password-confirm` body `{ email, password, token }` → 200 → redirect to login.

**Components:** `OtpInput`, `ErrorBanner`, shadcn `Card`.

---

### 3.9 Profile & Account — `/profile`

| Item | Detail |
| --- | --- |
| **Route** | `app/profile/page.tsx` |
| **Access** | Any authenticated role |
| **Purpose** | View and manage account details, change email/password, upload avatar, logout. |

**UI sections:**

1. Avatar display + upload button (2-step Cloudinary upload via `GET /api/signature/avatars/:userId/:unique`)
2. Read-only fields: email, phone, role, member since
3. Editable field: name
4. Change password section: current password + new password + confirm → `PUT /api/me`
5. Change email flow: new email input → `POST /api/change-email-request` → OTP confirm → `PUT /api/change-email-confirm`
6. Active sessions display (not yet implemented)
7. Logout button → `GET /api/logout` → clear cookies → redirect to `/login`

**API calls:**

- `GET /api/me` → user object `{ id, email, name, phone, role, emailVerified, createdAt }`.
- `PUT /api/me` body `{ name?, password? }` — note: phone is not updatable via this endpoint.
- `POST /api/change-email-request` body `{ email }` → sets `temp_jwt` step 67.
- `PUT /api/change-email-confirm` body `{ email, token }` → 200.
- `GET /api/logout` → clear cookies.

**States:** loading, saving, success toast, error (401 → refresh → retry).

**Components:** `ImageUpload` (`components/shared/ImageUpload.tsx`), `form-field`, shadcn `Avatar`, `Button`, `Separator`.

---

## 4. Customer App (10 pages)

> Role: `customer`. Shell: `CustomerShell` (bottom tab bar). Navigation: Beranda, Alamat, Jemput, Pesanan, Profil.

### 4.1 Home / Landing — `/`

| Item | Detail |
| --- | --- |
| **Route** | `app/page.tsx` |
| **Access** | Public (registration not required) |
| **Purpose** | Landing page — show outlets on a map, detect location, check coverage, drive users to the pickup flow. |

**UI sections:**

1. `NavBar` (logo, nav links) — included via `CustomerShell`
2. Hero section with headline + CTA
3. Interactive outlet map (`OutletMap` component) — shows all outlets with color-coded markers and coverage radius circles
4. "Detect my location" button → browser Geolocation API → re-centers map
5. Outlet list below map — cards showing name, address, distance, price/kg, price/km (`OutletCard` component)
6. "How it works" section (step-by-step illustrations)
7. CTA button → `/pickup`
8. Footer

**API calls:**

- `GET /api/outlets/` → all outlets `{ id, name, address, lat, lng, ... }`.
- `GET /api/outlets/coverage?lat=&lng=` → outlets covering coordinates `{ id, name, address, lat, lng, maxDistanceKm, pricePerKg, pricePerKm }`.

**States:** loading skeleton (skeleton cards + map placeholder), "no coverage in your area" empty state, geolocation permission denied.

**Components:** `OutletMap` (`components/customer/outlet-map.tsx`), `OutletCard` (`components/customer/outlet-card.tsx`), `EmptyState`, `Skeleton`.

---

### 4.2 Location / GPS — `/location`

| Item | Detail |
| --- | --- |
| **Route** | `app/location/page.tsx` |
| **Access** | Public / customer |
| **Purpose** | Get accurate coordinates for coverage check via a draggable map pin. Existing scaffolding: `apps/web/app/(dropdown-location)/`. |

**UI sections:**

1. Full-screen map with a centered fixed pin (`LocationPicker` component)
2. "Use current location" button → browser Geolocation API
3. Selected coordinates preview (lat/lng display)
4. Live coverage re-check as marker moves → `GET /api/outlets/coverage?lat=&lng=`
5. "Confirm location" button → continues to pickup flow or saves to address

**API calls:**

- `GET /api/outlets/coverage?lat=&lng=` — live re-check on map idle.

**States:** loading (map loading), geolocation permission denied, no outlets found.

**Components:** `LocationPicker` (`components/customer/location-picker.tsx`), `MapView` (`components/shared/MapView.tsx`).

---

### 4.3 Address Book — `/addresses`

| Item | Detail |
| --- | --- |
| **Route** | `app/addresses/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Manage saved addresses — list, edit, delete, set default. |

**UI sections:**

1. Page heading + "Add new address" button
2. Address cards — each card shows: label (Home/Office/etc.), full address text, default badge
3. Per-card actions: Edit (→ `/addresses/:id`), Delete (confirm dialog), Set as default (`PUT /api/addresses/:id/set-default`)
4. Empty state → prompt to add first address

**API calls:**

- `GET /api/addresses/` → `{ data: [{ id, label, address, lat, lng, isDefault }] }`.
- `DELETE /api/addresses/:id` → confirm dialog first.
- `PUT /api/addresses/:id/set-default` → refresh list.

**States:** loading, empty (no addresses yet), error.

**Components:** `ConfirmDialog`, `EmptyState`, `ErrorBanner`, shadcn `Card`, `Button`.

---

### 4.4 Add / Edit Address — `/addresses/new`, `/addresses/[id]`

| Item | Detail |
| --- | --- |
| **Routes** | `app/addresses/new/page.tsx`, `app/addresses/[id]/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Create or edit an address with map-based location picker. |

**UI sections:**

1. Form fields: `label` (select: Home, Office, Other), `address` (textarea — street address text)
2. Map picker for `lat`/`lng` — `LocationPicker` component (draggable pin)
3. "Use current location" button for auto-fill
4. `isDefault` toggle switch
5. Save button with loading state
6. Validation errors (Zod — Tanstack Form integration)

**API calls:**

- Create: `POST /api/addresses/` body `{ label, address, lat, lng, isDefault? }`.
- Update: `PUT /api/addresses/:id` body `{ label?, address?, lat?, lng?, isDefault? }`.

**States:** loading (fetching existing address on edit), validation errors (400), not found (404), success redirect to `/addresses`.

**Components:** `AddressForm` (`components/customer/address-form.tsx`), `LocationPicker`, `form-field`, shadcn `Switch`, `Button`.

---

### 4.5 Request Pickup — `/pickup`

| Item | Detail |
| --- | --- |
| **Route** | `app/pickup/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | The funnel entry — select address → select outlet → review & submit pickup request. Only one active order allowed at a time. |

**UI sections:**

1. **Step 1 — Select address:** list of saved addresses from `GET /api/addresses/`, default pre-selected. No addresses → redirect to `/addresses/new`.
2. **Step 2 — Select outlet:** list of outlets within coverage (`GET /api/outlets/coverage?lat=&lng=`) shown as `OutletCard` list. Includes map view showing nearby outlets.
3. **Step 3 — Review & submit:** summary showing selected address, selected outlet, estimated pickup/delivery fee note ("price will be confirmed after items are counted at outlet"). Submit button.
4. Success screen → link to `/order`.

**Guards:**

- No addresses → redirect to address creation.
- Address not within coverage → show "no coverage" message.
- Already has active order → show locked screen with link to `/order`.

**API calls:**

- `GET /api/pickup-requests/coverage-check` → `{ hasAddress, withinCoverage, nearestOutlet, address }`.
- `GET /api/outlets/coverage?lat=&lng=` — list of nearby outlets.
- `POST /api/pickup-requests/` body `{ addressId, outletId }` → 201 `{ id, status, createdAt }`.

**States:** loading (coverage check), no addresses, not covered, already has active order (409), success.

**Components:** `StepIndicator`, `OutletCard`, `MapView`, `EmptyState`, `ErrorBanner`.

---

### 4.6 Active Order Status & Tracking — `/order`

| Item | Detail |
| --- | --- |
| **Route** | `app/order/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Show real-time order status with a visual stepper, order details, and contextual actions. |

**UI sections:**

1. **Status stepper** — vertical progress indicator mapping to `OrderStatus` flow:
   - `waiting_for_driver_pickup` → `out_for_pickup` → `in_transit_to_outlet` → `arrived_at_outlet`
   - → `washing_in_progress` → `ironing_in_progress` → `packing_in_progress`
   - → `waiting_for_payment` → `waiting_for_driver_deliver` → `out_for_delivery` → `delivered`
   - → `finished`
   - (any status can also be `complaint_received` or `cancelled`)
2. **Order summary card** — items list, total kg, total price, outlet name/address
3. **Driver info** — driver name + phone (when assigned and in transit)
4. **Action buttons:**
   - When `waiting_for_payment` → "Bayar sekarang" (Pay now) CTA → `/order/:id/payment`
   - When `delivered` → "Selesaikan pesanan" (Complete order) button → `POST /api/orders/:orderId/complete`
   - When `delivered` → "Ajukan komplain" (Submit complaint) link → `/order/:id/complaint`
   - When `waiting_for_driver_pickup` and not yet accepted → "Batalkan" (Cancel) option
5. **Paid/unpaid badge** — shows payment status
6. **Empty state** — "No active order" + "Buat pesanan baru" (Make new order) CTA → `/pickup`

**API calls:**

- `GET /api/orders/active` → `{ id, status, totalKilo, totalPrice, items[], outlet }`.
- `GET /api/pickup-requests/status` → latest pickup/order status.
- `POST /api/orders/:orderId/complete` → marks order `finished`.

**States:** loading, empty (no active order), error. Status-dependent UI (stepper position drives which actions are visible).

**Components:** `StatusStepper` (`components/shared/StatusStepper.tsx`), `EmptyState`, `ErrorBanner`, shadcn `Card`, `Badge`, `Button`, `AlertDialog`.

---

### 4.7 Payment — `/order/:id/payment`

| Item | Detail |
| --- | --- |
| **Route** | `app/order/[id]/payment/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Choose payment method and complete payment for a processed order. |

**UI sections:**

1. **Payment method selector** — two cards:
   - **Gateway (Midtrans)** — credit card, bank transfer, e-wallet via Midtrans Snap
   - **Manual Transfer** — bank transfer with manual proof upload
2. **Gateway path:**
   - Click → `POST /api/orders/:orderId/payment/payment_gateway` → `GET /api/orders/:orderId/payment-gateway` → opens Midtrans Snap (popup or redirect to `redirect_url`)
3. **Manual Transfer path:**
   - Bank transfer instructions display (account number, amount)
   - Image upload field — upload proof via `GET /api/signature/payment-proofs/:orderId/:unique` → Cloudinary → send URL
   - "Saya sudah bayar" (I've paid) button → `POST /api/orders/:orderId/payment` body `{ urlProof }`
4. **Cancel / change method** — `POST /api/orders/:orderId/payment/cancel` (clears method / expires pending Snap)
5. **Order summary** — total amount, order ID

**API calls:**

- `POST /api/orders/:orderId/payment/:paymentMethod` where `paymentMethod ∈ { payment_gateway, manual }`.
- Gateway: `GET /api/orders/:orderId/payment-gateway` → `{ token, redirect_url }`.
- Manual: `POST /api/orders/:orderId/payment` body `{ urlProof }`.
- Cancel: `POST /api/orders/:orderId/payment/cancel`.

**States:** method selected, gateway loading (Midtrans popup), manual pending (waiting for admin approval), already paid error (409), not your order (403).

**Components:** `ImageUpload`, shadcn `Card`, `Button`, `RadioGroup`, `Badge`, `Skeleton`.

---

### 4.8 Completed Order — `/order/complete`

| Item | Detail |
| --- | --- |
| **Route** | `app/order/complete/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Display the most recent completed order summary. |

**UI sections:**

1. Success icon + "Pesanan selesai" (Order complete) heading
2. Completion summary — total kg, total price, items list, completed timestamp
3. "Buat pesanan baru" (Make new order) CTA → `/pickup`
4. "Ajukan komplain" (Submit complaint) link → `/order/:id/complaint`
5. Empty state — no completed orders yet

**API calls:**

- `GET /api/orders/complete` → most recent finished order.

**States:** loading, empty (no completed orders), success.

**Components:** `EmptyState`, shadcn `Card`, `Button`.

---

### 4.9 Submit Complaint — `/order/:id/complaint`

| Item | Detail |
| --- | --- |
| **Route** | `app/order/[id]/complaint/page.tsx` |
| **Access** | customer (auth required) |
| **Purpose** | Submit a complaint about a delivered order with optional image evidence. |

**UI sections:**

1. Page heading — "Ajukan Komplain"
2. Order reference display (order ID, date)
3. Message textarea (required) — describe the complaint
4. Optional image upload with preview (`ImageUpload` → Cloudinary via `GET /api/signature/complaints/:orderId/:unique`)
5. Submit button → sets order status to `complaint_received`
6. Success confirmation → redirect to `/order`

**API calls:**

- `POST /api/orders/:orderId/complaint` body `{ complaintMessage, complaintImage? }`.

**States:** loading, validation error (empty message), success, already complained (409).

**Components:** `ImageUpload`, `ErrorBanner`, shadcn `Textarea`, `Button`.

---

### 4.10 Order History — `/order/history`

| Item | Detail |
| --- | --- |
| **Route** | (planned — not yet in `app/` directory) |
| **Access** | customer (auth required) |
| **Purpose** | List all past orders with status, date, and total. |

**UI sections:**

1. List of order cards — each shows: order ID, date, status badge, total price, item count
2. Row click → order detail view
3. History metrics (total orders, total spent)
4. Empty state — no order history yet

**API calls:** (not yet implemented in backend — see `SITEMAP.md` §10 known gaps)

**States:** loading, empty, error.

---

## 5. Driver App (9 pages)

> Role: `driver`. Shell: `DriverShell` (bottom tab bar). Context is resolved from the driver's `outlet_id`. If no shift today, `ensureWorkerOnShift` blocks job endpoints — show "not on shift" screen and link to `/schedule`. Navigation: Jemput, Antar, Jadwal.

### 5.1 Available Pickups — `/jobs/pickup`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/pickup/page.tsx` |
| **Access** | driver (must be on shift) |
| **Purpose** | Show pending pickup requests in the driver's outlet for acceptance. |

**UI sections:**

1. Page heading — "Pickup Tersedia"
2. List of request cards — each shows: customer name, phone, address label, created time
3. "Terima" (Accept) button per card → `POST /api/pickup-requests/:id/accept`
4. Card shows status transition: `waiting_for_driver_pickup` → `out_for_pickup`
5. Empty state — "Tidak ada pickup pending" (No pending pickups)

**API calls:**

- `GET /api/pickup-requests/` → pending pickups in my outlet with customer `user` + `address`.

**States:** loading skeleton, empty, accepted successfully (removes from list), error.

**Components:** `EmptyState`, `ErrorBanner`, shadcn `Card`, `Button`, `Skeleton`.

---

### 5.2 Pickup Detail — `/jobs/pickup/:id`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/pickup/[id]/page.tsx` |
| **Access** | driver (must be on shift) |
| **Purpose** | View pickup detail, see destination on map, advance status step-by-step. |

**UI sections:**

1. Customer info — name, phone, address
2. Map showing route to destination (`MapView` component) — click to open in Google Maps app
3. Status badge (current step in pickup flow)
4. Big "Langkah berikutnya" (Next step) button → `PATCH /api/pickup-requests/:id/next`
   - Status transitions: `out_for_pickup` → `in_transit_to_outlet` → completes (order becomes `arrived_at_outlet`)
5. "Selesai" (Done) state when pickup is completed

**API calls:**

- `GET /api/pickup-requests/accepted` → my accepted pickups (to resolve current).
- `PATCH /api/pickup-requests/:id/next` → advance status (no body required).

**States:** loading, not found, already completed, status advancing (loading on button).

**Components:** `MapView`, shadcn `Card`, `Button`, `Badge`.

---

### 5.3 Accepted Pickups — `/jobs/pickup/accepted`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/pickup/accepted/page.tsx` |
| **Access** | driver |
| **Purpose** | List of pickups the driver has accepted and is working on. |

**UI sections:**

1. List of accepted pickup cards with status badge + customer info
2. Row click → detail at `/jobs/pickup/:id`
3. Empty state — "Tidak ada pickup aktif"

**API calls:**

- `GET /api/pickup-requests/accepted` → my accepted pickups.

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`, `Badge`.

---

### 5.4 Pickup History — `/jobs/pickup/history`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/pickup/history/page.tsx` |
| **Access** | driver |
| **Purpose** | List of completed pickup jobs with timestamps. |

**UI sections:**

1. History list — each entry: customer name, address, completed timestamp
2. Scrollable list
3. Empty state — "Belum ada riwayat pickup"

**API calls:**

- `GET /api/pickup-requests/already-picked-up` → completed pickups (`status: done`, `completedAt`).

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`.

---

### 5.5 Available Deliveries — `/jobs/delivery`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/delivery/page.tsx` |
| **Access** | driver (must be on shift) |
| **Purpose** | Show pending delivery requests in the driver's outlet for acceptance. |

**UI sections:**

1. Page heading — "Pengiriman Tersedia"
2. List of delivery cards — each shows: order total kg, total price, destination address
3. "Terima" (Accept) button per card → `POST /api/driver/delivery-requests/:deliveryId/accept`
4. Empty state — "Tidak ada pengiriman pending"

**API calls:**

- `GET /api/driver/delivery-requests/available` → pending deliveries with `order { totalKilo, totalPrice, address }`.

**States:** loading skeleton, empty, accepted (removes from list), error.

**Components:** `EmptyState`, shadcn `Card`, `Button`, `Skeleton`.

---

### 5.6 Delivery Detail — `/jobs/delivery/:id`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/delivery/[id]/page.tsx` |
| **Access** | driver (must be on shift) |
| **Purpose** | View delivery detail, navigate to customer, mark as delivered. |

**UI sections:**

1. Customer info — name, phone, delivery address
2. Map with route to destination (`MapView`) — click to open in Google Maps app
3. Order summary — items, total kg, total price
4. Status badge
5. "Tandai selesai" (Mark delivered) button → `PATCH /api/driver/delivery-requests/:deliveryId/next`
   - Status transition: `out_for_delivery` → `delivered`
6. After `delivered`, cron auto-marks `finished` after 24h if customer doesn't confirm

**API calls:**

- `GET /api/driver/delivery-requests/active` → in-progress deliveries.
- `PATCH /api/driver/delivery-requests/:deliveryId/next` → advance status.

**States:** loading, not found, already delivered, confirming delivery (loading).

**Components:** `MapView`, shadcn `Card`, `Button`, `Badge`, `AlertDialog`.

---

### 5.7 Active Deliveries — `/jobs/delivery/active`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/delivery/active/page.tsx` |
| **Access** | driver |
| **Purpose** | List of deliveries the driver is currently performing. |

**UI sections:**

1. List of active delivery cards with status badge + destination
2. Row click → detail at `/jobs/delivery/:id`
3. Empty state — "Tidak ada pengiriman aktif"

**API calls:**

- `GET /api/driver/delivery-requests/active` → in-progress deliveries.

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`, `Badge`.

---

### 5.8 Delivery History — `/jobs/delivery/history`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/delivery/history/page.tsx` |
| **Access** | driver |
| **Purpose** | List of completed delivery jobs with timestamps. |

**UI sections:**

1. History list — each entry: destination address, completed timestamp
2. Scrollable list
3. Empty state — "Belum ada riwayat pengiriman"

**API calls:**

- `GET /api/driver/delivery-requests/complete` → completed deliveries with `completedAt`.

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`.

---

### 5.9 My Schedule — `/schedule`

| Item | Detail |
| --- | --- |
| **Route** | `app/schedule/page.tsx` |
| **Access** | driver |
| **Purpose** | View weekly shift schedule. |

**UI sections:**

1. Weekly view (Mon–Sun) — each day: shift start/end time
2. "Hari ini" (Today) highlight
3. Empty state — "Tidak ada jadwal, hubungi admin outlet" (No shift assigned, contact outlet admin)

**API calls:**

- `GET /api/admin/schedule/:id` (id = my user id).

**States:** loading, empty (no shift assigned), error.

**Components:** `EmptyState`, shadcn `Card`.

---

## 6. Worker App (5 pages)

> Role: `worker`. Shell: `WorkerShell` (custom header with inline horizontal nav). Worker is tied to one `worker_station` (`washing` / `ironing` / `packing`) set in the user record. Must be on shift (`ensureWorkerOnShift`). Navigation: Tersedia, Aktif, Riwayat (+ schedule via header icon).

### 6.1 Available Jobs — `/jobs/available`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/available/page.tsx` |
| **Access** | worker (must be on shift) |
| **Purpose** | Show orders waiting at the worker's station for processing. |

**UI sections:**

1. Page heading — "Pekerjaan Tersedia"
2. Station badge — shows which station I'm at (`washing` / `ironing` / `packing`)
3. List of job cards — each shows: order ID, items list, total kilo, created time
4. "Proses" (Process) button per card → `/jobs/:id/process`
5. Workers can accept multiple jobs simultaneously
6. Empty state — "Tidak ada pekerjaan di stasiun ini" (No jobs at this station)

**API calls:**

- `GET /api/workers/available` → orders at my station with items + total kilo.

**States:** loading skeleton, empty, error.

**Components:** `EmptyState`, shadcn `Card`, `Button`, `Badge`, `Skeleton`.

---

### 6.2 Process / Re-input — `/jobs/[id]/process`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/[id]/process/page.tsx` |
| **Access** | worker |
| **Purpose** | Claim a job, re-input item quantities (detects mismatch if counts differ from order), and process laundry at the current station. |

**UI sections:**

1. Order info header — order ID, customer name, station
2. Item list — per-item row: item name, expected quantity (from order), quantity stepper input (1–100)
3. Total items counter
4. "Kirim" (Submit) button → accepts job + submits re-input counts
5. **Mismatch notice** — if re-input quantities differ from expected: "Ketidakcocokan terdeteksi — menunggu persetujuan admin" (Mismatch detected — waiting for admin approval)
6. Validation errors

**API calls:**

- `POST /api/workers/:orderId/accept` → claim the job for myself.
- `POST /api/workers/reinput/:orderId` body `{ items: [{ itemId, itemQuantity }] }` → if quantities match → no mismatch; if different → creates `pending` mismatch for outlet admin.

**States:** loading (fetching order items), submitting, mismatch detected (info banner), success → redirect to `/jobs/active`, error.

**Components:** `ErrorBanner`, shadcn `Card`, `Input` (quantity stepper), `Button`.

---

### 6.3 Active Jobs — `/jobs/active`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/active/page.tsx` |
| **Access** | worker |
| **Purpose** | List of jobs the worker is currently processing. |

**UI sections:**

1. Page heading — "Pekerjaan Aktif"
2. List of active job cards — each shows: order ID, station, status (e.g. `washing_in_progress`), started time
3. "Tandai selesai" (Mark done) button per job → confirmation dialog → `POST /api/workers/complete/:orderId`
4. Completing advances the order to next station (washing → ironing → packing → `waiting_for_payment`)
5. Empty state — "Tidak ada pekerjaan aktif"

**API calls:**

- `GET /api/workers/active` → jobs I'm processing with `workerId` + `startedAt`.
- `POST /api/workers/complete/:orderId` → marks my station done, order advances.

**States:** loading, empty, completing (loading + confirmation), success, error.

**Components:** `EmptyState`, `ConfirmDialog`, shadcn `Card`, `Button`, `Badge`.

---

### 6.4 History — `/jobs/history`

| Item | Detail |
| --- | --- |
| **Route** | `app/jobs/history/page.tsx` |
| **Access** | worker |
| **Purpose** | List of completed jobs with timestamps. |

**UI sections:**

1. Page heading — "Riwayat Pekerjaan"
2. History list — each entry: order ID, station, completion timestamp
3. Scrollable list
4. Empty state — "Belum ada riwayat pekerjaan"

**API calls:**

- `GET /api/workers/complete` → my completed jobs with timestamps.

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`.

---

### 6.5 My Schedule — `/schedule`

| Item | Detail |
| --- | --- |
| **Route** | `app/schedule/page.tsx` |
| **Access** | worker |
| **Purpose** | View weekly shift schedule. |

**UI sections:**

1. Weekly grid (Mon–Sun) — each day: start/end time + station label (`washing`/`ironing`/`packing`)
2. "Hari ini" (Today) highlight
3. Empty state — "Tidak ada jadwal, hubungi admin outlet"

**API calls:**

- `GET /api/admin/schedule/:id` (my user id).

**States:** loading, empty, error.

**Components:** `EmptyState`, shadcn `Card`.

---

## 7. Outlet Admin Dashboard (14 pages)

> Role: `outlet_admin`. Shell: `AdminShell` (sidebar on desktop, horizontal scroll nav on mobile). Everything is scoped to the admin's outlet via `resolveContext`. Sidebar: Dashboard, Pesanan, Pembayaran, Keluhan, Mismatch, Walk-in, Jadwal, Staf, Item.

### 7.1 Dashboard — `/admin`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Overview dashboard with key stats and quick links. |

**UI sections:**

1. Stat cards — total workers, total drivers, total scheduled, on duty today
2. Station coverage grid — per-day coverage summary (washing / ironing / packing × Mon–Sun)
3. Quick links — to schedule management, orders, recent complaints
4. Loading skeletons

**API calls:**

- `GET /api/admin/schedule/summary-dashboard` → `{ totalWorkers, stations: { washing: { mon: n, ... }, ironing: {...}, packing: {...} } }`.
- `GET /api/admin/schedule/` → includes dashboard counts.

**States:** loading, error.

**Components:** shadcn `Card`, `Skeleton`.

---

### 7.2 Orders — `/admin/orders`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/orders/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | List all orders in the outlet with filtering. |

**UI sections:**

1. Page heading + filter controls — by status (dropdown), by source (`customer_app` / `walk_in`)
2. Orders table — columns: customer name, source, status (badge), total kg, total price, date
3. Row click → `/admin/orders/:id`
4. Loading skeleton
5. Empty state — "Belum ada pesanan"

**API calls:**

- `GET /api/admin/orders/` → all orders in my outlet with `user { name, email }`, source, status, totals.

**States:** loading, empty, error.

**Components:** `DataTable` (`components/shared/DataTable.tsx`), `EmptyState`, shadcn `Badge`, `Skeleton`.

---

### 7.3 Order Detail / Edit — `/admin/orders/[id]`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/orders/[id]/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | View order detail, edit items and total weight. |

**UI sections:**

1. Order info header — customer name, email, source, current status, order date
2. Editable total kg input field
3. Item lines table — each row: item name, quantity input (editable), remove button
4. "Tambah item" (Add item) — search existing items (`GET /api/admin/items/search?name=`) or type a new item name
5. Price recalculation preview — shows new total after edits
6. Save button → `PATCH /api/admin/orders/:orderId`
7. Status context — what the current status means in the flow

**API calls:**

- `PATCH /api/admin/orders/:orderId` body `{ totalWeights, items: [{ id?, name?, quantity }] }` — item can be existing `id` or new `name` (server auto-creates). Recalculates pricing.
- `GET /api/admin/items/search?name=` — debounced search for existing items.

**States:** loading (fetching order), saving, validation error (400), success toast, error.

**Components:** `form-field`, `ErrorBanner`, shadcn `Table`, `Input`, `Button`, `Badge`.

---

### 7.4 Payment Proofs — `/admin/payments`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/payments/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Review pending manual payment proofs submitted by customers. |

**UI sections:**

1. Page heading — "Bukti Pembayaran"
2. List of proof cards — each shows: customer name, order total, proof image preview, submission time
3. Per-card actions: "Setujui" (Approve) / "Tolak" (Reject) buttons
4. Approving a `customer_app` order automatically creates a delivery request
5. Refresh list after action
6. Empty state — "Tidak ada bukti pembayaran pending"

**API calls:**

- `GET /api/admin/orders/payment-proof/` → pending proofs with order + user.
- `POST /api/admin/orders/payment-proof/:id/:action` where `action ∈ { approved, rejected }`.

**States:** loading, empty, approving/rejecting (loading per card), success refresh, error.

**Components:** `EmptyState`, shadcn `Card`, `Button`, `Badge`, `Skeleton`.

---

### 7.5 Complaints — `/admin/complaints`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/complaints/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Review and resolve customer complaints. |

**UI sections:**

1. Page heading — "Keluhan"
2. List of complaint cards — each shows: customer name, complaint message, complaint image (if any), order reference, submission time
3. Response textarea per complaint
4. "Selesaikan" (Resolve) / "Tolak" (Reject) buttons per complaint
5. Empty state — "Tidak ada keluhan pending"

**API calls:**

- `GET /api/admin/orders/complaints` → pending complaints with order + user.
- `POST /api/admin/orders/complaints/:complaintId/:status` where `status ∈ { resolved, rejected }` body `{ adminResponse }`.

**States:** loading, empty, resolving/rejecting (loading), success refresh, error.

**Components:** `EmptyState`, shadcn `Card`, `Button`, `Textarea`, `Badge`.

---

### 7.6 Mismatches — `/admin/mismatch`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/mismatch/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | List all item quantity mismatches reported by workers. |

**UI sections:**

1. Page heading — "Mismatch"
2. Filter chips — by station name (`washing` / `ironing` / `packing`) — optional
3. List of mismatch rows — each shows: order ID, station name, per-item difference summary (item name, expected vs actual), reported time, worker ID
4. Row click → `/admin/mismatch/:orderId/:station`
5. Empty state — "Tidak ada mismatch"

**API calls:**

- `GET /api/admin/mismatch/?stationName=` (optional filter) → list of `{ orderId, stationName, items[{itemId, itemName, expectedQty, actualQty, difference}], reportedAt, workerId }`.

**States:** loading, empty, error.

**Components:** `DataTable`, `EmptyState`, shadcn `Badge`, `Skeleton`.

---

### 7.7 Mismatch Detail — `/admin/mismatch/[orderId]/[station]`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/mismatch/[orderId]/[station]/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Review a specific mismatch, approve/reject individual items, set final quantities. |

**UI sections:**

1. Header — order ID, station name, worker info, reported time
2. Items table — columns: item name, expected qty, re-input qty, difference
3. Per-item controls: Approve / Reject toggle + admin note input
4. Final quantity input per item
5. "Simpan" (Save) button → `PUT /api/admin/mismatch/:orderId/:stationName`
6. Validation — must decide on all items before saving

**API calls:**

- `GET /api/admin/mismatch/:orderId/:stationName` → detail with per-item status.
- `PUT /api/admin/mismatch/:orderId/:stationName` body `{ finalQuantities: [{ itemId, latestQuantity }], itemDecisions: [{ itemId, status (approved|rejected), adminNote? }] }`.

**States:** loading, saving, validation error (incomplete decisions), success redirect to `/admin/mismatch`, error.

**Components:** shadcn `Table`, `Input`, `Button`, `Badge`, `Textarea`.

---

### 7.8 Walk-in Customers — `/admin/walk-in`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/walk-in/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Manage walk-in customers — search, create, edit, delete, create manual order. |

**UI sections:**

1. Page heading + "Tambah Pelanggan" (Add customer) button → `/admin/walk-in/new`
2. Search box — debounced search by name or phone
3. Results list — each row: name, phone
4. Per-row actions: Edit (modal), Delete (confirm dialog), "Buat Pesanan" (Create order) → `/admin/orders/manual/:walkinId`
5. Create/edit modal — name + phone inputs with Indonesian phone validation (`^(?:\+62|62|0)8[1-9][0-9]{6,11}$`)
6. Empty state — "Belum ada pelanggan walk-in"

**API calls:**

- `GET /api/admin/walk-in-customer/?keyword=` → search by name/phone.
- `PATCH /api/admin/walk-in-customer/:id` body `{ name?, phone? }` (at least one).
- `DELETE /api/admin/walk-in-customer/:id` → confirm dialog first.

**States:** loading, search results empty, confirming delete, error.

**Components:** `ConfirmDialog`, `EmptyState`, shadcn `Dialog`, `Input`, `Button`.

---

### 7.9 Walk-in Create — `/admin/walk-in/new`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/walk-in/new/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Create a new walk-in customer record. |

**UI sections:**

1. Form fields: `name` (text), `phone` (text — Indonesian format)
2. Phone validation — regex: `^(?:\+62|62|0)8[1-9][0-9]{6,11}$`
3. Submit button → create customer → redirect to `/admin/walk-in`
4. Cancel link → back to list

**API calls:**

- `POST /api/admin/walk-in-customer/` body `{ name, phone }`.

**States:** loading (submitting), validation error, success redirect, error.

**Components:** `form-field`, shadcn `Card`, `Button`.

---

### 7.10 Manual Order — `/admin/orders/manual/[walkinId]`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/orders/manual/[walkinId]/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Create a manual order for a walk-in customer. |

**UI sections:**

1. Customer header — walk-in customer name + phone
2. Total kg input field
3. Item lines — search existing items (`GET /api/admin/items/search?name=`) or type new item name + quantity per line
4. "Tambah item" (Add item) button to add more lines
5. Paid toggle — mark as paid or unpaid
6. Fee summary — pickup fee, delivery fee, laundry price, total (locked by server, shown for reference)
7. Submit button → `POST /api/admin/walk-in-customer/orders/:id`

**API calls:**

- `POST /api/admin/walk-in-customer/orders/:id` body:
  ```json
  {
    "pickup_fee": 0, "delivery_fee": 0, "laundry_price": 0, "total_amount": 0,
    "total_kilo": 5, "status": "arrived_at_outlet", "paid": true,
    "source": "walk_in",
    "items": [{ "id": "uuid", "quantity": 2 }]
  }
  ```
  Fees/status/source are locked — server rejects changes to these values. Items can be existing `id` or new `name`.
- `GET /api/admin/items/search?name=` — debounced item search.

**States:** loading (customer info), submitting, validation error, success redirect to `/admin/orders`, error.

**Components:** `form-field`, `ErrorBanner`, shadcn `Input`, `Switch`, `Button`, `Card`.

---

### 7.11 Schedule Management — `/admin/schedule`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/schedule/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Manage weekly work schedules for all workers and drivers. |

**UI sections:**

1. Dashboard counts — total workers, total drivers, total scheduled, on duty today
2. Table of workers × week — each row: worker/driver name, role, scheduled days summary
3. "Tambah jadwal" (Add schedule) button — opens worker search (debounced, `GET /api/admin/schedule/no-shift-workers?keyword=&role=`)
4. Schedule editor — per worker:
   - Day/time rows: day select (Mon–Sun) + start time + end time
   - "Tambah hari" (Add day) button
   - Remove row button per day
   - Server validates time overlap → 400 error message
5. "Simpan" (Save) button → `POST /api/admin/schedule/:id`
6. Link to schedule summary → `/admin/schedule/summary`
7. Empty states — no workers, no schedules

**API calls:**

- `GET /api/admin/schedule/?role=&station=&name=` → schedule rows + dashboard counts.
- `GET /api/admin/schedule/no-shift-workers?keyword=&role=` → workers without a schedule (debounced).
- `POST /api/admin/schedule/:id` body `{ schedules: [{ day: "mon", start: "08:00", end: "16:00" }] }` — replaces the weekly set.

**States:** loading, searching workers, saving, overlap error (400), success toast, error.

**Components:** `form-field`, `ErrorBanner`, shadcn `Table`, `Input`, `Select`, `Button`, `Badge`.

---

### 7.12 Schedule Summary — `/admin/schedule/summary`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/schedule/summary/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Visual grid showing station coverage per day of the week. |

**UI sections:**

1. Grid — rows: stations (`washing`, `ironing`, `packing`); columns: days (Mon–Sun)
2. Each cell shows count of workers assigned
3. Color coding — green (covered), yellow (minimal), red (no coverage)
4. Back link → `/admin/schedule`

**API calls:**

- `GET /api/admin/schedule/summary-dashboard` → station coverage data.

**States:** loading, error.

**Components:** shadcn `Card`, `Badge`.

---

### 7.13 Staff Management — `/admin/staff`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/staff/page.tsx` |
| **Access** | outlet_admin |
| **Purpose** | Manage staff accounts — view, add, change role, remove. |

**UI sections:**

1. Page heading + "Tambah Staf" (Add staff) button
2. Staff table — columns: email, name, role (badge), outlet
3. Per-row role dropdown — change role inline → `PATCH /api/admin/users`
4. Per-row "Hapus" (Remove) button → confirm dialog → `DELETE /api/admin/users/:userId`
5. Add staff modal — email + role select (`driver`, `worker`, `outlet_admin`) + outlet picker
6. Loading skeleton

**API calls:**

- `GET /api/admin/users` → all users with role + outlet.
- `POST /api/admin/register` body `{ email, role, outlet_id }` — sends verification email to user.
- `PATCH /api/admin/users` body `{ userId, role }` — change role.
- `DELETE /api/admin/users/:userId` — remove user.

**States:** loading, adding staff (modal loading), changing role, confirming delete, error.

**Components:** `ConfirmDialog`, `DataTable`, shadcn `Dialog`, `Select`, `Badge`, `Button`.

---

### 7.14 Items — `/admin/items`

| Item | Detail |
| --- | --- |
| **Route** | `app/admin/items/page.tsx` |
| **Access** | outlet_admin (read-only); super_admin (with CRUD buttons) |
| **Purpose** | View and search laundry items. CRUD controls visible to super_admin only. |

**UI sections:**

1. Search box — debounced item name search
2. Items list / table — item name
3. CRUD buttons (super_admin only): add new item, edit inline, delete with confirm
4. Empty state — "Belum ada item"

**API calls:**

- `GET /api/admin/items/` → all items.
- `GET /api/admin/items/search?name=` → debounced search.

**States:** loading, searching, empty, error.

**Components:** `ConfirmDialog`, `EmptyState`, shadcn `Input`, `Button`.

---

## 8. Super Admin Dashboard (3 pages)

> Role: `super_admin`. Shell: `SuperShell` (fixed sidebar on desktop, top bar on mobile). Has access to all Outlet Admin pages (§7) plus system-level CRUD below. Sidebar: Outlet, Item, Staf.

### 8.1 Outlets CRUD — `/super/outlets`

| Item | Detail |
| --- | --- |
| **Route** | `app/super/outlets/page.tsx` |
| **Access** | super_admin |
| **Purpose** | Create, read, update, delete laundry outlets. |

**UI sections:**

1. Page heading + "Tambah Outlet" (Add outlet) button
2. Outlet table — columns: name, address, coverage km, price/km, price/kg
3. Row click → expand inline edit or open edit dialog
4. Create/edit form fields:
   - `name` — text
   - `address` — textarea
   - Map picker for `lat`/`lng` (`LocationPicker` component)
   - `max_distance_km` — number
   - `price_per_km` — number
   - `price_per_kg` — number
5. Save button → `POST /api/admin/outlets/` (create) or `PUT /api/admin/outlets/:id` (update)
6. Delete button → confirm dialog → `DELETE /api/admin/outlets/:id`
7. Empty state — "Belum ada outlet"

**API calls:**

- List: `GET /api/outlets/` (public endpoint).
- Create: `POST /api/admin/outlets/` body `{ name, address, lat, lng, max_distance_km, price_per_km, price_per_kg }`.
- Update: `PUT /api/admin/outlets/:id` — any subset of the same fields.
- Delete: `DELETE /api/admin/outlets/:id`.

**States:** loading, creating/editing (form loading), confirming delete, validation error, success toast, error.

**Components:** `ConfirmDialog`, `LocationPicker`, `form-field`, `DataTable`, shadcn `Dialog`, `Input`, `Button`.

---

### 8.2 Items CRUD — `/super/items`

| Item | Detail |
| --- | --- |
| **Route** | `app/super/items/page.tsx` |
| **Access** | super_admin |
| **Purpose** | Create, read, update, delete laundry service items. |

**UI sections:**

1. Page heading + "Tambah Item" (Add item) button
2. Item list / table — item name
3. Inline edit — click item name to edit in-place
4. "Tambah Item" opens input field to add new item
5. Delete button per item → confirm dialog
6. Empty state — "Belum ada item"

**API calls:**

- List: `GET /api/admin/items/` → all items.
- Get one: `GET /api/admin/items/:id` → single item.
- Create: `POST /api/admin/items/` body `{ name }`.
- Update: `PUT /api/admin/items/:id` body `{ name }`.
- Delete: `DELETE /api/admin/items/:id`.

**States:** loading, creating/editing inline, confirming delete, validation error, success toast, error.

**Components:** `ConfirmDialog`, `EmptyState`, shadcn `Input`, `Button`.

---

### 8.3 Staff & Roles — `/super/staff`

| Item | Detail |
| --- | --- |
| **Route** | `app/super/staff/page.tsx` |
| **Access** | super_admin |
| **Purpose** | Manage all staff accounts system-wide with full role control. |

**UI sections:**

1. Page heading + "Tambah Staf" (Add staff) button
2. Staff table — columns: email, name, role (badge), outlet
3. Per-row role dropdown — can assign any role including `super_admin` and `outlet_admin`
4. Per-row "Hapus" (Remove) button → confirm dialog
5. Add staff modal — email + role select (all roles) + outlet picker (required for `driver`, `worker`, `outlet_admin`)
6. Loading skeleton

**API calls:**

- Same as §7.13 but super_admin can also promote to `super_admin` / `outlet_admin`.
- `GET /api/admin/users`, `POST /api/admin/register`, `PATCH /api/admin/users`, `DELETE /api/admin/users/:userId`.
- Outlet list for picker: `GET /api/outlets/`.

**States:** loading, adding staff, changing role, confirming delete, error.

**Components:** `ConfirmDialog`, `DataTable`, shadcn `Dialog`, `Select`, `Badge`, `Button`.

---

## 9. Cross-cutting Concerns

### 9.1 Session Restore & Auth Guard

Every app calls `GET /api/refresh` → `GET /api/me` on mount. On 401 → redirect to `/login`. This is handled at the shell/layout level (`CustomerShell`, `DriverShell`, etc.) before rendering page content.

### 9.2 On-shift Guard (Driver & Worker)

Driver and Worker job pages require being on shift (`ensureWorkerOnShift` middleware). If the user has no shift scheduled for today → block the page and show a "not on shift" screen with a link to `/schedule`.

### 9.3 Error Handling

Unified error banner for all API errors using the `ErrorBanner` component. Error shape from API: `{ success: false, message: "..." }`. Handle:

| HTTP code | Meaning | UI action |
| --- | --- | --- |
| 400 | Validation error | Show field-level errors or message banner |
| 401 | Unauthorized | Refresh token → retry; if still fails → redirect to `/login` |
| 403 | Wrong role | Show "access denied" message |
| 404 | Resource not found | Show not-found state |
| 409 | Conflict (e.g. already has active order) | Show conflict message with suggested action |
| 429 | Rate limited | Show "too many requests, try again later" |

### 9.4 Empty States

Every list page has an `EmptyState` component with an icon, title, description, and optional action button. Examples:
- "Belum ada pesanan" (No orders yet) + "Buat pesanan baru" CTA
- "Tidak ada pickup pending" (No pending pickups)
- "Tidak ada jadwal" (No schedule assigned) + "Hubungi admin outlet" note

### 9.5 Loading States

- **Skeleton loaders** — `Skeleton` component for tables, cards, and stat grids
- **Button loading** — spinner inside buttons during form submission
- **Full-page loading** — `FullScreenLoader` (from `BrandLogo`) during initial session restore

### 9.6 File Uploads (Cloudinary 2-step)

All image uploads follow the same pattern:

1. **Get signed URL:** `GET /api/signature/:folder/:params/:unique` → returns Cloudinary signature params
2. **Upload to Cloudinary:** POST file directly to Cloudinary using the signed params → returns `secure_url`
3. **Send URL to API:** include `secure_url` in the API request body

Upload folders:

| Folder | Used for | Component |
| --- | --- | --- |
| `avatars` | User profile picture | `ImageUpload` on `/profile` |
| `payment-proofs` | Manual payment proof images | `ImageUpload` on `/order/:id/payment` |
| `complaints` | Complaint evidence images | `ImageUpload` on `/order/:id/complaint` |

### 9.7 Maps Integration

| Component | Used on | Library | Purpose |
| --- | --- | --- | --- |
| `OutletMap` | `/` (home) | `@react-google-maps/api` | Show all outlets with markers + coverage circles |
| `LocationPicker` | `/location`, `/addresses/*`, `/super/outlets` | `@react-google-maps/api` | Draggable pin for lat/lng selection |
| `MapView` | `/jobs/pickup/:id`, `/jobs/delivery/:id`, `/pickup` | `@react-google-maps/api` | Static map with route marker |

Google Maps API key is required. See `implement.md` for detailed implementation guide.

### 9.8 Toast Notifications

Sonner toast library (top-center, rich colors). Used for:
- Success actions (saved, submitted, completed)
- Error messages (API failures, validation)
- Info messages (mismatch detected, payment pending)

### 9.9 Known Frontend Gaps

| Gap | Status | Notes |
| --- | --- | --- |
| Order history page (`/order/history`) | Not yet in `app/` directory | Backend endpoint for order list-by-id also missing (see `SITEMAP.md` §10) |
| Active sessions display on profile | Not implemented | Planned for profile page |
| Push/email notifications | Not implemented | Backend TODO — waiting for email service integration |
| Driver schedule page (shared route) | Uses same `/schedule` route as worker | No visual distinction needed |
| Walk-in order completion by admin | Not implemented in backend | Walk-in orders can't be marked `finished` by admin yet |
| Pagination on list endpoints | Partial | Some list endpoints support it; not all (see `SITEMAP.md` §10) |

---

## Appendix A. Component Reference

| Component | Path | Purpose |
| --- | --- | --- |
| `AppShell` | `components/shared/AppShell.tsx` | Core nav shell — bottom tabs or sidebar variant |
| `BrandLogo` | `components/shared/BrandLogo.tsx` | Circular "IW" logo + spinner |
| `StatusStepper` | `components/shared/StatusStepper.tsx` | Vertical order status stepper |
| `StepIndicator` | `components/shared/StepIndicator.tsx` | Horizontal numbered step indicator |
| `OtpInput` | `components/shared/OtpInput.tsx` | 6-digit OTP input wrapper |
| `ImageUpload` | `components/shared/ImageUpload.tsx` | Cloudinary 2-step upload with preview |
| `ConfirmDialog` | `components/shared/ConfirmDialog.tsx` | Reusable confirm/cancel dialog |
| `EmptyState` | `components/shared/EmptyState.tsx` | Empty state with icon + action |
| `ErrorBanner` | `components/shared/ErrorBanner.tsx` | Inline error with retry |
| `MapView` | `components/shared/MapView.tsx` | Read-only Google Map with marker |
| `DataTable` | `components/shared/DataTable.tsx` | Generic typed data table |
| `CustomerShell` | `components/customer/customer-shell.tsx` | Customer bottom tab nav |
| `OutletMap` | `components/customer/outlet-map.tsx` | Interactive outlet map with coverage |
| `LocationPicker` | `components/customer/location-picker.tsx` | Center-pin map picker |
| `AddressForm` | `components/customer/address-form.tsx` | Address create/edit with map |
| `OutletCard` | `components/customer/outlet-card.tsx` | Outlet info card with pricing |
| `DriverShell` | `components/driver/driver-shell.tsx` | Driver bottom tab nav |
| `WorkerShell` | `components/worker/worker-shell.tsx` | Worker header nav |
| `AdminShell` | `components/admin/admin-shell.tsx` | Outlet admin sidebar |
| `SuperShell` | `components/admin/super-shell.tsx` | Super admin sidebar |
| `AuthShell` | `components/auth/auth-shell.tsx` | Centered auth card layout |
| `FormField` | `components/auth/form-field.tsx` | Form field wrapper (Tanstack Form) |
| `SocialButtons` | `components/auth/social-buttons.tsx` | OAuth login buttons |

## Appendix B. Page Count Summary

| Group | Pages | Routes |
| --- | --- | --- |
| Shared Auth & Onboarding | 8 | `/setup`, `/login`, `/register`, `/register/verify`, `/register/complete`, `/register/telegram-email`, `/forgot-password`, `/reset-password`, `/profile` |
| Customer App | 10 | `/`, `/location`, `/addresses`, `/addresses/new`, `/addresses/[id]`, `/pickup`, `/order`, `/order/[id]/payment`, `/order/[id]/complaint`, `/order/complete` |
| Driver App | 9 | `/jobs/pickup`, `/jobs/pickup/[id]`, `/jobs/pickup/accepted`, `/jobs/pickup/history`, `/jobs/delivery`, `/jobs/delivery/[id]`, `/jobs/delivery/active`, `/jobs/delivery/history`, `/schedule` |
| Worker App | 5 | `/jobs/available`, `/jobs/active`, `/jobs/[id]/process`, `/jobs/history`, `/schedule` |
| Outlet Admin | 14 | `/admin`, `/admin/orders`, `/admin/orders/[id]`, `/admin/orders/manual/[walkinId]`, `/admin/payments`, `/admin/complaints`, `/admin/mismatch`, `/admin/mismatch/[orderId]/[station]`, `/admin/walk-in`, `/admin/walk-in/new`, `/admin/schedule`, `/admin/schedule/summary`, `/admin/staff`, `/admin/items` |
| Super Admin | 3 | `/super/outlets`, `/super/items`, `/super/staff` |
| **Total** | **49** | |
