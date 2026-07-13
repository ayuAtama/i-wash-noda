# Feature Checklist

## Authentication

### Registration

- [x] Send OTP to registration email
- [x] Email verification via link
- [x] Email verification via code
- [x] Complete registration form (name and password)
- [x] Resend OTP

### Login

- [x] JWT authentication (email and password)
- [x] Refresh token
- [x] Better Auth integration (Google, etc.)
- [x] Logout

### Miscellaneous

- [x] Password reset
- [x] Email change
- [x] Get current user's information

---

## Address Management

- [x] Address search\*
- [x] Address creation\*
- [x] Address update\*
- [x] Address deletion\*
- [x] Set default address\*

---

## Outlet Coverage Management

- [x] Search outlet coverage by latitude and longitude
- [x] List all outlets
- [x] Outlet creation\*\*
- [x] Outlet update\*\*
- [x] Outlet deletion\*\*

---

## Laundry Item Management

- [x] List all items
- [x] Item creation\*\*
- [x] Item update\*\*
- [x] Item deletion\*\*
- [x] Searchable item list by keyword, used by the frontend to filter items or create a new one if it does not exist (using the order endpoint automatically by the outlet admin)\*\*

---

## Pickup Requests (Customer)

- [x] Check whether the user has an address, filter out outlets outside the coverage area, and validate existing pickup requests (only one order allowed)\*\* (using a raw query because it is faster than filtering on the server side)
- [x] Pickup request creation\*\*
- [x] Cancel pickup request before it is accepted by the driver\*\*
- [x] Check order status
- [x] Review pickup request validation and API responses more carefully

---

## Pickup Requests (Driver)

- [x] Fetch pickup requests with coordinates for the driver\*\*
- [x] Fetch pickup request list for the driver\*\*
- [x] Accept pickup requests\*\*
- [x] Fetch all accepted pickup requests for the driver (WIP)\*\*
- [x] Update pickup request status by the driver (same outlet)\*\*
- [x] Update status progression by the driver using the `:id/next` endpoint\*\*
- [x] Get all completed pickup requests for the driver\*\*

---

## Admin Outlet Orders

- [x] Create the first walk-in customer record (create)
- [x] Search walk-in customers for frontend debouncing before creating an order (read)
- [x] Create orders manually for walk-in customers
- [x] Fetch all orders assigned to the outlet by the outlet admin
- [x] Update order item quantity and status by the outlet admin from the driver

### Walk-in Customer Management

- [x] Complete CRUD for walk-in customers (update and delete)
- [x] Update the walk-in customer database with the `admin_outlet` ID
- [x] Update walk-in customer logic to allow accessed by outlet admin only when within the same outlet

---

## Worker

- [x] Get the list of available orders for each worker station
- [x] Re-input item quantities before accepting an order (either create a conflict that requires outlet admin approval or automatically accept if there is no mismatch). Workers can accept multiple orders simultaneously.
- [x] Mark an order as completed and pass it to the next worker station (Status Page)
- [x] View completed order history

---

## Presigned URLs

- [x] Presigned URL creation

---

## Avatar Upload (From AI Playground)

Implementation Summary

1. Cloudinary Configuration (src/utils/cloudinary.ts)

- Upload middleware with 2MB limit
- Auto-resizes to max 500x500px
- Supports JPEG, PNG, WEBP
- Auto-deletes old avatars when uploading new ones

2. Routes (src/routes/authUser.routes.ts)

- POST /api/me/avatar - Upload avatar
- DELETE /api/me/avatar - Delete avatar

3. Controller Methods (src/controllers/authUser.controller.ts)

- uploadAvatar() - Handles file upload
- deleteAvatar() - Handles avatar deletion

4. Service Methods (src/services/authUser.services.ts)

- updateAvatar() - Updates user image and deletes old avatar from Cloudinary
- deleteAvatar() - Removes avatar from user and Cloudinary
  Next Steps

1. Configure Cloudinary Credentials
   Update your .env file with your Cloudinary credentials:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
2. Get Cloudinary Credentials
3. Go to cloudinary.com (https://cloudinary.com)
4. Create a free account (or login)
5. Copy your credentials from the Dashboard
   API Usage
   Upload Avatar:
   curl -X POST http://localhost:3000/api/me/avatar \
    -H "Cookie: access_token=your_token" \
    -F "avatar=@/path/to/image.jpg"
   Delete Avatar:
   curl -X DELETE http://localhost:3000/api/me/avatar \
    -H "Cookie: access_token=your_token"
   Response Format:
   {
   "success": true,
   "message": "Avatar uploaded successfully",
   "data": {
   "image": "https://res.cloudinary.com/..."
   }
   }
   Notes

- Images are stored in Cloudinary folder: avatars
- Old avatars are automatically deleted when replaced
- Max file size: 2MB
- Supported formats: JPEG, PNG, WEBP

---

## TODO

### Worker Schedule

- [x] use filter to fetch the list of worker schedule by outlet admin(/api/admin/schedule?query=xxx)
- [x] also add the a little info as total worker, total driver, total schedule, and on duty today when fetching the list of worker schedule by outlet admin (/api/admin/schedule)
- [x] add a support for pagination on endpoint (/api/admin/schedule)
- [x] new endpoint to fetch the worker with no schedule and support filtering (debounce used on front end) by admin outlet. custom query to get all the worker with no schedule.
- [x] Change the soft delete to permanently delete the shift because too much data and not really important
- [x] new endpoint to fetch all worker id with the same outlet id by outlet admin and sperate them by worker station and driver
- [x] new endpoint to fetch washing worker schedule or id by outlet admin (/api/admin/schedule/washing)
- [x] new endpoint to fetch ironing worker schedule or id by outlet admin (/api/admin/schedule/ironing)
- [x] new endpoint to fetch packing worker schedule or id by outlet admin (/api/admin/schedule/packing)
- [x] new endpoint to fetch driver schedule or id by outlet admin (/api/admin/schedule/driver)
- [x] rework the payload of worker schedule update endpoint (/api/admin/schedule/:id)
- [x] Edit the schema so the schedule can also used for the driver not only to worker (by making worker station to optional)
- [x] make a utility to change local time (hours) to full utc time format for saving to db (prisma)
- [x] middleware to check if the worker and driver are on shift or not
- [x] all endpoint which return data make it as paginated format

### Mismatch Resolution

- [x] Admin approve/reject endpoint for mismatched items per station (PATCH /api/admin/mismatch/:id)
  - When approved: use admin's accepted quantity as the baseline, create StationSummary, mark OrderStationLog as "approved"
  - When rejected: mark OrderStationLog as "rejected" with admin_note, notify worker to re-input correctly
- [x] Fetch mismatch data for all stations (not just washing — currently `adminMissmatch.services.ts` only fetches washing station logs)
- [x] Create route and controller for mismatch resolution (currently only service exists, no route/controller)

### Payment

- [x] Customer app: upload payment proof (transfer screenshot) — POST /api/orders/:id/payment-proof
- [x] Admin: confirm/reject payment proof — PATCH /api/admin/orders/:id/payment-confirm
- [x] Payment gateway integration (Midtrans/Xendit) — POST /api/orders/:id/pay
- [x] When payment confirmed: set `order.paid = true`, `order.status` transitions from `waiting_for_payment` to `waiting_for_driver_deliver` (for customer_app) or stays for admin to mark delivered (for walk_in)
- [x] Payment webhook/callback endpoint for gateway notifications

### Delivery (Customer App Orders)

- [x] Auto-create delivery request after payment is confirmed — POST /api/delivery-requests
- [x] Driver: list available delivery requests — GET /api/delivery-requests
- [x] Driver: accept delivery request — POST /api/delivery-requests/:id/accept
- [x] Driver: progress delivery status (in_transit → on_delivery → done) — PATCH /api/delivery-requests/:id/next
- [x] Driver: view accepted/completed delivery jobs — GET /api/delivery-requests/accepted, GET /api/delivery-requests/completed
- [x] When delivery done: set order status to `delivered`, set `order.driver_delivery_id`

### Walk-in Pickup

- [x] Admin: mark walk-in order as picked up (delivered) after payment — PATCH /api/admin/orders/:orderId/deliver
- [x] This sets order status to `delivered` (walk-in customer picks up at outlet, no driver needed)

### Auto-close Timer

- [x] Scheduled background job (cron/interval) that runs every hour
- [x] Query all orders where `status = "delivered"` AND `paid = true` AND `delivered/picked up at` was 24h+ ago
- [x] Transition those orders to `finished` status
- [x] Apply to both `customer_app` and `walk_in` source orders
- [x] Store a `delivered_at` timestamp on the Order model (currently not in schema — add via Prisma migration)

### Order Completion

- [x] `finished` status handling — order is read-only, no further modifications allowed
- [ ] Order detail view for customer showing full lifecycle (pickup → wash → iron → pack → payment → delivery → finished)
- [x] Order completion notification to customer (email/in-app) when status reaches `finished`

---

### Notes

- - Login required
- \*\* Specified role required

### Order Lifecycle Reference

```
CUSTOMER APP:
  waiting_for_driver_pickup → in_transit_to_outlet → arrived_at_outlet
    → washing_in_progress → ironing_in_progress → packing_in_progrees
    → waiting_for_payment → (paid) → out_for_delivery → delivered → finished

WALK-IN:
  washing_in_progress → ironing_in_progress → packing_in_progrees
    → waiting_for_payment → (paid) → delivered (picked up) → finished

Auto-close: delivered + paid → 24h timer → finished
```
