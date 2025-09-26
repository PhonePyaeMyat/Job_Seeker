import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  description: string;
  applicants: string[];
}

const JobSeekerDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query all jobs where the current user is in the applicants array
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('applicants', 'array-contains', user.uid));
        const snapshot = await getDocs(q);
        
        const jobs: Job[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Job));

        setAppliedJobs(jobs);
      } catch (err: any) {
        console.error('Error fetching applied jobs:', err);
        setError('Failed to load applied jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Job Seeker Dashboard</h2>
      
      {/* User Info Section */}
      <div className="mb-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Welcome back!</h3>
        <p className="text-gray-700">Email: {user.email}</p>
      </div>

      {/* Applied Jobs Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Applied Jobs ({appliedJobs.length})</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading applied jobs...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : appliedJobs.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded text-center">
            <p className="text-gray-600 mb-4">You haven't applied to any jobs yet.</p>
            <Link 
              to="/" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appliedJobs.map(job => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800">
                      <Link to={`/jobs/${job.id}`} className="hover:text-blue-600">
                        {job.title}
                      </Link>
                    </h4>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-gray-500 text-sm">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {job.type}
                    </span>
                    {job.salary && (
                      <p className="text-sm text-gray-600 mt-1">{job.salary}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {job.description.substring(0, 150)}...
                  </p>
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Applied on: {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </Link>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Applied
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-800">Applications</h4>
          <p className="text-2xl font-bold text-blue-600">{appliedJobs.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h4 className="font-semibold text-yellow-800">Saved Jobs</h4>
          <p className="text-2xl font-bold text-yellow-600">0</p>
          <p className="text-xs text-gray-500">Feature coming soon</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h4 className="font-semibold text-green-800">Profile Views</h4>
          <p className="text-2xl font-bold text-green-600">-</p>
          <p className="text-xs text-gray-500">Feature coming soon</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link 
            to="/" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Browse More Jobs
          </Link>
          <Link 
            to="/profile" 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;