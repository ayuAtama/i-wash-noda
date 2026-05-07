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

bug:

- address not override the old default address (isdefaut is true, if created address and update address)
- address deletion is permanently deleted instead of soft delete

## Outlet Coverage

- [ ] Outlet creation
- [ ] Outlet deletion
- [ ] Outlet updating

## Pickup Requests

- [ ] Pickup request creation
- [ ] Pickup request deletion
- [ ] Pickup request updating

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
