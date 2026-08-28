# Front End Site Map

Setup Pages

1. isSuperAdmin === true
   => Redict to /
   else
   => Can create one super admin account

No Roles Pages
Homepage

1. NavBar (logo, nav link etc)
2. Hero Section
3. Map that showing the outlet, but there's button for asking permission to access location (for the firs time) and then showing the marking of the outlet on that map. can be hovered to see more details of that outlet (/api/outlets)
4. how the application works
5. CTA
6. Footer

Register Page (multi step form) (self registeration)

1. email input form (to get email 6 digit token or use link password)
2. verify email with 6 digit token (resend button to get new token)
3. complete the registration (email, name, password)
4. redirect to homepage

Login Page (refresh to update access token and refresh token)

1. Email and password for JWT authentication
2. Github, Google, and X (twitter) for social login/register (using better auth)
3. Forget password
4. Create new Account

Forget Password Page (multi step form) (check backend [only support hashed token])

1. email input form (to get email link password)
2. verify email or put 6 digit token. from this [http://localhost:3001/reset-password?token=6196290157818ec532aa2136d61bd09c2e3b5917e1dfec755d2ce743b16fc7b0](http://localhost:3001/reset-password?token=6196290157818ec532aa2136d61bd09c2e3b5917e1dfec755d2ce743b16fc7b0) (not implemented (backend))
3. new password and reinput password form. (/api/reset-password-confirm) body (email, password, token(hashed token))

CUSTOMER ROLE PAGES

Pickup Request Pages

1. Multi form wizard (Select address/create if empty -> choose outlet (based on location) -> Preview (show fee of pickup & delivery) and give litlle note that the price can't be shown, and will be shown the total amount when it is done already on outlet and counted the item by admin). Showing the map and the list of outlet within on range (using /api/outlets/coverage?lat=&lng=)
2. Will be locked and give the button to active status order pages
3. Allow to make a request again if active order status > driver dalam perjalanan ke outlet

Active Status Order Pages

1. Show the status here and tracking here
2. show the button payment if the status = admin already counted the item / sedang dicuci
3. the customer can cancel the pickup request if the satatus not taken by the driver
4. if the status = delivered. then show the button to complete the order or the button to make a complaints
5. send the notification to customer via email / whatsapp via backend if status = waiting for payment (not yet implemented (backend))
6. send the notification if the payment success or failed? (not yet implemented (backend))
7. send the notification if the status = Driver dalam perjalanan antar to alert the customer (not yet implemented (backend))
8. send the notification to user if the order has been received and ask to complete the order (not yet implemented (backend))
9. show empty page and the button asking do you want to make a new order request?
10. Show the status paid or not on frontend to indicate the payment status for the customer.

Payment Pages

1. After click the button to make a payment on active status order page the user can select the payment method.
2. Show the payment method that the user choose
3. Show the total amount
4. Show the instruction how to make the payment
5. Cancel button to change the payment method
6. Done button to confirm the payment (redirect to active status order page)

History Order Pages

1. List of all the order
2. [orderID] page details
3. History metrics

Address Page

1. Crud address
2. pin point address for detailed lat and lng (learn on ai-slops)
3. set default address

Complaint Page

1. input form to put what the customer complaining
2. file form to upload the proof
3. button to submit the complaint

Profile Page (all user role)

1. info page
2. change email (request email change (new email input form) -> confirm email change (link url with otp token) -> logged in with new email) POST & PUT /api/change-email-confirm
3. change password (implemented but too abroad for now need more specific role(backend))
4. change info (name, phone number (to integration with whatsapp?))
5. info signined session (not implemented)
6. logout/ logout session
7. change profile image

SUPER ADMIN ROLE PAGES

1. CRUD outlet Page
2. CRUD item of laundry Page
3. CRUD the Admin_Outlet, Driver, and Worker account Page.
4. Profile Page
5. Scheduling Page

OUTLET ADMIN ROLE PAGES

1. CRUD scheduling driver and worker Page
2. CRUD the Driver, and Worker account Page.
3. Counting the item and weight the laundry Page
4. CRUD the customer who walk-in Page
5. manual create the walk-in customer order Page
6. Fetch all the mismatch item order Page.
7. Handling mismatch order Page
8. Fetch all the unhandled payment proof Page
9. Handling the manual payment proof Page
10. Fetch the all complaint Page
11. Handling the complaint Page
12. Profile Page

DRIVER ROLE PAGES

1. Fetch all available pickup requests for the driver Page
2. Active pickup requests list (can update the status here, and done the job) Page
3. Detailed if clicked on slug of the active pickup request [not implemented (backend) yet] (can update the status here done the job here too). can click to gmaps apps if don't know the address location. SLUG Page
4. check history of pickup requests Page
5. Check delivery requests Page
6. check active delivery requests Page (can update the status here)
7. check detailed of the delivery request Page (not implemented (backend) yet)
8. check history of delivery requests Page

WORKER ROLE PAGES (washing, ironing, and packing)

1. available jobs for the worker Page (accept the job)
2. active jobs for the worker Page (can update status from here)
3. Re-input the item quantity Page
4. History Jobs Page
5.

TODO: (backend)

- change password (on PUT /api/me but too abroad for now need more specific role)
- admin registrationing driver, worker, and admin_outlet (POST /api/admin/register) sending email to the user
- user verified the account created by admin (POST /api/verify) params (token, userId)
- customer [orderID] page details API
- use middlewere for worker and driver to check if they have schedule or not
