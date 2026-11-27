# Admin Login Guide

## How admin access works

There is no admin sign-up and no admin access code. Admin is a role stored
on the user's Firestore document, and it can only be granted by someone who
is already an admin — or by creating an `admins/{uid}` document directly in
the Firebase console.

The app reads the role from Firestore on every sign-in. A role saved in the
browser (localStorage) is ignored.

## Granting admin access

### Method 1: Promote from the Admin Panel (recommended)

1. Sign in as an existing admin.
2. Open the Admin Panel → Users tab.
3. Use the promote action on the user you want to make an admin.

Their user document's `role` becomes `admin`, and the Admin Panel and
`/admin` route will recognise them on their next sign-in.

### Method 2: Firebase console (first admin / bootstrap)

Use this to create the very first admin, when nobody can promote yet:

1. Go to Firebase Console → Authentication and copy the user's UID.
2. Go to Firestore Database → `admins` collection.
3. Create a document with ID = the user's UID, for example:

```javascript
{
  createdAt: "2025-01-01T00:00:00.000Z",
  createdBy: "console"
}
```

Alternatively, set `role: "admin"` on the user's document in the `users`
collection. Either one grants admin access.

4. Ask the user to sign out and sign back in.

## Accessing the Admin Panel

Once signed in as an admin:

1. Navigate to `/admin` or click "Admin Panel" in the header.
2. You will see the admin dashboard with:
   - User management
   - Job management
   - Statistics and reports
   - Greenhouse integration
   - Settings

## Troubleshooting

### "Access Denied" error

If you see "Access Denied":

- Check the user's document in the `users` collection: `role` must be
  `"admin"`, or an `admins/{uid}` document must exist.
- Sign out and sign back in so the role is re-read from Firestore.
- Do not edit localStorage — the app ignores it.

### Can't see the Admin Panel link

- Confirm the signed-in account actually has the admin role (see above).
- Clear browser cache and cookies, then sign in again.
- Check the browser console for errors.

### Role not updating

- Sign out and sign back in.
- Verify the Firestore user document's `role` field.

## Security notes

- Never share admin credentials, and never put an admin code or password in
  the codebase or in documentation. (A hardcoded admin code used to exist
  in this project; it was removed in Phase 1.)
- Admin actions are enforced server-side: the API checks the caller's
  Firebase ID token, and Firestore rules only allow admins to change roles
  or delete users.
- Review the `admins` collection and the list of users with `role: "admin"`
  regularly.
