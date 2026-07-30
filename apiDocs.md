# I-Wash-Noda API Documentation

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [User Authentication](#user-authentication)
- [User Management](#user-management)
- [Addresses](#addresses)
- [Outlets & Items](#outlets--items)
- [Admin](#admin)
- [Worker Shifts](#worker-shifts)
- [Pickup Requests](#pickup-requests)
- [Pickup Orders](#pickup-orders)
- [Admin Orders](#admin-orders)
- [Error Responses](#error-responses)

---

## Introduction

Base URL: `http://localhost:3000/api`

This API provides endpoints for a laundry service application with features including user authentication, address management, outlet coverage, pickup requests, and order management.

### Swagger Documentation

Interactive API documentation is available at: `http://localhost:3000/docs`

---

## Authentication

### Authentication Methods

1. **JWT Cookies** - Access and refresh tokens stored in HTTP-only cookies
   - `access_token` - Expires in 30 minutes
   - `refresh_token` - Expires in 7 days

2. **Better Auth** - Social login authentication (Google, etc.)

### Required Roles

| Role           | Description               |
| -------------- | ------------------------- |
| `super_admin`  | Full system access        |
| `outlet_admin` | Outlet-level admin access |
| `driver`       | Delivery driver           |
| `customer`     | Regular user              |

### Authentication Middleware

Most endpoints require authentication via `access_token` cookie. Include credentials with requests:

```javascript
fetch("https://api.example.com/endpoint", {
  credentials: "include",
});
```

---

## User Authentication

### Endpoints

| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| POST   | `/register`             | Register new user (step 1)     |
| POST   | `/verify`               | Verify email with OTP (step 2) |
| POST   | `/complete-register`    | Complete registration (step 3) |
| POST   | `/resend`               | Resend verification OTP        |
| POST   | `/login`                | Login with email/password      |
| GET    | `/logout`               | Logout user                    |
| GET    | `/refresh`              | Refresh access token           |
| POST   | `/reset-request`        | Request password reset         |
| POST   | `/reset-confirm`        | Confirm new password           |
| GET    | `/me`                   | Get current user               |
| PUT    | `/me`                   | Update current user            |
| POST   | `/change-email-request` | Request email change           |
| PUT    | `/change-email`         | Confirm new email              |

---

### 1. Register User (Step 1)

Register a new user account.

**Endpoint:** `POST /register`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (201 Created):**

```json
{
  "message": "User registered. Verification email sent.",
  "email verified": false
}
```

---

### 2. Verify Email (Step 2)

Verify user's email with OTP token.

**Endpoint:** `POST /verify`

**Authentication:** Required (temp_jwt cookie from step 1)

**Request Body:**

```json
{
  "token": "123456"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 3. Complete Registration (Step 3)

Complete user registration with profile details.

**Endpoint:** `POST /complete-register`

**Authentication:** Required (temp_jwt cookie from step 2)

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "email verified": true,
  "role": "customer",
  "created at": "Jan 1, 2025 10:00"
}
```

---

### 4. Resend Verification OTP

Resend verification email with new OTP.

**Endpoint:** `POST /resend`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Verification email resent successfully"
}
```

---

### 5. Login

Login with email and password.

**Endpoint:** `POST /login`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful"
}
```

**Cookies Set:**

- `access_token` - JWT access token (30 min)
- `refresh_token` - JWT refresh token (7 days)

---

### 6. Logout

Logout current user.

**Endpoint:** `GET /logout`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 7. Refresh Token

Refresh expired access token.

**Endpoint:** `GET /refresh`

**Authentication:** Required (valid refresh_token cookie)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Access token refreshed! and Refresh token updated!"
}
```

---

### 8. Password Reset Request

Request password reset email.

**Endpoint:** `POST /reset-request`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 9. Confirm Password Reset

Confirm new password after reset request.

**Endpoint:** `POST /reset-confirm`

**Authentication:** Required (temp_jwt cookie from reset request)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "newSecurePassword123",
  "token": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 10. Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /me`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User fetched successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "customer",
    "emailVerified": true,
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

---

### 11. Update Current User

Update authenticated user's profile.

**Endpoint:** `PUT /me`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1987654321"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User updated",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Updated",
    "phone": "+1987654321",
    "role": "customer"
  }
}
```

---

### 12. Email Change Request

Request to change email address.

**Endpoint:** `POST /change-email-request`

**Authentication:** Required

**Request Body:**

```json
{
  "email": "newemail@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Verification email sent to new email"
}
```

---

### 13. Confirm Email Change

Confirm email change with verification token.

**Endpoint:** `PUT /change-email`

**Authentication:** Required (temp_jwt cookie + access_token)

**Request Body:**

```json
{
  "email": "newemail@example.com",
  "token": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Email updated successfully",
  "user": {
    "id": "uuid",
    "email": "newemail@example.com",
    "name": "John Doe"
  }
}
```

---

## User Management

### Endpoints

| Method | Endpoint     | Description     |
| ------ | ------------ | --------------- |
| GET    | `/users`     | List all users  |
| GET    | `/users/:id` | Get user by ID  |
| POST   | `/users`     | Create new user |
| PUT    | `/users/:id` | Update user     |
| DELETE | `/users/:id` | Delete user     |

---

### 1. List All Users

Get all users in the system.

**Endpoint:** `GET /users`

**Authentication:** Not required

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]
```

---

### 2. Get User by ID

Get a specific user by ID.

**Endpoint:** `GET /users/:id`

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (404 Not Found):**

```json
{
  "message": "User not found"
}
```

---

### 3. Create User

Create a new user.

**Endpoint:** `POST /users`

**Authentication:** Not required

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

### 4. Update User

Update an existing user.

**Endpoint:** `PUT /users/:id`

**Authentication:** Not required

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "updated@example.com"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "John Updated",
  "email": "updated@example.com"
}
```

---

### 5. Delete User

Delete a user.

**Endpoint:** `DELETE /users/:id`

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "message": "User deleted"
}
```

---

## Addresses

Manage user addresses.

### Endpoints

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/addresses`                 | Get all user addresses |
| POST   | `/addresses`                 | Create new address     |
| PUT    | `/addresses/:id`             | Update address         |
| DELETE | `/addresses/:id`             | Delete address         |
| POST   | `/addresses/:id/set-default` | Set default address    |

---

### 1. Get All Addresses

Get all addresses for authenticated user.

**Endpoint:** `GET /addresses`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Addresses fetched successfully",
  "data": [
    {
      "id": "uuid",
      "label": "Home",
      "address": "123 Main St",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12345",
      "lat": -6.2088,
      "lng": 106.8456,
      "isDefault": true
    },
    {
      "id": "uuid",
      "label": "Office",
      "address": "456 Business Ave",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12346",
      "lat": -6.209,
      "lng": 106.846,
      "isDefault": false
    }
  ]
}
```

---

### 2. Create Address

Create a new address for the user.

**Endpoint:** `POST /addresses`

**Authentication:** Required

**Request Body:**

```json
{
  "label": "Home",
  "address": "123 Main St",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "lat": -6.2088,
  "lng": 106.8456
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": "uuid",
    "label": "Home",
    "address": "123 Main St",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "12345",
    "lat": -6.2088,
    "lng": 106.8456,
    "isDefault": true
  }
}
```

---

### 3. Update Address

Update an existing address.

**Endpoint:** `PUT /addresses/:id`

**Authentication:** Required

**Request Body:**

```json
{
  "label": "Home Updated",
  "address": "789 New Street",
  "city": "Bandung",
  "province": "Jawa Barat"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "id": "uuid",
    "label": "Home Updated",
    "address": "789 New Street",
    "city": "Bandung",
    "province": "Jawa Barat"
  }
}
```

---

### 4. Delete Address

Delete an address.

**Endpoint:** `DELETE /addresses/:id`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### 5. Set Default Address

Set an address as the default.

**Endpoint:** `POST /addresses/:id/set-default`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Default address updated successfully",
  "data": {
    "id": "uuid",
    "label": "Home",
    "isDefault": true
  }
}
```

---

## Outlets & Items

Manage laundry outlets and service items.

### Endpoints

| Method | Endpoint            | Description             |
| ------ | ------------------- | ----------------------- |
| GET    | `/outlets-coverage` | Get outlets by location |
| GET    | `/outlets`          | List all outlets        |
| POST   | `/outlets`          | Create outlet           |
| PUT    | `/outlets/:id`      | Update outlet           |
| DELETE | `/outlets/:id`      | Delete outlet           |
| GET    | `/items`            | List all items          |
| POST   | `/items`            | Create item             |

---

### 1. Get Outlet Coverage

Get outlets within coverage area based on coordinates.

**Endpoint:** `GET /outlets-coverage?lat=-6.2088&lng=106.8456`

**Authentication:** Not required

**Query Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| lat       | number | Yes      | Latitude    |
| lng       | number | Yes      | Longitude   |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Outlet coverage fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "I-Wash Noda Jakarta Pusat",
      "address": "Jl. Sudirman No.123",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "lat": -6.2088,
      "lng": 106.8456,
      "coverageRadius": 5
    }
  ]
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "message": "At this moment there is no outlets in your area",
  "data": []
}
```

---

### 2. List All Outlets

Get all outlets.

**Endpoint:** `GET /outlets`

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Outlets fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "I-Wash Noda Jakarta Pusat",
      "address": "Jl. Sudirman No.123",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "lat": -6.2088,
      "lng": 106.8456
    },
    {
      "id": "uuid",
      "name": "I-Wash Noda Bandung",
      "address": "Jl. Braga No.45",
      "city": "Bandung",
      "province": "Jawa Barat",
      "lat": -6.9147,
      "lng": 107.6098
    }
  ]
}
```

---

### 3. Create Outlet

Create a new outlet.

**Endpoint:** `POST /outlets`

**Authentication:** Required (super_admin only)

**Request Body:**

```json
{
  "name": "I-Wash Noda Surabaya",
  "address": "Jl. Basin No.789",
  "city": "Surabaya",
  "province": "Jawa Timur",
  "lat": -7.2575,
  "lng": 112.7521,
  "coverageRadius": 5
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Outlet created successfully",
  "data": {
    "id": "uuid",
    "name": "I-Wash Noda Surabaya",
    "address": "Jl. Basin No.789",
    "city": "Surabaya",
    "province": "Jawa Timur"
  }
}
```

---

### 4. Update Outlet

Update an existing outlet.

**Endpoint:** `PUT /outlets/:id`

**Authentication:** Required (super_admin only)

**Request Body:**

```json
{
  "name": "I-Wash Noda Surabaya - Updated",
  "address": "Jl. New Address No.100",
  "coverageRadius": 10
}
```

**Response (200 OK):**

```json
{
  "status": true,
  "message": "Outlet updated successfully",
  "data": {
    "id": "uuid",
    "name": "I-Wash Noda Surabaya - Updated"
  }
}
```

---

### 5. Delete Outlet

Delete an outlet.

**Endpoint:** `DELETE /outlets/:id`

**Authentication:** Required (super_admin only)

**Response (200 OK):**

```json
{
  "status": true,
  "message": "Outlet deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

---

### 6. List All Items

Get all service items (laundry services).

**Endpoint:** `GET /items`

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Cuci Kering",
      "pricePerKg": 8000
    },
    {
      "id": "uuid",
      "name": "Cuci Setrika",
      "pricePerKg": 12000
    },
    {
      "id": "uuid",
      "name": "Setrika",
      "pricePerKg": 6000
    }
  ]
}
```

---

### 7. Create Item

Create a new service item.

**Endpoint:** `POST /items`

**Authentication:** Required (super_admin only)

**Request Body:**

```json
{
  "name": "Cuci Karpet",
  "pricePerKg": 15000
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "uuid",
    "name": "Cuci Karpet",
    "pricePerKg": 15000
  }
}
```

---

## Admin

Admin endpoints for internal user management.

### Endpoints

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| POST   | `/admin/register` | Register internal user |
| GET    | `/admin/users`    | List all users         |
| PUT    | `/admin/users`    | Change user role       |
| DELETE | `/admin/users`    | Remove user            |

---

### 1. Register Internal User

Register a new internal user (staff/admin).

**Endpoint:** `POST /admin/register`

**Authentication:** Required (super_admin, outlet_admin)

**Request Body:**

```json
{
  "email": "staff@example.com",
  "role": "driver",
  "outlet_id": "uuid-of-outlet"
}
```

**Response (201 Created):**

```json
{
  "message": "driver User registered. Verification email sent.",
  "role": "driver",
  "email verified": false
}
```

---

### 2. List All Users

Get all users in the system (admin view).

**Endpoint:** `GET /admin/users`

**Authentication:** Required (super_admin, outlet_admin)

**Response (200 OK):**

```json
{
  "message": "User fetched successfully",
  "data": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "super_admin",
      "outletId": null
    },
    {
      "id": "uuid",
      "email": "driver@example.com",
      "role": "driver",
      "outletId": "uuid"
    }
  ]
}
```

---

### 3. Change User Role

Change a user's role.

**Endpoint:** `PUT /admin/users`

**Authentication:** Required (super_admin, outlet_admin)

**Request Body:**

```json
{
  "userId": "uuid-of-user",
  "role": "outlet_admin"
}
```

**Response (200 OK):**

```json
{
  "message": "Role changed successfully",
  "data": {
    "id": "uuid",
    "role": "outlet_admin"
  }
}
```

---

### 4. Remove User

Delete/remove a user from the system.

**Endpoint:** `DELETE /admin/users`

**Authentication:** Required (super_admin, outlet_admin)

**Request Body:**

```json
{
  "userId": "uuid-of-user"
}
```

**Response (200 OK):**

```json
{
  "message": "User removed successfully",
  "data": {
    "id": "uuid"
  }
}
```

---

## Worker Shifts

Manage worker schedules and shifts.

### Endpoints

| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| POST   | `/admin/schedule`     | Create/update weekly schedule |
| GET    | `/admin/schedule/:id` | Get schedule by worker ID     |

---

### 1. Create/Update Schedule

Create or update a worker's weekly schedule.

**Endpoint:** `POST /admin/schedule`

**Authentication:** Required

**Request Body:**

```json
{
  "outletId": "uuid-of-outlet",
  "workerId": "uuid-of-worker",
  "station": "WASHING",
  "schedules": [
    {
      "day": "MONDAY",
      "start": "08:00",
      "end": "16:00"
    },
    {
      "day": "TUESDAY",
      "start": "08:00",
      "end": "16:00"
    },
    {
      "day": "WEDNESDAY",
      "start": "08:00",
      "end": "16:00"
    },
    {
      "day": "THURSDAY",
      "start": "08:00",
      "end": "16:00"
    },
    {
      "day": "FRIDAY",
      "start": "08:00",
      "end": "16:00"
    }
  ]
}
```

**Notes:**

- `station` values: `WASHING`, `IRONING`, `DRYING`, `PACKING`
- `day` values: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
- Time format: `HH:mm` (24-hour)

**Response (200 OK):**

```json
{
  "message": "Worker weekly schedule saved"
}
```

---

### 2. Get Schedule by Worker ID

Get a worker's schedule.

**Endpoint:** `GET /admin/schedule/:id`

**Authentication:** Not required

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "workerId": "uuid",
    "outletId": "uuid",
    "station": "WASHING",
    "day": "MONDAY",
    "startTime": "08:00",
    "endTime": "16:00"
  }
]
```

**Response (404 Not Found):**

```json
{
  "message": "Schedule not found"
}
```

---

## Pickup Requests

Customer pickup request management.

### Endpoints

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/check/pickup-request` | Check address coverage |
| POST   | `/pickup-request`       | Create pickup request  |

---

### 1. Check Address Coverage

Check if user's address is within outlet coverage area.

**Endpoint:** `GET /check/pickup-request`

**Authentication:** Required (customer)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Address checked successfully",
  "data": {
    "hasAddress": true,
    "withinCoverage": true,
    "availableOutlets": [
      {
        "id": "uuid",
        "name": "I-Wash Noda Jakarta Pusat",
        "address": "Jl. Sudirman No.123"
      }
    ]
  }
}
```

---

### 2. Create Pickup Request

Create a new pickup request.

**Endpoint:** `POST /pickup-request`

**Authentication:** Required (customer)

**Request Body:**

```json
{
  "addressId": "uuid-of-address",
  "outletId": "uuid-of-outlet"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Pickup request created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "addressId": "uuid",
    "outletId": "uuid",
    "status": "PENDING",
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

---

## Pickup Orders

Driver pickup order management.

### Endpoints

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| GET    | `/pickup-request`            | Get all pickup requests |
| POST   | `/pickup-request/:id/accept` | Accept pickup request   |
| GET    | `/pickup-request/jobs`       | Get accepted jobs       |
| PUT    | `/pickup-request/:id/status` | Update job status       |

---

### 1. Get All Pickup Requests

Get all available pickup requests for driver's outlet.

**Endpoint:** `GET /pickup-request`

**Authentication:** Required (driver)

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Pickup requests fetched successfully",
  "pickupRequests": [
    {
      "id": "uuid",
      "userId": "uuid",
      "addressId": "uuid",
      "outletId": "uuid",
      "status": "PENDING",
      "createdAt": "2025-01-01T10:00:00Z",
      "address": {
        "label": "Home",
        "address": "123 Main St",
        "city": "Jakarta"
      }
    }
  ]
}
```

---

### 2. Accept Pickup Request

Driver accepts a pickup request.

**Endpoint:** `POST /pickup-request/:id/accept`

**Authentication:** Required (driver)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Pickup request accepted successfully",
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "driverId": "uuid"
  }
}
```

---

### 3. Get Accepted Jobs

Get all accepted pickup requests (jobs) for the driver.

**Endpoint:** `GET /pickup-request/jobs`

**Authentication:** Required (driver)

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Pickup requests fetched successfully",
  "result": [
    {
      "id": "uuid",
      "userId": "uuid",
      "addressId": "uuid",
      "status": "ACCEPTED",
      "driverId": "uuid",
      "createdAt": "2025-01-01T10:00:00Z",
      "address": {
        "label": "Home",
        "address": "123 Main St",
        "city": "Jakarta"
      }
    }
  ]
}
```

---

### 4. Update Job Status

Update the status of a pickup request.

**Endpoint:** `PUT /pickup-request/:id/status`

**Authentication:** Required (driver)

**Request Body:**

```json
{
  "status": "PICKED_UP"
}
```

**Status Values:**

- `PENDING` - Request created, waiting for driver
- `ACCEPTED` - Driver accepted the request
- `PICKED_UP` - Driver picked up the laundry
- `IN_PROGRESS` - Laundry being processed
- `COMPLETED` - Order completed
- `CANCELLED` - Order cancelled

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Job status updated successfully",
  "result": {
    "id": "uuid",
    "status": "PICKED_UP"
  }
}
```

---

## Admin Orders

Create orders from pickup requests.

### Endpoints

| Method | Endpoint     | Description                      |
| ------ | ------------ | -------------------------------- |
| PUT    | `/order/:id` | Create order from pickup request |

---

### 1. Create Order

Create an order from an accepted pickup request.

**Endpoint:** `PUT /order/:id`

**Authentication:** Required

**Request Body:**

```json
{
  "total_kilos": 5,
  "items": [
    {
      "id": "uuid-of-item",
      "quantity": 2
    },
    {
      "id": "uuid-of-item",
      "quantity": 3
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Order created",
  "order": {
    "id": "uuid",
    "pickupRequestId": "uuid",
    "outletId": "uuid",
    "totalKilos": 5,
    "totalPrice": 85000,
    "items": [
      {
        "itemId": "uuid",
        "quantity": 2,
        "price": 16000
      },
      {
        "itemId": "uuid",
        "quantity": 3,
        "price": 36000
      }
    ],
    "status": "PROCESSING",
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Status Code | Description                          |
| ----------- | ------------------------------------ |
| 200         | Success                              |
| 201         | Created                              |
| 400         | Bad Request - Invalid input          |
| 401         | Unauthorized - Not authenticated     |
| 403         | Forbidden - Insufficient permissions |
| 404         | Not Found                            |
| 500         | Internal Server Error                |

### Example Error Responses

**400 - Bad Request:**

```json
{
  "success": false,
  "message": "Email required"
}
```

**401 - Unauthorized:**

```json
{
  "success": false,
  "message": "Unauthorized, login first"
}
```

**403 - Forbidden:**

```json
{
  "success": false,
  "message": "Forbidden, only super_admin can create outlet_admin"
}
```

**404 - Not Found:**

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. UUIDs are used for all ID fields
3. All protected endpoints require authentication via cookies
4. Rate limiting is applied to authentication endpoints
5. CORS is configured to allow requests from the frontend application

---

_Generated for I-Wash-Noda API_
