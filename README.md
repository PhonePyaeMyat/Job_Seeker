# Job_Seeker
A full-stack job search platform built with React.js, Java Spring Boot, and Firebase Firestore.

## Features

- Job search and filtering
- Job listings with detailed information
- Job posting (protected by API key)
- Responsive design with Tailwind CSS
- Real-time database with Firebase Firestore

## Tech Stack

### Frontend
- React.js (TypeScript)
- Tailwind CSS for styling
- Axios for API requests

### Backend
- Java Spring Boot
- REST API architecture

### Database
- Firebase Firestore (NoSQL database)

## Project Structure

```
Job_Seeker/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   └── services/        # API services
│   └── package.json
├── backend/                  # Spring Boot backend application
│   ├── src/
│   └── pom.xml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Java JDK 17 or higher
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
   cd backend
   ```
2. Place your Firebase service account key as `src/main/resources/firebase-credentials.json` (do NOT commit this file).
3. Set your API key in `src/main/resources/application.properties`:
   ```properties
   api.key=CHANGE_ME_TO_A_SECRET_KEY
   ```
4. Build the project:
   ```bash
   mvn clean install
   ```
5. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   The backend will run at [http://localhost:8080](http://localhost:8080).

---

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs (supports `page` and `size` query params)
- `GET /api/jobs/search` - Search jobs with filters (supports `page` and `size`)
- `GET /api/jobs/{id}` - Get job by ID
- `POST /api/jobs` - Create new job (**requires API key in Authorization header**)
- `PUT /api/jobs/{id}` - Update job (**requires API key**)
- `DELETE /api/jobs/{id}` - Delete job (**requires API key**)

---

## Environment Variables & Security
- **Frontend:** No sensitive keys should be committed. API key for job posting is hardcoded for MVP; change for production.
- **Backend:** Never commit `firebase-credentials.json` or real API keys. Use `.gitignore` to protect secrets.
- **CORS:** The backend is configured to allow requests from `http://localhost:3000`.

---

## .gitignore
- Both frontend and backend are covered by a root `.gitignore` (see file for details).
- Ensures `node_modules`, `target`, `.env`, and credentials are not committed.

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
- Built with React.js and Spring Boot
- Powered by Firebase Firestore