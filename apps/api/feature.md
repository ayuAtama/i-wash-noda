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

- [x] Check whether the user has an address, filter out outlets outside the coverage area, and validate existing pickup requests (only one order allowed)** (using a raw query because it is faster than filtering on the server side)
- [x] Pickup request creation**
- [x] Cancel pickup request before it is accepted by the driver**
- [x] Check order status
- [x] Review pickup request validation and API responses more carefully

---

## Pickup Requests (Driver)

- [x] Fetch pickup requests with coordinates for the driver**
- [x] Fetch pickup request list for the driver**
- [x] Accept pickup requests**
- [x] Fetch all accepted pickup requests for the driver (WIP)**
- [x] Update pickup request status by the driver (same outlet)**
- [x] Update status progression by the driver using the `:id/next` endpoint**
- [x] Get all completed pickup requests for the driver**

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

- [] use filter to fetch the list of worker schedule by outlet admin(/api/admin/schedule?query=xxx)
- [] also add the a little info as total worker, total driver, total schedule, and on duty today when fetching the list of worker schedule by outlet admin (/api/admin/schedule)
- [] add a support for pagination on endpoint (/api/admin/schedule)
- [x] new endpoint to fetch the worker with no schedule and support filtering (debounce used on front end) by admin outlet. custom query to get all the worker with no schedule.

- [v] Change the soft delete to permanently delete the shift because too much data and not really important
- [ ] new endpoint to fetch all worker id with the same outlet id by outlet admin and sperate them by worker station and driver
- [ ] new endpoint to fetch washing worker schedule or id by outlet admin (/api/admin/schedule/washing)
- [ ] new endpoint to fetch ironing worker schedule or id by outlet admin (/api/admin/schedule/ironing)
- [ ] new endpoint to fetch packing worker schedule or id by outlet admin (/api/admin/schedule/packing)
- [ ] new endpoint to fetch driver schedule or id by outlet admin (/api/admin/schedule/driver)
- [ ] rework the payload of worker schedule update endpoint (/api/admin/schedule/:id)
- [x] Edit the schema so the schedule can also used for the driver not only to worker (by making worker station to optional)
- [x] make a utility to change local time (hours) to full utc time format for saving to db (prisma)
- [x] middleware to check if the worker and driver are on shift or not

---

### Notes

- * Login required
- ** Specified role required

