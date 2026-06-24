# Feature Checklist

## Authentication

### Registration

- [x] Send OTP to Regristration Email
- [x] Email verification by link
- [x] Email verification by code
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

## Address Management

- [x] Address search\*
- [x] Address creation\*
- [x] Address updating\*
- [x] Address deletion\*
- [x] Address set default\*

## Outlet Coverage Management

- [x] Outlet coverage search by lat and lng
- [x] Outlet list all
- [x] Outlet creation\*\*
- [x] Outlet updating\*\*
- [x] Outlet deletion\*\*

## Laundry Item Management

- [x] Item list all
- [x] Item creation\*\*
- [x] Item updating\*\*
- [x] Item deletion\*\*
- [x] searchable item list by keyword | used in frontend to filter the item or create new one if not exist (using order endpoint by the outlet admin automatically)\*\*

## Pickup Requests to do a laundry user

- [x] Check if the user has address and filter out the outlets that out of coverage. And existing pickup requests (only one order allowed)\*\* (using raw query because it is faster than fitering it in server side)
- [x] Pickup request creation\*\*
- [x] Pickup request canceling before accepted by the driver\*\*
- [x] To check status order by the user

## Pickup Requests to do a laundry (driver)

- [x] Pickup request fetching added coords for the driver\*\*
- [x] Pickup request fetching list for the driver\*\*
- [x] Accepting Pickup request by the driver\*\*
- [x] Fetching all accepted pickup requests for the driver (WIP)\*\*
- [x] Update the status of the pickup request by the driver (same outlet)\*\*
- [x] Get all finished order (pickup request) by the driver\*\*

## TO DO

- [ ] Check more carfully about the validation to pickup request and api responses (so mess up)
- [ ] complete crud for the walk-in customer (update and delete)

## Admin Outlets Orders

- [x] create the data for the first user walk-in
- [x] endpoint to search the user walk-in used for debouncing berfore creating the order
- [x] create the order by the admin manually for the walk in customer
- [x] fetch all the orders that already on the outlet by the admin_outlet
- [x] Update the order's item quantity and status by the admin outlet from the driver.

## Worker

- [ ] Worker get all the list of the available order in each station
- [ ] Worker had to re-input quantity of the item before accepting the order (either conflict and need acc from outlet admin or auto accept if there is no missmatch)[worker can accept multiple orders at the same time]
- [ ] Worker get the button to mark the order as done and passed it to another worker station (Status Page)
- [ ] Worker get the past history of the order already done.

## Presigned URLs

- [x] Presigned URL creation

\*: Login required
\*\*: Specified role required
