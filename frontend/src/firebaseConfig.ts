import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_Eh7PP_HlZMVX52hJoRWEDfp9Zzrkr2E",
  authDomain: "job-seeker-80fd8.firebaseapp.com",
  projectId: "job-seeker-80fd8",
  storageBucket: "job-seeker-80fd8.firebasestorage.app",
  messagingSenderId: "329214472410",
  appId: "1:329214472410:web:1cae5cc2558904e190b5e3",
  measurementId: "G-1Y40DBXGYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;