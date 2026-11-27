# Job Seeker - Job Search & Management Platform

A comprehensive job search and management platform built with React, Node.js, and Firebase. This application connects job seekers with employers, providing a seamless experience for job searching, application management, and recruitment.

## 🚀 Features

### For Job Seekers
- **Job Search & Discovery**: Search jobs by keyword, location, type, salary, experience level, and more
- **Advanced Filtering**: Filter by remote work, date posted, company, and salary range
- **Job Applications**: Apply to jobs with profile data or CV upload, track application status (pending → interview → offer / rejected)
- **Saved Jobs**: Save interesting jobs for later review
- **Dashboard**: View application statistics, interviews, offers, and saved jobs
- **Profile Management**: Manage personal information, skills, experience, and resume (uploaded to Firebase Storage)
- **Job Recommendations**: Get personalized job recommendations based on your profile

### For Employers
- **Job Posting**: Create and manage job listings
- **Applicant Management**: View and manage applications, move them through the status pipeline (pending → interview → offer / rejected)
- **Dashboard Analytics**: Real-time statistics on job performance and applications, with date filters
- **Company Profile**: Manage company information (verified by an admin — see `ADMIN_LOGIN_GUIDE.md`)
- **Application Tracking**: Track applicants through the hiring process

### For Administrators
- **User Management**: Manage users, roles, and permissions
- **Job Moderation**: Approve, reject, or delete job postings
- **Company Verification**: Verify employers so a Verified badge shows on their company profile and job listings
- **System Monitoring**: View platform statistics and reports

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Firebase SDK** for authentication and database
- **React Firebase Hooks** for real-time data

### Backend
- **Node.js** with Express.js
- **Firebase Functions** for serverless deployment
- **Firebase Firestore** for database
- **Firebase Storage** for CV/resume uploads
- **Firebase Auth** for authentication

### External Integrations
- **Greenhouse API** for job board integration

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (for deployment)
- Firebase project setup

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Job_Seeker
```

### 2. Install Dependencies
```bash
npm run install-all
```

This will install dependencies for both the root, frontend, and functions directories.

### 3. Environment Setup

Create a `.env` file in the `frontend` directory with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**API URL**: the frontend talks to the backend through `REACT_APP_API_URL`
(see `frontend/.env.example`). Without it, it defaults to the deployed
Cloud Functions URL — job posting will NOT work against a local emulator
unless `REACT_APP_API_URL` points at it. For Firebase Hosting the config
values above are the only ones needed — Firebase Hosting injects nothing
automatically, so set the variables in your Vercel/Netlify/hosting
environment too.

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Enable Storage (for CV/resume uploads — `storage.rules` in the repo root)
5. Deploy Firestore rules and Storage rules:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
6. Deploy functions:
```bash
cd functions
npm run deploy
```

### 5. Run the Application

#### Development Mode
```bash
npm run dev
```

This starts both the frontend (port 3000) and backend functions (port 5001).

#### Frontend Only
```bash
cd frontend
npm start
```

#### Backend Only
```bash
cd functions
npm run serve
```

## 📁 Project Structure

```
Job_Seeker/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   │   ├── jobService.ts      # Jobs + applications (search, apply, status pipeline)
│   │   │   ├── userService.ts     # User profile helpers
│   │   │   ├── storageService.ts  # Firebase Storage CV/resume uploads
│   │   │   ├── companyService.ts  # Company records + verification
│   │   │   └── greenhouseService.ts
│   │   ├── firebaseConfig.ts # Firebase configuration (Auth, Firestore, Storage)
│   │   ├── config.ts       # API base URL (REACT_APP_API_URL)
│   │   └── App.tsx         # Main application component
│   ├── package.json
│   └── .env.example        # Copy to .env and fill in your Firebase keys
├── functions/               # Firebase Functions (Express API)
│   ├── index.js            # Main API server
│   ├── package.json
│   └── .eslintrc.js
├── firebase.json           # Firebase configuration (hosting, functions, firestore, storage)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── storage.rules           # Firebase Storage security rules (resumes + CVs, owner-only)
├── package.json            # Root package.json with scripts
└── README.md
```

## 🔧 Available Scripts

### Root Directory
- `npm run install-all` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run lint` - Run linting for functions
- `npm run emulators` - Start Firebase emulators

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Functions
- `npm run serve` - Start functions emulator
- `npm run deploy` - Deploy functions
- `npm run lint` - Run ESLint
- `npm run logs` - View function logs

## 🔐 Authentication & Authorization

### User Roles
- **Job Seeker**: Can search jobs, apply, save jobs, manage profile
- **Employer**: Can post jobs, manage applications, view analytics
- **Admin**: Full access to user management, job moderation, company verification

### Security
- Firebase Authentication for user management
- Role-based access control (RBAC) — the role is read from the Firestore
  user document, never from localStorage and never from a client-chosen
  code (the old hardcoded admin code was removed in Phase 1)
- Firestore security rules for data protection
- Storage security rules: resumes and CVs are readable only by their owner;
  employers see a CV through the download URL stored on the application
- API endpoints require an ID token for writes; write routes check
  ownership or admin status server-side

## 📊 API Endpoints

### Jobs
- `GET /jobs` - Get all jobs (cursor paginated, newest first; returns `nextCursor`)
- `GET /jobs/search` - Search jobs with filters (exact filters run as Firestore queries; substring filters run in memory over a bounded 500-document set)
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create a new job (authenticated, employer or admin only)
- `PUT /jobs/:id` - Update a job (owner or admin; status changes are admin-only)
- `DELETE /jobs/:id` - Delete a job (owner or admin)

### Applications
- `POST /jobs/:id/apply` - Apply to a job (authenticated, idempotent — applying twice returns `alreadyApplied: true`)
- `GET /jobs/:id/applications` - Applications for one job (job poster or admin only)
- `GET /applications/employer` - All applications for the caller's jobs, with counts by status; optional `?status=`, `?from=`, `?to=`
- `PATCH /applications/:id/status` - Move an application to `pending` / `interview` / `offer` / `rejected` (job poster or admin only; only the status field may change)

### Greenhouse Integration
- `GET /jobs/greenhouse/:boardToken` - Fetch jobs from Greenhouse (display only)
- `POST /jobs/sync-greenhouse` - Sync jobs from Greenhouse to Firestore (admin only)

## 🗄️ Database Schema

### Collections

#### Users (`users/{userId}`)
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'jobseeker' | 'employer' | 'admin';
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  resume?: { name: string; url: string; path: string; size: number; contentType: string; uploadedAt: string };
  resumeUrl?: string; // back-compat copy of resume.url
  companyName?: string; // employers
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Jobs (`jobs/{jobId}`)
```typescript
{
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE' | 'TEMPORARY';
  salary: string;
  description: string;
  requirements: string;
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR';
  skills: string[];
  active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  postedBy: string; // uid of the employer who posted (stamped server-side)
  companyId: string; // uid of the employer — used for the employer dashboard + verification
  postedDate: string;
  expiryDate: string;
  applicants: string[]; // user IDs
}
```

#### Applications (`applications/{applicationId}`)
```typescript
{
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  applicationMethod: 'quick' | 'profile' | 'cv';
  appliedAt: Timestamp;
  status: 'pending' | 'interview' | 'offer' | 'rejected';
  coverLetter?: string;
  additionalInfo?: string;
  profileData?: { fullName, email, phone, location, summary, skills, experience, education, coverLetter };
  cvFile?: { name: string; size: number; type: string; url: string; path: string; status: 'uploaded' };
}
```

#### Companies (`companies/{employerUid}`)
```typescript
{
  ownerId: string; // == the document ID (the employer's uid)
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  verified: boolean; // admin-only: only an admin may change this (rules + admin panel)
  createdAt: string;
  updatedAt: string;
}
```

#### Storage (Firebase Storage)
```
resumes/{uid}/{timestamp}_{fileName}   # jobseeker resume (sign-up or profile)
cvs/{uid}/{timestamp}_{fileName}       # CV attached to one application
```
Owner-only read/write, PDF/Word only, max 5MB (see `storage.rules`).

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
1. Connect your repository to Vercel
2. Set the build command: `cd frontend && npm run build`
3. Set the output directory: `frontend/build`
4. Add your Firebase environment variables in the Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔄 Development Status

### Phase 1 — reliability (merged as draft PR #5)
- Fixed job posting against the live API (no more hardcoded localhost URL)
- ID-token auth + server-side validation on all API writes
- One apply flow with a real applied date; admin code removed; role from Firestore
- Advanced search filters wired through; fake CV upload removed
- Firestore rules tightened to owner-or-admin

### Phase 2 — core product (this branch)
- Application status pipeline end to end: employers move applications
  pending → interview → offer / rejected; jobseekers see the status on
  their dashboard and on the job page
- Real CV/resume upload via Firebase Storage (sign-up, profile, apply
  modal) with owner-only Storage rules
- Server-side search: exact filters as Firestore queries, cursor
  pagination on `GET /jobs`, offset pagination on search
- Real dashboard numbers: employer dashboard reads real applications
  (no simulated figures), with date filters and a status breakdown;
  jobseeker dashboard counts Applications / Interviews / Offers /
  Rejected from real records
- RBAC completion: role from Firestore everywhere (no localStorage),
  `/post-job` guarded to employer/admin, `POST /jobs` restricted to
  employer/admin server-side
- Minimal employer verification: a `verified` flag on the company,
  settable only by an admin from Admin Panel → Companies; a Verified
  badge shows on the company profile and job listings

### Planned (later phases)
- Phase 3: engineering quality — validation, authorization, error handling, tests, API documentation
- Phase 4: deployment
- Phase 5: AI features (job assistant: CV vs job description, skill gaps, interview questions)
- Phase 6: presentation — screenshots, architecture diagram, setup guide, live demo in README
