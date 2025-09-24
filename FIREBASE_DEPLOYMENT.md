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
npm run build
```

### 3. Deploy to Firebase
```bash
# Deploy everything
npm run deploy

# Or deploy individually
npm run deploy:hosting    # Deploy frontend
npm run deploy:functions  # Deploy backend functions
npm run deploy:firestore  # Deploy Firestore rules
```

### 4. Set up Sample Data
After deployment, you can add sample jobs by calling:
```
https://your-project-id.cloudfunctions.net/addSampleJobs
```

## Local Development

### 1. Start Development Environment
```bash
# Start both frontend and functions emulators
npm run dev

# Or start individually
npm run dev:frontend    # Start React frontend
npm run dev:functions   # Start Firebase emulators
```

### 2. Start Firebase Emulators Only
```bash
npm run emulators
```

This will start:
- Functions emulator on port 5001
- Firestore emulator on port 8080
- Hosting emulator on port 5000

### 3. Update Environment Variables
For local development, update the API URL in `frontend/src/services/jobService.ts`:
```typescript
const API_URL = 'http://localhost:5001/your-project-id/us-central1/api/jobs';
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
job-seeker/
├── .firebaserc              # Firebase project configuration
├── firebase.json            # Firebase services configuration  
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── package.json            # Root package with helper scripts
├── functions/              # Firebase Functions (your backend)
│   ├── index.js           # API endpoints and business logic
│   ├── package.json       # Functions dependencies
│   └── .eslintrc.js      # Linting configuration
└── frontend/              # React application
    ├── src/               # React source code
    ├── public/           # Static files
    ├── package.json      # Frontend dependencies  
    └── build/           # Built files (generated)
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
