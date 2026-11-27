# Admin Login Guide

This guide explains how to set up and use the admin panel. **The first admin must be set up in the Firebase console before deploying** — otherwise nobody can reach `/admin`.

## Why the first admin is set up in the console

The admin role is read from the Firestore user document (`users/{uid}.role == 'admin'`). There is no admin code, no admin sign-up form, and no self-promotion path: the old hardcoded admin code (`ADMIN2024`) was removed in Phase 1 because anyone who knew it could make themselves an admin.

The only way in is for someone who already has access to the Firebase console to mark an account as admin. After that, that admin can promote other users from the admin panel itself.

## Setting up the first admin

### Option A — change the role in the Firestore console (recommended)

1. Go to the [Firebase console](https://console.firebase.google.com/) and open the `job-seeker-80fd8` project.
2. Open **Firestore Database → Data → users**.
3. Find the document for your account (the document ID is your Firebase Auth uid).
4. Change the `role` field from `jobseeker` or `employer` to `admin` and save.
5. Sign out and sign back in (the role is read fresh on sign-in). Go to `/admin`.

### Option B — add an `admins/{uid}` document

1. In the Firestore console, create a collection called `admins` (if it does not exist).
2. Add a document whose ID is your Firebase Auth uid (any content, e.g. `{ "createdAt": "<today>" }`).
3. Sign out and sign back in, then go to `/admin`.

Option B is useful if the `users` document does not exist yet, or if you want to keep the admin list separate from user profiles. Both paths are checked by the API and the Firestore rules.

### The legacy admin email

`admin@jobseeker.com` is still treated as an admin as an interim fallback. This exists only so a deployment is not locked out before the first admin is set up. Once the first admin exists, change that email check out of `functions/index.js` and `firestore.rules` (search for `admin@jobseeker.com`).

## Accessing the Admin Panel

1. Sign in with the admin account.
2. Go to `/admin` (the link also appears in the header for admins).
3. The panel has four tabs:
   - **Users** — search users, change roles (jobseeker / employer / admin), delete users. You cannot delete your own account from here.
   - **Jobs** — search jobs, approve / reject / pending, delete jobs. Approving a job makes it active.
   - **Companies** — verify or unverify employers (see below).
   - **Reports** — user growth, employer growth, job posting counts, and a system-health panel. Note: the "API Response Time" (~120ms) and "Active Sessions" (24) figures in this tab are placeholders, not live measurements.
   - **Settings** — platform toggles (auto-approval, email notifications, maintenance mode). These toggles currently do not persist or change behaviour; they are placeholders for a later phase.

## Verifying an employer (company verification)

Phase 2 adds a minimal employer verification flow:

1. Go to **Admin Panel → Companies**.
2. Each row is one employer account, with the company name (from the company record created at employer sign-up) and its current verification state.
3. Click **Verify** to mark the company verified, or **Unverify** to remove it.

What verification does:

- A green **✓ Verified** badge appears next to the company name on the company profile page and on job listings for that employer's jobs.
- Nothing else changes: verification does not approve jobs, change permissions, or affect search ranking.

Rules:

- Only an admin can change `verified`. An employer who edits their own company record cannot set it — the Firestore rules reject any owner update that touches the `verified` field, and the API never sets it.
- If an employer signed up before company records existed (or signed up with Google, which creates no company record), they appear in the list as "No company record yet". Verifying them creates the company document with their name.
- Verification is reversible — Unverify removes the badge immediately.

## Troubleshooting

- **"You are redirected to the home page when you open /admin"** — the signed-in account is not an admin. Check the `role` field on your `users` document (Option A) or the `admins` collection (Option B), then sign out and back in.
- **"I changed the role but /admin still redirects me"** — the role is read on sign-in. Sign out and sign back in; a hard refresh alone is not enough.
- **"The Companies tab is empty"** — there are no accounts with role `employer` yet. Sign up a test employer account first.
