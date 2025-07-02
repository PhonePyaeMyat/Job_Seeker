# Node.js Backend with Firebase

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add your Firebase service account key:**
   - Download the service account JSON from your Firebase Console.
   - Place it in this folder and name it `firebase-credentials.json`.

## Running the Server

- **Start the server:**
  ```bash
  npm start
  ```
- **For development (with auto-reload):**
  ```bash
  npm run dev
  ```

## API Endpoints

- `POST   /jobs`      - Create a new job
- `GET    /jobs`      - Get all jobs
- `GET    /jobs/:id`  - Get a job by ID
- `PUT    /jobs/:id`  - Update a job by ID
- `DELETE /jobs/:id`  - Delete a job by ID

## Notes
- Make sure your Firebase project has Firestore enabled.
- The server runs on port `3001` by default. 