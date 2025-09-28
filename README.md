# Job_Seeker
A full-stack job search platform built with React (TypeScript) and Firebase (Firestore, Functions, Hosting).

## Features

### Core
- **Job search & filtering** powered by Firestore
- **Job listings management** (create, read, update, delete via Cloud Functions)
- **Apply to jobs** (stores applicant IDs in each job document)

### UX
- **Responsive UI** with Tailwind CSS
- **Real-time updates** with Firebase SDK
- **Reusable components** and clear error states

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router DOM
- Tailwind CSS
- Firebase Web SDK (+ React Firebase Hooks)

### Backend
- Firebase Functions (Node.js 18) with Express
- Firebase Admin SDK
- CORS configured for local and hosted origins

### Infra
- Firebase Firestore (NoSQL)
- Firebase Authentication
- Firebase Hosting

## Project Structure

```
Job_Seeker/
├── functions/                      # Firebase Functions (backend API)
│   ├── index.js                   # Express app mounted as `api`
│   └── package.json               # Functions dependencies/scripts
├── frontend/                      # React application
│   ├── public/
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── pages/                # Route-level screens
│   │   ├── services/             # Firestore access helpers
│   │   │   └── jobService.ts
│   │   ├── firebaseConfig.ts     # Reads REACT_APP_* env vars
│   │   └── App.tsx / index.tsx
│   └── package.json
├── firebase.json                  # Hosting, Functions, Firestore config
├── firestore.rules                # Security rules
├── firestore.indexes.json         # Index definitions
├── package.json                   # Workspace scripts
├── FIREBASE_DEPLOYMENT.md         # Extra deployment guide
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm i -g firebase-tools`)
- A Firebase project

### 1) Install dependencies
```bash
npm run install-all
```

### 2) Configure Firebase for the frontend
Create `frontend/.env.local` with your project values:
```bash
REACT_APP_FIREBASE_API_KEY=xxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxxx
REACT_APP_FIREBASE_APP_ID=xxxx
REACT_APP_FIREBASE_MEASUREMENT_ID=G-xxxx
```
These map to the keys read in `frontend/src/firebaseConfig.ts`.

### 3) Set your Firebase project
```bash
firebase login
firebase use --add
```

### 4) Run locally
Start React and the Functions emulator together:
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Functions (local): http://localhost:5001/<your-project-id>/us-central1/api

For more options, see the scripts section below.

## Deployment

Build the frontend and deploy Hosting, Functions, and Firestore:
```bash
npm run build
npm run deploy
```
You can deploy individual services via the dedicated scripts.

## API (Cloud Functions)

Base URLs after deployment:
- Production: `https://us-central1-<your-project-id>.cloudfunctions.net/api`
- Local emu: `http://localhost:5001/<your-project-id>/us-central1/api`

Implemented routes in `functions/index.js`:
- `GET /jobs` — List jobs with simple pagination via query `page`, `size`
- `GET /jobs/:id` — Get job by ID
- `POST /jobs` — Create job
- `PUT /jobs/:id` — Update job
- `DELETE /jobs/:id` — Delete job
- `GET /jobs/search` — In-memory keyword/location/type filtering with pagination
- `POST /jobs/:id/apply` — Append a `userId` to the job's `applicants`

Utility function:
- `addSampleJobs` — `https://us-central1-<your-project-id>.cloudfunctions.net/addSampleJobs`

Note: The current frontend reads/writes jobs directly via Firestore helpers in `jobService.ts`. You can choose either the Functions API or direct Firestore access depending on your needs.

## Data Model (Firestore)

Collection: `/jobs/{jobId}`
- `title: string`
- `description: string`
- `company: string`
- `location: string`
- `type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE' | 'INTERNSHIP'`
- `salary: string`
- `requirements: string`
- `experienceLevel: string`
- `skills: string[]`
- `active: boolean`
- `postedDate: ISO string`
- `expiryDate?: ISO string`
- `applicants: string[]` (user IDs)

## Environment & Security

### Frontend
- Firebase config is provided via `REACT_APP_*` vars (see `.env.local` section)
- Public Firebase keys are safe to expose in frontends

### Backend
- Functions run on Node 18; Admin SDK initializes from the Firebase environment
- CORS allows `http://localhost:3000` and your deployed Hosting origin

### Firestore
- Rules in `firestore.rules`; adjust to your requirements before going to production

## Scripts

### Root
- `install-all` — Install root, frontend, and functions deps
- `dev` — Run React and Functions emulator concurrently
- `dev:frontend` — React dev server
- `dev:functions` — Functions emulator only
- `build` — Build the frontend (`frontend/build`)
- `deploy` — Deploy all Firebase resources
- `deploy:hosting` — Deploy Hosting only
- `deploy:functions` — Deploy Functions only
- `deploy:firestore` — Deploy Firestore rules/indexes
- `emulators` — Start all emulators
- `emulators:functions` — Functions emulator only
- `emulators:firestore` — Firestore emulator only
- `lint` — Lint Functions code
- `test` — Run frontend tests
- `clean` — Remove build artifacts and node_modules

### Frontend
- `start`, `build`, `test`, `eject`, `deploy`

### Functions
- `serve`, `shell`, `deploy`, `logs`, `lint`, `build`

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m "Add some AmazingFeature"`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open a PR

## License
MIT

## Acknowledgments
- React, TypeScript, Firebase, Tailwind CSS
- Inspiration from modern job platforms