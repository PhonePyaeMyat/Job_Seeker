# Job_Seeker
A full-stack job search platform built with React.js (TypeScript), Firebase Functions, and Firebase Firestore.

## Features

- Job search and filtering
- Job listings with detailed information
- Job posting (protected endpoint)
- Responsive design with Tailwind CSS
- Real-time database with Firebase Firestore
- Deployed on Firebase Hosting and Functions

## Tech Stack

### Frontend
- React.js (TypeScript)
- Tailwind CSS for styling
- Axios for API requests
- Firebase Hosting for deployment

### Backend
- Firebase Functions (Node.js/Express)
- Firebase Admin SDK for Firestore
- CORS for cross-origin requests

### Database & Infrastructure
- Firebase Firestore (NoSQL database)
- Firebase Functions for serverless backend
- Firebase Hosting for frontend deployment

## Project Structure

```
Job_Seeker/
├── functions/                 # Firebase Functions (backend API)
│   ├── index.js              # Main functions file
│   └── package.json
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── services/         # API services
│   └── package.json
├── backend-nodejs/           # Legacy Node.js backend (optional)
├── firebase.json             # Firebase configuration
├── .firebaserc              # Firebase project settings
├── firestore.rules          # Firestore security rules
└── README.md
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

All endpoints interact with the `jobs` collection in Firebase Firestore.

---

## Environment Variables & Security
- **Frontend:** No sensitive keys should be committed. For production, secure any API keys or secrets.
- **Functions:** Firebase Functions automatically handle authentication and environment variables.
- **Firestore:** Security rules are configured in `firestore.rules` to protect your data.
- **CORS:** Functions are configured to allow requests from your frontend domain.

---

## Firebase Configuration
- `firebase.json` - Main Firebase configuration for hosting and functions
- `.firebaserc` - Firebase project settings
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes for optimal query performance

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Indeed.com
- Built with React.js and Node.js
- Powered by Firebase Firestore