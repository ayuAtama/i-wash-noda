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

- [ ] Address creation
- [ ] Address deletion
- [ ] Address updating

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
