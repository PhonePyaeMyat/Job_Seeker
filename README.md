# Job_Seeker
A comprehensive full-stack job search platform built with React.js (TypeScript), Firebase Functions, and Firebase Firestore. Features user authentication, job management, and role-based dashboards for both job seekers and employers.

## Features

### Core Functionality
- **User Authentication & Authorization** - Secure login/signup with Firebase Auth
- **Job Search & Filtering** - Advanced search with multiple filters and categories
- **Job Management** - Create, read, update, and delete job listings
- **Role-Based Dashboards** - Separate interfaces for job seekers and employers
- **Job Applications** - Apply to jobs and track application status
- **Company Profiles** - Company information and job listings
- **Admin Panel** - Administrative controls and oversight

### User Experience
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Real-time Updates** - Live data synchronization with Firebase Firestore
- **Modern UI Components** - Reusable components with consistent styling
- **Error Handling** - Comprehensive error states and user feedback

## Tech Stack

### Frontend
- **React.js 18** with TypeScript
- **React Router DOM** for client-side routing
- **Tailwind CSS** for styling and responsive design
- **Axios** for HTTP requests
- **React Firebase Hooks** for Firebase integration
- **Firebase SDK** for authentication and real-time data

### Backend
- **Firebase Functions** (Node.js 18)
- **Express.js** for API routing
- **Firebase Admin SDK** for server-side Firestore operations
- **CORS** for cross-origin request handling

### Database & Infrastructure
- **Firebase Firestore** (NoSQL database)
- **Firebase Authentication** for user management
- **Firebase Hosting** for frontend deployment
- **Firebase Functions** for serverless backend API

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
│   │   │   ├── BackendStatus.tsx   # API connection status
│   │   │   ├── Categories.tsx      # Job categories display
│   │   │   ├── CompanyCard.tsx     # Company information card
│   │   │   ├── FeaturedJobs.tsx    # Featured jobs section
│   │   │   ├── FilterSidebar.tsx   # Job filtering sidebar
│   │   │   ├── Footer.tsx          # Site footer
│   │   │   ├── Header.tsx          # Navigation header
│   │   │   ├── JobCard.tsx         # Individual job listing card
│   │   │   ├── JobDetails.tsx      # Detailed job view
│   │   │   ├── JobForm.tsx         # Job creation/editing form
│   │   │   ├── JobList.tsx         # Job listings container
│   │   │   ├── JobSearch.tsx       # Search functionality
│   │   │   ├── Modal.tsx           # Reusable modal component
│   │   │   ├── Pagination.tsx      # Results pagination
│   │   │   ├── ProfileCard.tsx     # User profile display
│   │   │   ├── SaveJobButton.tsx   # Save job functionality
│   │   │   └── Tabs.tsx            # Tab navigation component
│   │   ├── pages/                   # Page components
│   │   │   ├── AdminPanel.tsx      # Administrative interface
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── EmployerDashboard.tsx # Employer-specific dashboard
│   │   │   ├── JobSeekerDashboard.tsx # Job seeker dashboard
│   │   │   ├── Login.tsx           # User login page
│   │   │   ├── NotFound.tsx        # 404 error page
│   │   │   ├── Profile.tsx         # User profile page
│   │   │   ├── ServerError.tsx     # 500 error page
│   │   │   └── SignUp.tsx          # User registration page
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
- Node.js (v18 or higher)
- Firebase account and project
- Firebase CLI (`npm install -g firebase-tools`)

### Quick Start
1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Configure Firebase:
   - Update `.firebaserc` with your Firebase project ID
   - Update `frontend/src/services/jobService.ts` with your project ID

3. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

For detailed setup instructions, see [FIREBASE_DEPLOYMENT.md](FIREBASE_DEPLOYMENT.md).

---

## Local Development

### Using Firebase Emulators
1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

The app will run at [http://localhost:3000](http://localhost:3000) with the backend API running on the Firebase Functions emulator.

---

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
- **Production**: `https://us-central1-your-project-id.cloudfunctions.net/api`
- **Local Development**: `http://localhost:5001/your-project-id/us-central1/api`

### Available Endpoints:

#### Job Management
- `GET /jobs` - Get all jobs with pagination and filtering
- `GET /jobs/:id` - Get specific job by ID
- `POST /jobs` - Create new job listing (authenticated)
- `PUT /jobs/:id` - Update existing job (authenticated)
- `DELETE /jobs/:id` - Delete job listing (authenticated)
- `GET /jobs/search` - Search jobs with advanced filters

#### Job Applications
- `POST /jobs/:id/apply` - Apply to a job
- `GET /applications` - Get user's job applications
- `GET /applications/:id` - Get specific application details

#### User Management
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `POST /users` - Create user profile

#### Company Management
- `GET /companies` - Get all companies
- `GET /companies/:id` - Get specific company
- `POST /companies` - Create company profile (authenticated)
- `PUT /companies/:id` - Update company profile (authenticated)

All endpoints interact with Firebase Firestore collections and include proper authentication and authorization checks.

---

## Database Schema

### Firestore Collections

#### Jobs Collection (`/jobs/{jobId}`)
- **Read Access**: Public (anyone can browse jobs)
- **Write Access**: Authenticated users only
- **Fields**: title, description, company, location, salary, requirements, applicants, etc.

#### Users Collection (`/users/{userId}`)
- **Access**: Users can only access their own data
- **Fields**: profile information, preferences, saved jobs, etc.

#### Companies Collection (`/companies/{companyId}`)
- **Read Access**: Public (anyone can view company info)
- **Write Access**: Authenticated users only
- **Fields**: company name, description, logo, website, etc.

#### Applications Collection (`/applications/{applicationId}`)
- **Access**: Users can only access their own applications
- **Fields**: jobId, userId, applicationDate, status, coverLetter, etc.

## Environment Variables & Security

### Frontend Security
- **Firebase Config**: Stored in `frontend/src/firebaseConfig.ts`
- **API Keys**: Firebase public keys are safe to expose in frontend
- **Authentication**: Handled by Firebase Auth SDK

### Backend Security
- **Service Account**: Firebase Admin SDK credentials in `functions/firebase-credentials.json`
- **Environment Variables**: Firebase Functions automatically handle environment variables
- **CORS**: Configured to allow requests from your frontend domain

### Database Security
- **Firestore Rules**: Comprehensive security rules in `firestore.rules`
- **Authentication Required**: Most write operations require user authentication
- **Data Validation**: Server-side validation for all API endpoints
- **User Isolation**: Users can only access their own data

## Firebase Configuration

### Core Configuration Files
- **`firebase.json`** - Main Firebase configuration for hosting, functions, and Firestore
- **`firestore.rules`** - Database security rules with role-based access control
- **`firestore.indexes.json`** - Database indexes for optimal query performance
- **`FIREBASE_DEPLOYMENT.md`** - Detailed deployment instructions

### Project Structure
- **Hosting**: Serves the React app from `frontend/build`
- **Functions**: Node.js backend API in the `functions` directory
- **Firestore**: NoSQL database with collections for jobs, users, companies, and applications

---

## Development Status

This project is actively maintained and includes:
- ✅ Complete user authentication system
- ✅ Job search and filtering functionality
- ✅ Role-based dashboards for job seekers and employers
- ✅ Job application system
- ✅ Company profile management
- ✅ Admin panel for system oversight
- ✅ Responsive design with modern UI components
- ✅ Firebase integration with real-time updates
- ✅ Production-ready deployment configuration

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

- **UI/UX Inspiration**: Modern job search platforms like Indeed, LinkedIn, and Glassdoor
- **Technology Stack**: React.js, TypeScript, Firebase, and Tailwind CSS
- **Architecture**: Serverless Firebase Functions with Firestore NoSQL database
- **Deployment**: Firebase Hosting for seamless frontend deployment