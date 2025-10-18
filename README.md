# Job Seeker

A full-stack job search platform built with React.js (TypeScript), Firebase Functions, and Firebase Firestore. Features user authentication, job management, and role-based dashboards for job seekers, employers, and administrators.

## Features

### Core Functionality
- **User Authentication & Authorization** - Secure login/signup with Firebase Auth (email/password and Google OAuth)
- **Job Search & Filtering** - Search jobs by keyword, location, and type with pagination
- **Advanced Job Search** - Advanced filtering with multiple criteria (salary, experience, company, remote work, date posted)
- **Job Management** - Create, read, update, and delete job listings
- **Role-Based Dashboards** - Separate interfaces for job seekers, employers, and admin
- **Job Applications** - Apply to jobs with profile data or CV upload, track application status
- **Job Details** - Detailed job view with application functionality and company information
- **Job Recommendations** - AI-powered job recommendations based on user profile and preferences
- **Company Profiles** - Detailed company information and job listings
- **Admin Panel** - Administrative controls and system oversight
- **User Profiles** - Comprehensive profile management with role-specific fields
- **Job Saving** - Save jobs for later viewing and application
- **About Page** - Information about the platform
- **Contact Page** - Contact information and support
- **Privacy Policy** - Privacy policy and data handling
- **Terms of Service** - Terms and conditions

### User Experience
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Real-time Updates** - Live data synchronization with Firebase Firestore
- **Modern UI Components** - Reusable components with consistent styling
- **Error Handling** - Comprehensive error states and user feedback
- **Loading States** - Smooth loading indicators and transitions
- **Landing Page** - Professional landing page with featured jobs, company spotlight, and job alerts
- **Job Alerts** - Set up job alerts for specific criteria
- **Company Spotlight** - Featured companies with ratings and job counts
- **Salary Insights** - Industry salary information and trends
## Tech Stack

### Frontend
- **React.js 18.2.0** with TypeScript 4.9.5
- **React Router DOM v7.6.3** for client-side routing
- **Tailwind CSS v3.4.1** for styling and responsive design
- **React Firebase Hooks v5.1.1** for Firebase integration
- **Firebase SDK v11.10.0** for authentication and real-time data
- **Create React App v5.0.1** for build tooling
- **Axios v1.10.0** for HTTP requests

### Backend
- **Firebase Functions v4.5.0** (Node.js 18)
- **Express.js v4.18.2** for API routing
- **Firebase Admin SDK v11.10.1** for server-side Firestore operations
- **CORS v2.8.5** for cross-origin request handling

### Database & Infrastructure
- **Firebase Firestore** (NoSQL database)
- **Firebase Authentication** for user management
- **Firebase Hosting** for frontend deployment
- **Firebase Functions** for serverless backend API
- **Firebase Tools v12.0.0** for deployment and emulation
## Project Structure

```
Job_Seeker/
├── functions/                          # Firebase Functions (Backend API)
│   ├── index.js                       # Main functions file with Express routes
│   ├── package.json                   # Functions dependencies
│   ├── firebase-credentials.json     # Firebase service account
│   └── node_modules/                 # Functions dependencies
├── frontend/                          # React Frontend Application
│   ├── public/                       # Static assets
│   │   ├── index.html               # Main HTML template
│   │   └── manifest.json            # PWA manifest
│   ├── src/                         # Source code
│   │   ├── components/              # Reusable React components
│   │   │   ├── AdvancedJobSearch.tsx # Advanced job search with filters
│   │   │   ├── ApplicationModal.tsx  # Job application modal
│   │   │   ├── BackendStatus.tsx     # API connection status
│   │   │   ├── CompanyProfile.tsx    # Company profile display
│   │   │   ├── EmployerHome.tsx      # Employer dashboard home
│   │   │   ├── Footer.tsx            # Site footer
│   │   │   ├── Header.tsx            # Navigation header
│   │   │   ├── JobCard.tsx           # Individual job listing card
│   │   │   ├── JobDetails.tsx        # Detailed job view
│   │   │   ├── JobForm.tsx           # Job creation/editing form
│   │   │   ├── JobList.tsx           # Job listings container
│   │   │   ├── JobRecommendations.tsx # Job recommendations component
│   │   │   ├── JobSeekerHome.tsx     # Job seeker dashboard home
│   │   │   ├── LandingPage.tsx       # Main landing page
│   │   │   └── SaveJobButton.tsx     # Save job functionality
│   │   ├── pages/                   # Page components
│   │   │   ├── About.tsx           # About page
│   │   │   ├── AdminPanel.tsx      # Administrative interface
│   │   │   ├── Contact.tsx         # Contact page
│   │   │   ├── EmployerDashboard.tsx # Employer-specific dashboard
│   │   │   ├── JobSeekerDashboard.tsx # Job seeker dashboard
│   │   │   ├── Login.tsx           # User login page
│   │   │   ├── NotFound.tsx        # 404 error page
│   │   │   ├── Privacy.tsx         # Privacy policy page
│   │   │   ├── Profile.tsx         # User profile page
│   │   │   ├── ServerError.tsx     # 500 error page
│   │   │   ├── SignUp.tsx          # User registration page
│   │   │   └── Terms.tsx           # Terms of service page
│   │   ├── services/                # API services
│   │   │   └── jobService.ts       # Job-related API calls
│   │   ├── App.tsx                 # Main application component
│   │   ├── firebaseConfig.ts       # Firebase configuration
│   │   ├── index.css               # Global styles
│   │   └── index.tsx               # Application entry point
│   ├── build/                      # Production build output
│   ├── package.json                # Frontend dependencies
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── tsconfig.json               # TypeScript configuration
├── node_modules/                    # Root dependencies
├── firebase.json                    # Firebase project configuration
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json          # Database indexes
├── package.json                     # Root package.json with scripts
├── package-lock.json               # Dependency lock file
├── FIREBASE_DEPLOYMENT.md          # Deployment documentation
└── README.md                       # This file
```
## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Firebase account** and project
- **Firebase CLI** (`npm install -g firebase-tools`)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Configure Firebase:**
   - Update `.firebaserc` with your Firebase project ID
   - Update `frontend/src/firebaseConfig.ts` with your project configuration

3. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

For detailed setup instructions, see [FIREBASE_DEPLOYMENT.md](FIREBASE_DEPLOYMENT.md).

## Local Development

### Using Firebase Emulators

1. **Start Firebase emulators:**
   ```bash
   npm run emulators
   ```

2. **Start the frontend:**
   ```bash
   npm run dev:frontend
   ```

3. **Or start both together:**
   ```bash
   npm run dev
   ```

The app will run at `http://localhost:3000` with the backend API running on the Firebase Functions emulator at `http://localhost:5001`.

### Manual Backend Setup (Alternative)

If you prefer to run the backend separately:

1. **Start the backend server:**
   ```bash
   cd functions
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

The backend will run on `http://localhost:3001` and frontend on `http://localhost:3000`.

## Available Scripts

### Root Level Scripts
- `npm run install-all` - Install all dependencies (root, frontend, and functions)
- `npm run dev` - Start both frontend and functions in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:functions` - Start only the Firebase Functions emulator
- `npm run build` - Build the frontend for production
- `npm run deploy` - Deploy everything to Firebase
- `npm run deploy:hosting` - Deploy only the frontend to Firebase Hosting
- `npm run deploy:functions` - Deploy only the functions to Firebase Functions
- `npm run deploy:firestore` - Deploy only Firestore rules and indexes
- `npm run emulators` - Start all Firebase emulators
- `npm run emulators:functions` - Start only the Functions emulator
- `npm run emulators:firestore` - Start only the Firestore emulator
- `npm run lint` - Run ESLint on the functions code
- `npm run test` - Run frontend tests
- `npm run clean` - Clean all build artifacts and node_modules

### Frontend Scripts
- `npm start` - Start the React development server
- `npm run build` - Build the app for production
- `npm test` - Run the test suite
- `npm run eject` - Eject from Create React App (irreversible)

### Functions Scripts
- `npm run serve` - Start the Functions emulator
- `npm run shell` - Start the Functions shell
- `npm run deploy` - Deploy functions to Firebase
- `npm run logs` - View function logs
- `npm run lint` - Run ESLint
## API Endpoints

After deployment, your API will be available at:

- **Production:** `https://us-central1-your-project-id.cloudfunctions.net/api`
- **Local Development (Emulator):** `http://localhost:5001/your-project-id/us-central1/api`
- **Local Development (Manual):** `http://localhost:3001`

### Available Endpoints:

#### Job Management
- `GET /jobs` - Get all jobs with pagination and filtering
- `GET /jobs/:id` - Get specific job by ID
- `POST /jobs` - Create new job listing
- `PUT /jobs/:id` - Update existing job
- `DELETE /jobs/:id` - Delete job listing
- `GET /jobs/search` - Search jobs with advanced filters (keyword, location, type)

#### Job Applications
- `POST /jobs/:id/apply` - Apply to a job

#### Sample Data
- `GET /addSampleJobs` - Add sample job data to the database

All endpoints interact with Firebase Firestore collections and include proper CORS handling for cross-origin requests.

## Database Schema

### Firestore Collections

#### Jobs Collection (`/jobs/{jobId}`)
- **Read Access:** Public (anyone can browse jobs)
- **Write Access:** Authenticated users only
- **Fields:** 
  - `title` - Job title
  - `company` - Company name
  - `location` - Job location
  - `type` - Job type (FULL_TIME, PART_TIME, CONTRACT, REMOTE, INTERNSHIP)
  - `salary` - Salary range
  - `description` - Job description
  - `requirements` - Job requirements
  - `experienceLevel` - Required experience level
  - `skills` - Array of required skills
  - `active` - Boolean for job status
  - `postedDate` - When job was posted
  - `expiryDate` - When job expires
  - `applicants` - Array of user IDs who applied
  - `companyId` - Reference to company

#### Users Collection (`/users/{userId}`)
- **Access:** Users can only access their own data
- **Fields:** Profile information, preferences, saved jobs, etc.

#### Applications Collection (`/applications/{applicationId}`)
- **Access:** Users can only access their own applications
- **Fields:** jobId, userId, applicationDate, status, coverLetter, etc.
## Environment Variables & Security

### Frontend Security
- **Firebase Config:** Stored in `frontend/src/firebaseConfig.ts`
- **API Keys:** Firebase public keys are safe to expose in frontend
- **Authentication:** Handled by Firebase Auth SDK

### Backend Security
- **Service Account:** Firebase Admin SDK credentials in `functions/firebase-credentials.json`
- **Environment Variables:** Firebase Functions automatically handle environment variables
- **CORS:** Configured to allow requests from your frontend domain

### Database Security
- **Firestore Rules:** Comprehensive security rules in `firestore.rules`
- **Authentication Required:** Most write operations require user authentication
- **Data Validation:** Server-side validation for all API endpoints
- **User Isolation:** Users can only access their own data
## Firebase Configuration

### Core Configuration Files
- `firebase.json` - Main Firebase configuration for hosting, functions, and Firestore
- `firestore.rules` - Database security rules with role-based access control
- `firestore.indexes.json` - Database indexes for optimal query performance
- `FIREBASE_DEPLOYMENT.md` - Detailed deployment instructions

### Project Structure
- **Hosting:** Serves the React app from `frontend/build`
- **Functions:** Node.js backend API in the `functions` directory
- **Firestore:** NoSQL database with collections for jobs, users, companies, and applications
## Development Status

This project is actively maintained and includes:

✅ **Complete user authentication system** - Firebase Auth integration with email/password and Google OAuth
✅ **Job search and filtering functionality** - Advanced search with pagination and multiple criteria
✅ **Role-based dashboards** - Separate interfaces for job seekers, employers, and admin
✅ **Job application system** - Apply to jobs with profile data or CV upload, track applications
✅ **Job management** - Create, read, update, and delete job listings
✅ **Admin panel** - Administrative controls and system oversight
✅ **User profile management** - Comprehensive profiles with role-specific fields
✅ **Job saving functionality** - Save jobs for later viewing and application
✅ **Responsive design** - Mobile-first design with Tailwind CSS
✅ **Firebase integration** - Real-time updates with Firestore
✅ **Production-ready deployment** - Firebase Hosting and Functions
✅ **Landing page with featured content** - Professional landing page with job alerts and company spotlight
✅ **Company profiles** - Detailed company information and job listings
✅ **Job recommendations** - AI-powered job recommendations based on user profile
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write comprehensive error handling
- Test your changes thoroughly
- Update documentation as needed
## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **UI/UX Inspiration:** Modern job search platforms like Indeed, LinkedIn, and Glassdoor
- **Technology Stack:** React.js, TypeScript, Firebase, and Tailwind CSS
- **Architecture:** Serverless Firebase Functions with Firestore NoSQL database
- **Deployment:** Firebase Hosting for seamless frontend deployment