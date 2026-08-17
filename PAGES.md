# Frontend Page Inventory

> Build spec for all frontend pages assuming the API is fully built. This doc is page/section-focused only — no API details. For endpoints, validation schemas, and enums, see `SITEMAP.md`.

## Summary

- **Total pages: 49**
- **Apps:** 6 groups — Shared Auth & Onboarding (8), Customer (10), Driver (9), Worker (5), Outlet Admin Dashboard (14), Super Admin Dashboard (3)
- **Shared layout per app:** navbar/sidebar, session-restore guard, toast + error + empty-state components, on-shift guard (driver/worker)

---

## 1. Shared Auth & Onboarding (8 pages)

### 1.1 Setup First Super Admin — `/setup`
- **Role:** public (only when no super admin exists; else redirect to login)
- **Sections:**
  1. Centered card with logo + app name
  2. Form: email, name, password + confirm
  3. Submit button with loading state
  4. Error banner (super admin already exists / rate limited)

### 1.2 Login — `/login`
- **Role:** public
- **Sections:**
  1. Email + password form
  2. "Sign in with Google" button (social)
  3. Links: register, forgot password
  4. Error states (invalid credentials, missing fields)
  5. Post-login redirect by role

### 1.3 Register Step 1 — `/register`
- **Role:** public
- **Sections:**
  1. Step indicator (1→2→3)
  2. Email field + "Continue"
  3. Rate-limit / invalid email error

### 1.4 Register Step 2 — `/register/verify`
- **Role:** public (requires step 1)
- **Sections:**
  1. Step indicator
  2. 6-digit OTP input
  3. Resend link + countdown cooldown
  4. Email-link path (deep link with token)
  5. Invalid/expired token error

### 1.5 Register Step 3 — `/register/complete`
- **Role:** public (requires step 2)
- **Sections:**
  1. Step indicator
  2. Form: name, phone (optional), password + confirm
  3. Submit → auto-login → redirect to app by role

### 1.6 Forgot Password — `/forgot-password`
- **Role:** public
- **Sections:**
  1. Email input
  2. Submit → "check your email" confirmation
  3. Link back to login

### 1.7 Reset Password — `/reset-password`
- **Role:** public
- **Sections:**
  1. 6-digit OTP input
  2. New password + confirm
  3. Submit → redirect to login
  4. Invalid/expired token error

### 1.8 Profile & Account — `/profile`
- **Role:** any authenticated
- **Sections:**
  1. Read-only account info (email, phone, role, joined date)
  2. Edit name
  3. Change password
  4. Change email (2-step OTP flow)
  5. Avatar upload (2-step: signed URL → Cloudinary → send URL)
  6. Logout button

---

## 2. Customer App (10 pages)

> Nav: Home, Addresses, Pickup, My Order, Profile.

### 2.1 Home / Landing — `/`
- **Role:** public
- **Sections:**
  1. Hero + "Detect my location" button
  2. Outlet list with distance + prices
  3. Coverage check result ("no outlets in your area" empty state)
  4. CTA → pickup flow
  5. Loading skeleton

### 2.2 Choose Location — `/location`
- **Role:** customer
- **Sections:**
  1. Map with draggable pin
  2. "Use current location" button
  3. Coordinates preview + live coverage re-check
  4. "Confirm location" → continue to pickup

### 2.3 Address Book — `/addresses`
- **Role:** customer
- **Sections:**
  1. Address cards (label, full address, default badge)
  2. Per-card actions: Edit, Delete (confirm), Set default
  3. "Add new address" button
  4. Empty state → prompt to add first address

### 2.4 Add / Edit Address — `/addresses/new`, `/addresses/:id`
- **Role:** customer
- **Sections:**
  1. Form: label (Home/Office/etc.), address text
  2. Map picker for lat/lng
  3. Is-default toggle
  4. Validation errors / not-found state

### 2.5 Request Pickup — `/pickup`
- **Role:** customer
- **Sections:**
  1. Step 1: pick address
  2. Step 2: pick outlet
  3. Step 3: review + submit
  4. Success screen → link to `/order`
  5. Guards: no address → redirect; not covered → message; already has active order

### 2.6 Active Order Status & Tracking — `/order`
- **Role:** customer
- **Sections:**
  1. Status stepper (full OrderStatus flow)
  2. Order summary (items, kg, price, outlet)
  3. Driver contact info (if assigned)
  4. Payment CTA when `waiting_for_payment`
  5. Empty state ("no active order")

### 2.7 Payment — `/order/:id/payment`
- **Role:** customer
- **Sections:**
  1. Two payment option cards (Gateway vs Manual Transfer)
  2. Gateway path: Midtrans Snap (redirect or popup)
  3. Manual path: bank transfer instructions + image upload with preview
  4. "I've paid" button
  5. Cancel / change method link
  6. Conflict errors (already paid / not your order)

### 2.8 Completed Order — `/order/complete`
- **Role:** customer
- **Sections:**
  1. Completion summary (kg, total, items, completedAt)
  2. "Confirm received" action (from delivery screen)
  3. Reorder CTA
  4. Link to complaint if unhappy

### 2.9 Submit Complaint — `/order/:id/complaint`
- **Role:** customer
- **Sections:**
  1. Message textarea (required)
  2. Optional image upload with preview
  3. Submit → success confirmation
  4. Validation errors

---

## 3. Driver App (9 pages)

> Nav: Pickup Jobs, Delivery Jobs, History, Schedule. If not on shift, job pages show "not on shift" screen → link to schedule.

### 3.1 Available Pickups — `/jobs/pickup`
- **Role:** driver
- **Sections:**
  1. List of request cards (customer name/phone, address, created time)
  2. "Accept" button per card
  3. Empty state ("no pending pickups")

### 3.2 Pickup Detail — `/jobs/pickup/:id`
- **Role:** driver
- **Sections:**
  1. Customer + address info
  2. Route to destination (map)
  3. Status badge
  4. Big "Next step" button (advance status)
  5. Not-found / already-completed states

### 3.3 Accepted Pickups — `/jobs/pickup/accepted`
- **Role:** driver
- **Sections:**
  1. List of my accepted pickups (with status)
  2. Row click → detail
  3. Empty state

### 3.4 Pickup History — `/jobs/pickup/history`
- **Role:** driver
- **Sections:**
  1. Completed pickups list with completion timestamps

### 3.5 Available Deliveries — `/jobs/delivery`
- **Role:** driver
- **Sections:**
  1. Delivery cards (total kg, price, destination)
  2. "Accept" button per card
  3. Empty state

### 3.6 Delivery Detail — `/jobs/delivery/:id`
- **Role:** driver
- **Sections:**
  1. Destination address + map
  2. "Mark delivered" button
  3. Status badge
  4. Not-found / already-completed states

### 3.7 Active Deliveries — `/jobs/delivery/active`
- **Role:** driver
- **Sections:**
  1. In-progress deliveries list (with status)
  2. Row click → detail

### 3.8 Delivery History — `/jobs/delivery/history`
- **Role:** driver
- **Sections:**
  1. Completed deliveries list with completion timestamps

### 3.9 My Schedule — `/schedule`
- **Role:** driver
- **Sections:**
  1. Weekly view (mon–sun) of my shifts (start/end time)
  2. Empty state ("no shift assigned, contact outlet admin")

---

## 4. Worker App (5 pages)

> Nav: Available, Active, History, Schedule. Must be on shift.

### 4.1 Available Jobs — `/jobs/available`
- **Role:** worker (on shift)
- **Sections:**
  1. Job cards (order + items + total kilo) for my station
  2. "Process" button → `/jobs/:id/process`
  3. Empty state

### 4.2 Process / Re-input — `/jobs/:id/process`
- **Role:** worker
- **Sections:**
  1. Per-item quantity steppers (pre-filled with expected quantity, range 1–100)
  2. Total items counter
  3. Submit button (accept + re-input)
  4. "Mismatch created — waiting for admin approval" notice
  5. Validation errors

### 4.3 Active Jobs — `/jobs/active`
- **Role:** worker
- **Sections:**
  1. My in-progress jobs (station status, startedAt)
  2. "Mark done" button per job with confirmation dialog
  3. Empty state

### 4.4 History — `/jobs/history`
- **Role:** worker
- **Sections:**
  1. Completed jobs list with timestamps

### 4.5 My Schedule — `/schedule`
- **Role:** worker
- **Sections:**
  1. Weekly grid (mon–sun) with start/end + station label
  2. Empty state

---

## 5. Outlet Admin Dashboard (14 pages)

> Sidebar: Dashboard, Orders, Payments, Complaints, Mismatch, Walk-in, Schedule, Staff, Items.

### 5.1 Dashboard — `/admin`
- **Role:** outlet_admin
- **Sections:**
  1. Stat cards (total workers, station coverage per day)
  2. Quick links to schedule + orders
  3. Loading skeletons

### 5.2 Orders — `/admin/orders`
- **Role:** outlet_admin
- **Sections:**
  1. Filterable table (by status, source: customer_app / walk_in)
  2. Columns: customer, source, status, totals
  3. Row click → order detail

### 5.3 Order Detail / Edit — `/admin/orders/:id`
- **Role:** outlet_admin
- **Sections:**
  1. Order info header (customer, status, totals)
  2. Edit total kg
  3. Item lines (edit quantity; add by searching existing item or typing new name)
  4. Price recalculation preview
  5. Save button

### 5.4 Payment Proofs — `/admin/payments`
- **Role:** outlet_admin
- **Sections:**
  1. Proof image gallery (customer + amount per card)
  2. Approve / Reject buttons per item
  3. Refresh after action
  4. Empty state

### 5.5 Complaints — `/admin/complaints`
- **Role:** outlet_admin
- **Sections:**
  1. Complaint cards (message, image, order)
  2. Response textarea
  3. Resolve / Reject buttons
  4. Empty state

### 5.6 Mismatches — `/admin/mismatch`
- **Role:** outlet_admin
- **Sections:**
  1. Filter chips by station
  2. List rows (orderId, station, per-item difference summary, reportedAt)
  3. Row click → detail

### 5.7 Mismatch Detail — `/admin/mismatch/:orderId/:station`
- **Role:** outlet_admin
- **Sections:**
  1. Table: expected vs re-input vs difference per item
  2. Per-item Approve/Reject + admin note
  3. Final quantity input
  4. Save button
  5. Worker info header

### 5.8 Walk-in Customers — `/admin/walk-in`
- **Role:** outlet_admin
- **Sections:**
  1. Search box (debounced, by name/phone)
  2. Results list with name + phone
  3. Per-row: Edit, Delete (confirm), "Create order" → manual order
  4. Create/edit modal (name + phone with validation)
  5. Empty state

### 5.9 Walk-in Create — `/admin/walk-in/new`
- **Role:** outlet_admin
- **Sections:**
  1. Form: name, phone
  2. Phone validation (Indonesian format)
  3. Submit → back to list

### 5.10 Manual Order — `/admin/orders/manual/:walkinId`
- **Role:** outlet_admin
- **Sections:**
  1. Customer header
  2. Total kg input
  3. Item lines (search existing or type new name)
  4. Paid toggle
  5. Fees/status summary (locked by server)
  6. Submit button

### 5.11 Schedule Management — `/admin/schedule`
- **Role:** outlet_admin
- **Sections:**
  1. Dashboard counts (total worker, total driver, total schedule, on duty today)
  2. Table of workers × week
  3. Pick worker (debounced search) → schedule editor
  4. Editor: day/time rows, add-day button, remove row
  5. Save button (overlap → error message)
  6. Empty states

### 5.12 Schedule Summary — `/admin/schedule/summary`
- **Role:** outlet_admin
- **Sections:**
  1. Coverage grid (stations × days of week with counts)

### 5.13 Staff Management — `/admin/staff`
- **Role:** outlet_admin
- **Sections:**
  1. Staff table (email, role, outlet)
  2. "Add staff" modal (email + role + outlet picker)
  3. Role dropdown per row
  4. Remove confirm

### 5.14 Items — `/admin/items`
- **Role:** outlet_admin
- **Sections:**
  1. Item list / search box
  2. Empty state
  3. (CRUD shown for super_admin only)

---

## 6. Super Admin Dashboard (3 pages)

> Reuses Outlet Admin pages; sidebar adds Outlets + Items CRUD.

### 6.1 Outlets CRUD — `/super/outlets`
- **Role:** super_admin
- **Sections:**
  1. Outlet table (name, address, coverage, prices)
  2. Create/edit form (name, address, map picker, coverage km, price/km, price/kg)
  3. Delete confirm

### 6.2 Items CRUD — `/super/items`
- **Role:** super_admin
- **Sections:**
  1. Item list
  2. Inline add/edit name
  3. Delete confirm

### 6.3 Staff & Roles — `/super/staff`
- **Role:** super_admin
- **Sections:**
  1. Staff table with role management (incl. promoting to super_admin / outlet_admin)
  2. "Add staff" modal (email + role + outlet picker)
  3. Remove confirm

---

## Shared / Cross-cutting

- **Session restore guard:** on app mount, restore session; on failure redirect to `/login`.
- **Error handling:** unified toast/banner for 400/401/403/404/409/429 with the API's message.
- **Empty states:** every list page has one.
- **On-shift guard:** driver/worker job endpoints require being on shift → show "not on shift" screen linking to `/schedule`.
- **Uploads (avatar, payment proof, complaint image):** always 2-step — signed URL → Cloudinary → send URL to API.
