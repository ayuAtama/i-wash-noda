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

- [ ] Get the list of available orders for each worker station
- [ ] Re-input item quantities before accepting an order (either create a conflict that requires outlet admin approval or automatically accept if there is no mismatch). Workers can accept multiple orders simultaneously.
- [ ] Mark an order as completed and pass it to the next worker station (Status Page)
- [ ] View completed order history

---

## Presigned URLs

- [x] Presigned URL creation

---

## Admin Schedule Management

- [x] Also add a little info (total worker, total driver, total schedule, and on duty today) when fetching the list of worker schedule by outlet admin (outlet_id) (`/api/admin/schedule`)
- [x] Use filter to fetch the list of worker schedule by outlet admin (`/api/admin/schedule?query=xxx`)
- [x] New endpoint to fetch workers with no schedule and support filtering (debounce used on front end) by admin outlet. Custom query to get all workers with no schedule.
- [x] Change the soft delete to permanently delete the shift because too much data and not really important
- [x] Rework the payload of worker schedule update endpoint (`/api/admin/schedule/:id`)
- [x] Edit the schema so the schedule can also be used for the driver, not only for workers (by making worker station optional)

---

## Utilities

- [x] Make a utility to change local time (hours) to full UTC time format for saving to DB (Prisma)

---

## Middleware

- [x] Middleware to check if the worker and driver are on shift or not

---

## TODO

- [x] change the user id in the request body into params (/api/admin/walk-in-customer/orders/:id)
- [] fetched data into descending order by date
- [] add a support for pagination on endpoint (/api/admin/schedule)
- [] Do all to endpoint that return data to be paginated
- [] Add a support for filtering for certain endpoints

---

### Notes

- \n required
- \*\* Specified role required
