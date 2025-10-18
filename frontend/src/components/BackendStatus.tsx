import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface BackendStatusProps {
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

const BackendStatus: React.FC<BackendStatusProps> = ({ onError, onSuccess }) => {
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
          onSuccess?.();
          return;
        }

        // In development, attempt to reach local backend if present
        const response = await axios.get('http://127.0.0.1:5001/job-seeker-80fd8/us-central1/api/jobs');
        console.log('Backend response:', response.data);
        setStatus('connected');
        onSuccess?.();
      } catch (err: any) {
        console.error('Backend connection failed:', err);
        setStatus('error');
        let errorMessage = '';
        
        if (err?.code === 'ECONNREFUSED') {
          errorMessage = 'Backend server is not running. For dev, start it or ignore this message.';
        } else {
          errorMessage = `Connection failed: ${err?.message || 'Unknown error'}`;
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    check();
  }, [onError, onSuccess]);

  // Only render error status, not success or checking
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

  // Don't render anything for checking or connected states
  return null;
};

export default BackendStatus;
