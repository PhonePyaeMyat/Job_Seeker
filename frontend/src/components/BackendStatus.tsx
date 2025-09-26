import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const check = async () => {
      try {
        const isProd = window.location.hostname !== 'localhost';
        if (isProd) {
          // In production, verify Firestore connectivity instead of localhost backend
          const q = query(collection(db, 'jobs'), limit(1));
          await getDocs(q);
          setStatus('connected');
          return;
        }

        // In development, attempt to reach local backend if present
        const response = await axios.get('http://localhost:3001/jobs');
        console.log('Backend response:', response.data);
        setStatus('connected');
      } catch (err: any) {
        console.error('Backend connection failed:', err);
        setStatus('error');
        if (err?.code === 'ECONNREFUSED') {
          setError('Backend server is not running. For dev, start it or ignore this message.');
        } else {
          setError(`Connection failed: ${err?.message || 'Unknown error'}`);
        }
      }
    };

    check();
  }, []);

  if (status === 'checking') {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Checking backend connection...</strong>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Backend Connection Error:</strong>
        <p className="mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <strong>✅ Backend connected successfully!</strong>
    </div>
  );
};

export default BackendStatus;
