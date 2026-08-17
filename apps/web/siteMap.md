
1. Home Page
2. Register
3. Login
4. Forgot-Password / reset password

Setup Page
1. isSuperAdmin === true
    => Redict to /
    else
    => Can create one super admin account

No Roles Pages 

Homepage 
1. NavBar (logo, nav link etc)
2. Hero Section
3. Map that showing the outlet, but there's button for asking permission to access location (for the firs time) and then showing the marking of the outlet on that map. can be hovered to see more details of that outlet
4. how the application works
5. CTA
6. Footer

Login Page
1. Email and password for JWT authentication
2. Github, Google, and X (twitter) for social login/register (using better auth)
3. Forget password
4. Create new Account

Forget Password Page
1. email input form (to get email link password)
2. new password and reinput password form. from this [http://localhost:3001/reset-password?token=6196290157818ec532aa2136d61bd09c2e3b5917e1dfec755d2ce743b16fc7b0](http://localhost:3001/reset-password?token=6196290157818ec532aa2136d61bd09c2e3b5917e1dfec755d2ce743b16fc7b0)

Customer Role Pages

Pickup Request Pages
1. Multi form wizard (Select address/create if empty -> choose outlet (based on location) -> Preview (show fee of pickup & delivery) and give litlle note that the price can't be shown and will be show fixed amount when already on outlet and counted the item by admin)
2. Will be locked and give the button to active status order pages
3. Allow to make a request again if active order status > driver dalam perjalanan ke outlet

Active Status Order Pages
1. Show the status here and tracking here
2. show the button payment if the status = admin already counted the item / sedang dicuci
3. send the notification to customer via email / whatsapp via backend if status = waiting for payment (not yet implemented (backend))
4. send the notification if the payment success or failed? (not yet implemented (backend))
5. send the notification if the status = Driver dalam perjalanan antar to alert the customer (not yet implemented (backend))
6. send the notification to user if the order has been received and ask to complete the order (not yet implemented (backend))
7. show empty page and the button asking do you want to make a new order request?

History Order Pages
1. List of all the order
2. [orderID] page details
3. History metrics

Address Page 
1. Crud address
2. pin point address for detailed lat and lng

Profile Page (all user role)
1. info page
2. change email
3. change password
4. change info
5. info signined session (not implemented)
6. logout/ logout session
7. change profile image
