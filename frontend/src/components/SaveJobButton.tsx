import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface SaveJobButtonProps {
  jobId: string;
  isSaved: boolean;
  onSaveChange?: (jobId: string, isSaved: boolean) => void;
  className?: string;
}

const SaveJobButton: React.FC<SaveJobButtonProps> = ({ 
  jobId, 
  isSaved, 
  onSaveChange,
  className = ""
}) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please log in to save jobs');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      
      if (isSaved) {
        // Remove from saved jobs
        await updateDoc(userRef, {
          savedJobs: arrayRemove(jobId),
          updatedAt: new Date().toISOString()
        });
        onSaveChange?.(jobId, false);
      } else {
        // Add to saved jobs
        await updateDoc(userRef, {
          savedJobs: arrayUnion(jobId),
          updatedAt: new Date().toISOString()
        });
        onSaveChange?.(jobId, true);
      }
    } catch (error) {
      console.error('Error updating saved jobs:', error);
      alert('Failed to update saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show save button for non-authenticated users
  }

  return (
    <button
      onClick={handleSaveToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSaved
          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <>
          {isSaved ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Saved
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Save Job
            </>
          )}
        </>
      )}
    </button>
  );
};

export default SaveJobButton;
