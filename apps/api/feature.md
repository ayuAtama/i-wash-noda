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

## Pickup Requests to do a laundry user

- [x] Check if the user has address and filter out the outlets that out of coverage. And existing pickup requests (only one order allowed)\*\* (using raw query because it is faster than fitering it in server side)
- [x] Pickup request creation\*\*
- [x] Pickup request canceling before accepted by the driver\*\*

## Pickup Requests to do a laundry (driver)
- [x] Pickup request fetching added coords for the driver\*\*
- [x] Pickup request fetching list for the driver\*\*
- [x] Accepting Pickup request by the driver\*\*
- [x] Update the status of the pickup request by the driver (same outlet)\*\*
- [?] Fetching all accepted pickup requests for the driver (not picked up yet)\*\*

## Pickup Orders

- [ ] Pickup order creation
- [ ] Pickup order deletion
- [ ] Pickup order updating

## Admin Orders

- [ ] Admin order creation
- [ ] Admin order deletion
- [ ] Admin order updating

## Presigned URLs

- [x] Presigned URL creation

\*: Login required
\*\*: Specified role required
