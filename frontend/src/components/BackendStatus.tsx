import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

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
        // Always check Firestore connectivity (main data source)
        const q = query(collection(db, 'jobs'), limit(1));
        await getDocs(q);

        // If in development, optionally check backend API (silent check).
        // The URL comes from REACT_APP_API_URL and defaults to the deployed
        // Functions URL — never a hardcoded localhost address.
        if (window.location.hostname === 'localhost') {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);

            const response = await axios.get(`${API_BASE_URL}/jobs`, {
              timeout: 1500,
              signal: controller.signal,
              validateStatus: () => true, // Don't throw on any status code
            });

            clearTimeout(timeoutId);

            if (response.status === 200) {
              // Backend API is available; nothing to show.
            }
          } catch (apiErr: any) {
            // Silently ignore - backend is optional
            // Only log if it's an unexpected error (not network/timeout)
            if (apiErr.code !== 'ECONNREFUSED' && apiErr.code !== 'ERR_CANCELED' && !apiErr.message.includes('timeout')) {
              // Unexpected backend check error; surfaced only in dev tools.
            }
          }
        }

        setStatus('connected');
        onSuccess?.();
      } catch (err: any) {
        console.error('Database connection failed:', err);
        setStatus('error');
        const errorMessage = 'Unable to connect to database. Please check your internet connection.';

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
