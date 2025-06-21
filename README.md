# Indeed Clone

A full-stack job search platform built with React.js, Java Spring Boot, and Firebase Firestore.

## Features

- Job search and filtering
- Job listings with detailed information
- Job application system
- Responsive design with Tailwind CSS
- Real-time database with Firebase Firestore

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- Firebase SDK for Firestore integration

### Backend
- Java Spring Boot
- RESTful API architecture

### Database
- Firebase Firestore (NoSQL database)

## Project Structure

```
indeed-clone/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API and Firebase services
│   │   └── types/          # TypeScript type definitions
│   └── package.json
└── backend/                 # Spring Boot backend application
    └── src/
        └── main/
            ├── java/       # Java source files
            └── resources/  # Application properties
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Java JDK 17 or higher
- Firebase account

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory and add your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   ./mvnw clean install
   ```

3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs with filters
- `GET /api/jobs/{id}` - Get job by ID
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job

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