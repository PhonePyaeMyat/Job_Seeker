# Backend Setup Guide for Greenhouse Integration

## Overview

The Job Seeker app uses **Firestore directly** for most operations (job listings, search, etc.), which works without any backend. However, the **Greenhouse Integration** feature requires the backend API.

## Two Ways to Use the App

### ✅ Option 1: Without Backend (Current Setup)
- **What works:** Job listings, search, user management, basic features
- **What doesn't work:** Greenhouse sync, other API-dependent features
- **Setup:** No additional setup needed - everything works with Firestore

### ✅ Option 2: With Backend (For Greenhouse Integration)
- **What works:** Everything + Greenhouse sync and other backend features
- **Setup:** Start Firebase Functions emulator or deploy to production

## Running the Backend Locally

### Start Firebase Functions Emulator

```bash
# Navigate to project root
cd Job_Seeker

# Install dependencies (if not already done)
npm run install-all

# Start the Firebase emulators (includes Functions)
npm run dev:functions
```

The emulator will be available at:
- Functions: `http://127.0.0.1:5001/job-seeker-80fd8/us-central1/api`

### Test the Backend

```bash
# Test the jobs endpoint
curl http://127.0.0.1:5001/job-seeker-80fd8/us-central1/api/jobs

# Test Greenhouse sync endpoint
curl -X POST http://127.0.0.1:5001/job-seeker-80fd8/us-central1/api/jobs/sync-greenhouse \
  -H "Content-Type: application/json" \
  -d '{"boardToken":"exotec"}'
```

## Deploying to Production

### Deploy Functions

```bash
# Deploy only functions
npm run deploy:functions

# Or deploy everything
npm run deploy
```

After deployment, your API will be available at:
- `https://us-central1-job-seeker-80fd8.cloudfunctions.net/api`

Update the `API_BASE_URL` in `frontend/src/services/greenhouseService.ts` if needed.

## Troubleshooting

### Error: ERR_CONNECTION_REFUSED

**Symptom:** `Backend connection failed: AxiosError` in console

**Solution:** 
- This is OK if you're just using Firestore directly (most features work)
- If you need Greenhouse sync, start the Functions emulator: `npm run dev:functions`

### Error: Backend not available

**Symptom:** Greenhouse sync button shows "Backend Required" warning

**Solution:**
- In development: Run `npm run dev:functions`
- In production: Deploy functions with `npm run deploy:functions`

### The app works but Greenhouse sync doesn't

**Solution:**
1. Make sure the backend is running
2. Check the browser console for errors
3. Verify the API URL is correct in the network tab

## Current Configuration

### Development
- Frontend: `http://localhost:3000`
- Backend (if running): `http://127.0.0.1:5001`
- Firestore: Firebase Emulator or Production

### Production
- Frontend: Firebase Hosting URL
- Backend: `https://us-central1-job-seeker-80fd8.cloudfunctions.net/api`
- Firestore: Production database

## Verifying Backend Status

The app includes a `BackendStatus` component that:
- Checks Firestore connectivity (always needed)
- Optionally checks backend API (for Greenhouse integration)
- Shows errors only when there's a real problem

If you see "Backend Connection Error", the app can still work without the backend, but Greenhouse sync won't be available.

## Quick Start Commands

```bash
# Install everything
npm run install-all

# Start frontend only
npm run dev:frontend

# Start frontend + backend
npm run dev

# Start only backend (Functions emulator)
npm run dev:functions

# Build for production
npm run build

# Deploy everything
npm run deploy
```

## Summary

- **Most features work without backend** - using Firestore directly
- **Greenhouse integration requires backend** - start emulator or deploy
- **BackendStatus component** - helps diagnose connection issues
- **No impact on existing features** - backend is optional for most functionality
