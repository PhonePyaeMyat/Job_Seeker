import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Prefer environment variables; fall back to known defaults for local dev
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA_Eh7PP_HlZMVX52hJoRWEDfp9Zzrkr2E",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "job-seeker-80fd8.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "job-seeker-80fd8",
  // Correct default bucket domain uses appspot.com
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "job-seeker-80fd8.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "329214472410",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:329214472410:web:1cae5cc2558904e190b5e3",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-1Y40DBXGYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;