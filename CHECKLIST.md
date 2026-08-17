# Frontend Implementation Checklist

Based on `PAGES.md` — 49 pages across 6 apps.

---

## 1. Shared Auth & Onboarding (8 pages)

### 1.1 Setup First Super Admin — `/setup`
- [ ] Page scaffold + route
- [ ] Form: email, name, password + confirm
- [ ] Submit with loading state
- [ ] Error banner (409 super admin exists, 429 rate limit)
- [ ] Redirect if already set up

### 1.2 Login — `/login`
- [ ] Page scaffold + route
- [ ] Email + password form
- [ ] Social login button (Google)
- [ ] Links: register, forgot password
- [ ] Error states (400, 401)
- [ ] Post-login redirect by role

### 1.3 Register Step 1 — `/register`
- [ ] Page scaffold + route
- [ ] Step indicator (1→2→3)
- [ ] Email field + Continue
- [ ] Validation + rate limit error

### 1.4 Register Step 2 — `/register/verify`
- [ ] Page scaffold + route
- [ ] Step indicator
- [ ] 6-digit OTP input
- [ ] Resend link + countdown cooldown
- [ ] Email-link deep link handling
- [ ] Invalid/expired token error

### 1.5 Register Step 3 — `/register/complete`
- [ ] Page scaffold + route
- [ ] Step indicator
- [ ] Form: name, phone (optional), password + confirm
- [ ] Submit → auto-login → redirect by role

### 1.6 Forgot Password — `/forgot-password`
- [ ] Page scaffold + route
- [ ] Email input + submit
- [ ] "Check your email" confirmation
- [ ] Link back to login

### 1.7 Reset Password — `/reset-password`
- [ ] Page scaffold + route
- [ ] 6-digit OTP input
- [ ] New password + confirm
- [ ] Submit → redirect to login
- [ ] Invalid/expired token error

### 1.8 Profile & Account — `/profile`
- [ ] Page scaffold + route (auth guard)
- [ ] Read-only account info display
- [ ] Edit name
- [ ] Change password
- [ ] Change email (2-step OTP flow)
- [ ] Avatar upload (2-step: signed URL → Cloudinary → send URL)
- [ ] Logout button

---

## 2. Customer App (10 pages)

### 2.1 Home / Landing — `/`
- [ ] Page scaffold + route (public)
- [ ] Hero + "Detect my location" button
- [ ] Outlet list with distance + prices
- [ ] Coverage check result + empty state
- [ ] CTA → pickup flow
- [ ] Loading skeleton

### 2.2 Choose Location — `/location`
- [ ] Page scaffold + route
- [ ] Map with draggable pin
- [ ] "Use current location" button
- [ ] Coordinates preview + live coverage re-check
- [ ] "Confirm location" → pickup

### 2.3 Address Book — `/addresses`
- [ ] Page scaffold + route (auth)
- [ ] Address cards (label, address, default badge)
- [ ] Per-card: Edit, Delete (confirm), Set default
- [ ] "Add new address" button
- [ ] Empty state

### 2.4 Add / Edit Address — `/addresses/new`, `/addresses/:id`
- [ ] Page scaffold + route
- [ ] Form: label, address text
- [ ] Map picker for lat/lng
- [ ] Is-default toggle
- [ ] Validation / not-found states

### 2.5 Request Pickup — `/pickup`
- [ ] Page scaffold + route (auth)
- [ ] Step 1: pick address
- [ ] Step 2: pick outlet
- [ ] Step 3: review + submit
- [ ] Success screen → link to `/order`
- [ ] Guards: no address → redirect; not covered → message; active order → 409

### 2.6 Active Order Status & Tracking — `/order`
- [ ] Page scaffold + route (auth)
- [ ] Status stepper (full OrderStatus flow)
- [ ] Order summary (items, kg, price, outlet)
- [ ] Driver contact info (if assigned)
- [ ] Payment CTA when `waiting_for_payment`
- [ ] Empty state ("no active order")

### 2.7 Payment — `/order/:id/payment`
- [ ] Page scaffold + route (auth)
- [ ] Two payment option cards (Gateway vs Manual)
- [ ] Gateway path: Midtrans Snap (redirect/popup)
- [ ] Manual path: bank instructions + image upload with preview
- [ ] "I've paid" button
- [ ] Cancel / change method link
- [ ] Conflict errors (already paid, not your order)

### 2.8 Completed Order — `/order/complete`
- [ ] Page scaffold + route (auth)
- [ ] Completion summary (kg, total, items, completedAt)
- [ ] "Confirm received" action
- [ ] Reorder CTA
- [ ] Link to complaint

### 2.9 Submit Complaint — `/order/:id/complaint`
- [ ] Page scaffold + route (auth)
- [ ] Message textarea (required)
- [ ] Optional image upload with preview
- [ ] Submit → success confirmation
- [ ] Validation errors

---

## 3. Driver App (9 pages)

### 3.1 Available Pickups — `/jobs/pickup`
- [ ] Page scaffold + route (driver, on-shift guard)
- [ ] Request cards (customer name/phone, address, time)
- [ ] "Accept" button per card
- [ ] Empty state

### 3.2 Pickup Detail — `/jobs/pickup/:id`
- [ ] Page scaffold + route
- [ ] Customer + address info
- [ ] Route to destination (map)
- [ ] Status badge
- [ ] "Next step" button
- [ ] Not-found / completed states

### 3.3 Accepted Pickups — `/jobs/pickup/accepted`
- [ ] Page scaffold + route
- [ ] List of accepted pickups with status
- [ ] Row click → detail
- [ ] Empty state

### 3.4 Pickup History — `/jobs/pickup/history`
- [ ] Page scaffold + route
- [ ] Completed pickups list with timestamps

### 3.5 Available Deliveries — `/jobs/delivery`
- [ ] Page scaffold + route (driver, on-shift guard)
- [ ] Delivery cards (total kg, price, destination)
- [ ] "Accept" button per card
- [ ] Empty state

### 3.6 Delivery Detail — `/jobs/delivery/:id`
- [ ] Page scaffold + route
- [ ] Destination address + map
- [ ] "Mark delivered" button
- [ ] Status badge
- [ ] Not-found / completed states

### 3.7 Active Deliveries — `/jobs/delivery/active`
- [ ] Page scaffold + route
- [ ] In-progress deliveries list with status
- [ ] Row click → detail

### 3.8 Delivery History — `/jobs/delivery/history`
- [ ] Page scaffold + route
- [ ] Completed deliveries list with timestamps

### 3.9 My Schedule — `/schedule`
- [ ] Page scaffold + route
- [ ] Weekly view (mon–sun) with start/end times
- [ ] Empty state ("no shift assigned")

---

## 4. Worker App (5 pages)

### 4.1 Available Jobs — `/jobs/available`
- [ ] Page scaffold + route (worker, on-shift guard)
- [ ] Job cards for my station (order + items + kg)
- [ ] "Process" button → `/jobs/:id/process`
- [ ] Empty state

### 4.2 Process / Re-input — `/jobs/:id/process`
- [ ] Page scaffold + route
- [ ] Per-item quantity steppers (pre-filled, 1–100)
- [ ] Total items counter
- [ ] Submit (accept + re-input)
- [ ] "Mismatch created" notice
- [ ] Validation errors

### 4.3 Active Jobs — `/jobs/active`
- [ ] Page scaffold + route
- [ ] In-progress jobs list (station status, startedAt)
- [ ] "Mark done" button + confirmation dialog
- [ ] Empty state

### 4.4 History — `/jobs/history`
- [ ] Page scaffold + route
- [ ] Completed jobs list with timestamps

### 4.5 My Schedule — `/schedule`
- [ ] Page scaffold + route
- [ ] Weekly grid (mon–sun) with start/end + station label
- [ ] Empty state

---

## 5. Outlet Admin Dashboard (14 pages)

### 5.1 Dashboard — `/admin`
- [ ] Page scaffold + route (outlet_admin)
- [ ] Stat cards (total workers, station coverage per day)
- [ ] Quick links
- [ ] Loading skeletons

### 5.2 Orders — `/admin/orders`
- [ ] Page scaffold + route
- [ ] Filterable table (status, source)
- [ ] Columns: customer, source, status, totals
- [ ] Row click → detail

### 5.3 Order Detail / Edit — `/admin/orders/:id`
- [ ] Page scaffold + route
- [ ] Order info header
- [ ] Edit total kg
- [ ] Item lines (edit qty, add by search or new name)
- [ ] Price recalculation preview
- [ ] Save button

### 5.4 Payment Proofs — `/admin/payments`
- [ ] Page scaffold + route
- [ ] Proof image gallery (customer + amount)
- [ ] Approve / Reject buttons per item
- [ ] Refresh after action
- [ ] Empty state

### 5.5 Complaints — `/admin/complaints`
- [ ] Page scaffold + route
- [ ] Complaint cards (message, image, order)
- [ ] Response textarea
- [ ] Resolve / Reject buttons
- [ ] Empty state

### 5.6 Mismatches — `/admin/mismatch`
- [ ] Page scaffold + route
- [ ] Filter chips by station
- [ ] List rows (orderId, station, difference summary, reportedAt)
- [ ] Row click → detail

### 5.7 Mismatch Detail — `/admin/mismatch/:orderId/:station`
- [ ] Page scaffold + route
- [ ] Table: expected vs re-input vs difference per item
- [ ] Per-item Approve/Reject + admin note
- [ ] Final quantity input
- [ ] Save button
- [ ] Worker info header

### 5.8 Walk-in Customers — `/admin/walk-in`
- [ ] Page scaffold + route
- [ ] Search box (debounced, name/phone)
- [ ] Results list with name + phone
- [ ] Per-row: Edit, Delete (confirm), "Create order"
- [ ] Create/edit modal (name + phone validation)
- [ ] Empty state

### 5.9 Walk-in Create — `/admin/walk-in/new`
- [ ] Page scaffold + route
- [ ] Form: name, phone
- [ ] Phone validation (Indonesian format)
- [ ] Submit → back to list

### 5.10 Manual Order — `/admin/orders/manual/:walkinId`
- [ ] Page scaffold + route
- [ ] Customer header
- [ ] Total kg input
- [ ] Item lines (search existing or type new)
- [ ] Paid toggle
- [ ] Fees/status summary (locked)
- [ ] Submit button

### 5.11 Schedule Management — `/admin/schedule`
- [ ] Page scaffold + route
- [ ] Dashboard counts
- [ ] Workers × week table
- [ ] Pick worker (debounced search) → editor
- [ ] Editor: day/time rows, add-day, remove row
- [ ] Save (overlap → error)
- [ ] Empty states

### 5.12 Schedule Summary — `/admin/schedule/summary`
- [ ] Page scaffold + route
- [ ] Coverage grid (stations × days with counts)

### 5.13 Staff Management — `/admin/staff`
- [ ] Page scaffold + route
- [ ] Staff table (email, role, outlet)
- [ ] "Add staff" modal (email + role + outlet picker)
- [ ] Role dropdown per row
- [ ] Remove confirm

### 5.14 Items — `/admin/items`
- [ ] Page scaffold + route
- [ ] Item list / search box
- [ ] Empty state

---

## 6. Super Admin Dashboard (3 pages)

### 6.1 Outlets CRUD — `/super/outlets`
- [ ] Page scaffold + route (super_admin)
- [ ] Outlet table
- [ ] Create/edit form (name, address, map picker, coverage km, price/km, price/kg)
- [ ] Delete confirm

### 6.2 Items CRUD — `/super/items`
- [ ] Page scaffold + route
- [ ] Item list
- [ ] Inline add/edit name
- [ ] Delete confirm

### 6.3 Staff & Roles — `/super/staff`
- [ ] Page scaffold + route
- [ ] Staff table with role management (incl. super_admin/outlet_admin promotion)
- [ ] "Add staff" modal (email + role + outlet picker)
- [ ] Remove confirm

---

## Shared / Cross-cutting (apply to all apps)

### Session & Auth
- [ ] Session restore guard: on mount `GET /api/refresh` → `GET /api/me`; on 401 redirect to `/login`
- [ ] Role-based route guards (redirect to correct app)
- [ ] Better Auth social login integration (separate from JWT cookie flow)

### Error Handling
- [ ] Unified toast/banner for 400/401/403/404/409/429 with API message
- [ ] Global error boundary

### UI Components
- [ ] Navbar/sidebar per role (Customer, Driver, Worker, Outlet Admin, Super Admin)
- [ ] Empty state component (reusable)
- [ ] Loading skeletons (reusable)
- [ ] Modal component (reusable)
- [ ] Confirmation dialog (reusable)
- [ ] Toast/notification system
- [ ] Form validation helpers (Zod on client)

### On-Shift Guard
- [ ] Driver/worker job pages check shift status
- [ ] "Not on shift" screen with link to `/schedule`

### File Uploads (2-step, reusable)
- [ ] `GET /api/signature/:folder` → signed URL
- [ ] Upload to Cloudinary with signed params
- [ ] Send returned URL to API
- [ ] Folders: `avatars`, `payment-proofs`, `complaints`
- [ ] Image preview component

### Maps / Location
- [ ] Google Maps integration (geolocation, draggable pin, route display)
- [ ] Live coverage re-check on marker move

### Utilities
- [ ] Debounced search hook
- [ ] Step indicator component (register, pickup wizard)
- [ ] Status stepper component (OrderStatus flow)
- [ ] OTP input component (6-digit, with countdown/resend)
- [ ] Phone validation (Indonesian format)

---

## Progress Summary

- [ ] **Auth & Onboarding**: 8 pages
- [ ] **Customer**: 10 pages
- [ ] **Driver**: 9 pages
- [ ] **Worker**: 5 pages
- [ ] **Outlet Admin**: 14 pages
- [ ] **Super Admin**: 3 pages
- [ ] **Shared components & utilities**: 15+ items

**Total: 49 pages + shared**