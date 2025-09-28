import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';

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
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applied' | 'saved'>('applied');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          fetchAppliedJobs(),
          fetchSavedJobs()
        ]);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const fetchAppliedJobs = async () => {
    if (!user) return;

    try {
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
      throw err;
    }
  };

  const fetchSavedJobs = async () => {
    if (!user) return;

    try {
      // Get user's saved job IDs from their profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedIds = userData.savedJobs || [];
        setSavedJobIds(savedIds);

        if (savedIds.length > 0) {
          // Get the actual job data for saved jobs
          const jobsRef = collection(db, 'jobs');
          const jobs: Job[] = [];
          
          for (const jobId of savedIds) {
            try {
              const jobDoc = await getDoc(doc(db, 'jobs', jobId));
              if (jobDoc.exists()) {
                jobs.push({
                  id: jobDoc.id,
                  ...jobDoc.data()
                } as Job);
              }
            } catch (err) {
              console.warn(`Failed to load job ${jobId}:`, err);
            }
          }
          
          setSavedJobs(jobs);
        } else {
          setSavedJobs([]);
        }
      } else {
        setSavedJobs([]);
        setSavedJobIds([]);
      }
    } catch (err: any) {
      console.error('Error fetching saved jobs:', err);
      throw err;
    }
  };

  const handleSaveChange = async (jobId: string, isSaved: boolean) => {
    if (isSaved) {
      setSavedJobIds(prev => [...prev, jobId]);
      // Find job in applied jobs list or fetch from Firestore
      let jobToAdd = appliedJobs.find(j => j.id === jobId);
      
      if (!jobToAdd) {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          if (jobDoc.exists()) {
            jobToAdd = {
              id: jobDoc.id,
              ...jobDoc.data()
            } as Job;
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        }
      }
      
      if (jobToAdd) {
        setSavedJobs(prev => {
          const exists = prev.some(job => job.id === jobId);
          return exists ? prev : [...prev, jobToAdd!];
        });
      }
    } else {
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    }
    
    // Refresh saved jobs from database to ensure consistency
    setTimeout(() => {
      fetchSavedJobs();
    }, 100);
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      alert('Please log in to apply for jobs');
      return;
    }

    try {
      // Use the service function to apply to the job
      const { applyToJob } = await import('../services/jobService');
      await applyToJob(jobId, user.uid);
      
      // Refresh the applied jobs list
      await fetchAppliedJobs();
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-6">Job Seeker Dashboard</h2>
      
      {/* User Info Section */}
      <div className="mb-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Welcome back!</h3>
        <p className="text-gray-700">Email: {user.email}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'applied', label: 'Applied Jobs', count: appliedJobs.length },
              { id: 'saved', label: 'Saved Jobs', count: savedJobs.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : (
            <>
              {activeTab === 'applied' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Applied Jobs ({appliedJobs.length})</h3>
                  {appliedJobs.length === 0 ? (
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
                          <p className="text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Applied on {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                            <Link 
                              to={`/jobs/${job.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Saved Jobs ({savedJobs.length})</h3>
                  {savedJobs.length === 0 ? (
                    <div className="bg-gray-100 p-6 rounded text-center">
                      <p className="text-gray-600 mb-4">You haven't saved any jobs yet.</p>
                      <Link 
                        to="/" 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Browse Jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedJobs.map(job => (
                        <div key={job.id}>
                          <JobCard
                            job={job}
                            onApply={handleApply}
                            isSaved={savedJobIds.includes(job.id)}
                            onSaveChange={handleSaveChange}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-800">Applications</h4>
          <p className="text-2xl font-bold text-blue-600">{appliedJobs.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h4 className="font-semibold text-yellow-800">Saved Jobs</h4>
          <p className="text-2xl font-bold text-yellow-600">{savedJobs.length}</p>
          <p className="text-xs text-gray-500">Bookmarked jobs</p>
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