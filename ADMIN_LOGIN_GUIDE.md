# Admin Login Guide

## How to Access the Admin Panel

### Method 1: Sign Up as Admin (Recommended for New Users)

1. **Go to the Sign Up page**
   - Navigate to `/signup` in your browser

2. **Fill in the registration form:**
   - Email: Use `admin@jobseeker.com` or your preferred admin email
   - Password: Create a secure password
   - **Role Selection**: Select **"Admin"**
   - **Admin Access Code**: Enter `ADMIN2024`
   - Click "Sign Up"

3. **After signup**, you'll be automatically logged in as admin

### Method 2: Update Existing User to Admin

If you already have an account and want to make it an admin:

1. **Login to your account** with your existing credentials
2. **Go to Firebase Console** → Firestore Database
3. **Find your user document** in the `users` collection
4. **Update these fields:**
   ```javascript
   {
     email: "your-email@example.com",  // Your email
     role: "admin",                     // Set role to admin
     displayName: "Admin"               // Set display name (optional)
   }
   ```
5. **Update localStorage in browser:**
   - Open browser console (F12)
   - Run: `localStorage.setItem('role', 'admin')`
6. **Refresh the page**

### Method 3: Direct Firebase Console (Advanced)

1. **Go to Firebase Console** → Authentication
2. **Add a new user** with email `admin@jobseeker.com`
3. **Go to Firestore** → Create a document in `users` collection with ID = user's UID
4. **Add these fields:**
   ```javascript
   {
     email: "admin@jobseeker.com",
     displayName: "Admin",
     role: "admin",
     createdAt: "2024-01-01T00:00:00.000Z",
     updatedAt: "2024-01-01T00:00:00.000Z"
   }
   ```
5. **Login** with the credentials you set in Firebase Console

---

## Admin Detection Logic

The app checks for admin access in two ways:

1. **Email check**: `user.email === 'admin@jobseeker.com'`
2. **Display name check**: `user.displayName === 'admin'`

**Note**: Either condition being true grants admin access.

---

## Accessing the Admin Panel

Once you're logged in as admin:

1. Navigate to `/admin` or click "Admin Panel" in the header
2. You'll see the admin dashboard with:
   - User management
   - Job management
   - Statistics and reports
   - Greenhouse integration
   - Settings

---

## Troubleshooting

### "Access Denied" Error

If you see "Access Denied":
- Make sure your email OR display name matches admin criteria
- Check localStorage: `localStorage.getItem('role')` should be `'admin'`
- Verify your Firestore user document has `role: "admin"`

### Can't See Admin Panel Link

- Clear browser cache and cookies
- Logout and login again
- Check browser console for errors

### Role Not Updating

- Refresh the page
- Check localStorage: `localStorage.setItem('role', 'admin')`
- Check Firestore user document role field

---

## Security Notes

⚠️ **Important**: 
- The admin code `ADMIN2024` should be changed in production
- Store admin credentials securely
- Consider implementing more robust admin authentication
- Use Firebase Admin SDK for server-side admin operations

---

## Quick Test

To quickly verify you have admin access:

```javascript
// Run in browser console
console.log('Email:', auth.currentUser?.email);
console.log('Display Name:', auth.currentUser?.displayName);
console.log('Role:', localStorage.getItem('role'));

// Check admin status
const isAdmin = auth.currentUser?.email === 'admin@jobseeker.com' || 
                auth.currentUser?.displayName === 'admin';
console.log('Is Admin:', isAdmin);
```

---

## Admin Features

Once logged in as admin, you can:
- ✅ View all users and their details
- ✅ Manage jobs (approve, reject, edit, delete)
- ✅ View statistics and reports
- ✅ Integrate with Greenhouse job board
- ✅ Manage system settings
- ✅ View and manage applications
