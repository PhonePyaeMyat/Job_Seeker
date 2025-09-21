# Firebase Deployment Guide

This guide will help you deploy your Job Seeker app to Firebase Hosting and Functions.

## Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize your project (if not already done):
```bash
firebase init
```

## Configuration

1. **Update Firebase Project ID**: 
   - Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID
   - Edit `frontend/src/services/jobService.ts` and replace `your-firebase-project-id` with your actual project ID

2. **Set up Firebase project**:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (if needed)
   - Enable Functions

## Deployment Steps

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

### 3. Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only hosting    # Deploy frontend
firebase deploy --only functions  # Deploy backend functions
```

### 4. Set up Sample Data
After deployment, you can add sample jobs by calling:
```
https://your-project-id.cloudfunctions.net/addSampleJobs
```

## Local Development

### 1. Start Firebase Emulators
```bash
firebase emulators:start
```

This will start:
- Functions emulator on port 5001
- Firestore emulator on port 8080
- Hosting emulator on port 5000

### 2. Update Environment Variables
For local development, update the API URL in `frontend/src/services/jobService.ts`:
```typescript
const API_URL = 'http://localhost:5001/your-project-id/us-central1/api/jobs';
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

## Environment Variables

Set these environment variables in Firebase Functions:

```bash
firebase functions:config:set app.api_key="your-secret-key"
```

## Firestore Rules

The app includes basic Firestore security rules in `firestore.rules`. Review and customize these rules for your needs.

## Troubleshooting

1. **Functions not deploying**: Make sure you have the correct Node.js version (18)
2. **Hosting issues**: Ensure the build directory exists (`frontend/build`)
3. **CORS errors**: Check that your frontend domain is allowed in the Functions CORS configuration

## Project Structure

```
├── functions/           # Firebase Functions (backend API)
├── frontend/           # React frontend app
├── firebase.json       # Firebase configuration
├── .firebaserc        # Firebase project settings
├── firestore.rules    # Firestore security rules
└── firestore.indexes.json # Firestore indexes
```

## API Endpoints

After deployment, your API will be available at:
- Production: `https://us-central1-your-project-id.cloudfunctions.net/api`
- Local: `http://localhost:5001/your-project-id/us-central1/api`

### Available Endpoints:
- `GET /jobs` - Get all jobs with pagination
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create new job
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job
- `GET /jobs/search` - Search jobs with filters
- `POST /jobs/:id/apply` - Apply to a job
