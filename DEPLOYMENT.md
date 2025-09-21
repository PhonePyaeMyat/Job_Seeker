# Vercel Deployment Guide

## 🚀 Deploy Your Job Seeker App to Vercel

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file and note these values:
   - `project_id`
   - `client_email`
   - `private_key`

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Your Repository:**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a React app

3. **Configure Build Settings:**
   - **Framework Preset**: Create React App
   - **Root Directory**: Leave as `./` (root)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install && cd frontend && npm install`

4. **Add Environment Variables:**
   - In Vercel dashboard, go to your project → Settings → Environment Variables
   - Add these variables:

   ```
   FIREBASE_PROJECT_ID = your-project-id-from-firebase
   FIREBASE_CLIENT_EMAIL = your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   REACT_APP_API_KEY = your-secret-api-key (optional, for job posting)
   ```

   **Important**: For `FIREBASE_PRIVATE_KEY`, copy the entire private key including the quotes and newlines.

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-app-name.vercel.app`

### Step 3: Test Your Deployment

1. Visit your deployed URL
2. Test the job search functionality
3. Try posting a new job (if you set up the API key)
4. Verify all features work correctly

### API Endpoints Available

Your deployed app will have these API endpoints:
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/[id]` - Get specific job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job

### Troubleshooting

**Build Fails:**
- Check that all environment variables are set correctly
- Ensure Firebase credentials are properly formatted
- Check the build logs in Vercel dashboard

**API Not Working:**
- Verify Firebase environment variables are set
- Check that your Firebase project has Firestore enabled
- Look at Vercel function logs in the dashboard

**CORS Issues:**
- The API functions are configured with CORS headers
- If you still have issues, check the network tab in browser dev tools

### Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## 🎉 You're Done!

Your full-stack job seeker application is now live on Vercel with:
- ✅ React frontend
- ✅ Serverless API functions
- ✅ Firebase Firestore database
- ✅ Automatic HTTPS
- ✅ Global CDN
