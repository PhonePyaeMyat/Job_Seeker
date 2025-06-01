# JobSeeker - Job Search Platform

A full-stack job search platform inspired by Indeed, built with modern web technologies.

## Features

- Job search and filtering
- User authentication and profiles
- Job applications and resume management
- Company profiles and job posting
- Admin dashboard
- Email notifications

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Java with Spring Boot
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS
- **Build Tool**: Maven

## Project Structure

```
jobseeker/
├── frontend/              # React.js frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
├── backend/              # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/    # Java source files
│   │   │   └── resources/ # Configuration files
│   │   └── test/        # Test files
│   └── pom.xml          # Maven configuration
│
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Java JDK 17 or higher
- Maven
- Google Cloud Account (for Firestore)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/jobseeker.git
cd jobseeker
```

2. Set up the backend
```bash
cd backend
mvn install
```

3. Set up the frontend
```bash
cd frontend
npm install
```

4. Configure Firebase
- Create a new Firebase project
- Enable Firestore and Authentication
- Download the Firebase configuration file
- Place it in the appropriate location in both frontend and backend

5. Set up environment variables
```bash
# In backend directory
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit application.properties with your Firebase credentials

# In frontend directory
cp .env.example .env
# Edit .env with your Firebase configuration
```

6. Start the development servers
```bash
# Start backend server (from backend directory)
mvn spring-boot:run

# Start frontend server (from frontend directory)
npm start
```

## API Documentation

API documentation is available at `/swagger-ui.html` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.