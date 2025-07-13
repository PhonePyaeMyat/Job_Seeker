# Job_Seeker
A full-stack job search platform built with React.js (TypeScript), Node.js (Express), and Firebase Firestore.

## Features

- Job search and filtering
- Job listings with detailed information
- Job posting (protected endpoint)
- Responsive design with Tailwind CSS
- Real-time database with Firebase Firestore

## Tech Stack

### Frontend
- React.js (TypeScript)
- Tailwind CSS for styling
- Axios for API requests

### Backend
- Node.js with Express
- Firebase Admin SDK for Firestore
- CORS for cross-origin requests

### Database
- Firebase Firestore (NoSQL database)

## Project Structure

```
Job_Seeker/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── services/         # API services
│   └── package.json
├── backend-nodejs/           # Node.js backend application
│   ├── index.js              # Main server file
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Firebase account (for Firestore)

---

## Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000).

---

## Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend-nodejs
   ```
2. Place your Firebase service account key as `firebase-credentials.json` in this directory (do NOT commit this file).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run at [http://localhost:3001](http://localhost:3001).

---

## API Endpoints

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create new job
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

All endpoints interact with the `jobs` collection in Firebase Firestore.

---

## Environment Variables & Security
- **Frontend:** No sensitive keys should be committed. For production, secure any API keys or secrets.
- **Backend:** Never commit `firebase-credentials.json` or real API keys. Use `.gitignore` to protect secrets.
- **CORS:** The backend is configured to allow requests from `http://localhost:3000`.

---

## .gitignore
- Both frontend and backend are covered by a root `.gitignore` (see file for details).
- Ensures `node_modules`, `.env`, and credentials are not committed.

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