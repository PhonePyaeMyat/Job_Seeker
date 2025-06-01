import React, { useState, useEffect } from 'react';
import JobSearch from './JobSearch';
import JobCard from './JobCard';
import { getJobs, Job } from '../services/jobService';

const JobList = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (filters?: { keyword: string; location: string; type: string }) => {
    try {
      setLoading(true);
      // TODO: Implement filtering when backend is ready
      const data = await getJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs. Please try again later.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (filters: { keyword: string; location: string; type: string }) => {
    fetchJobs(filters);
  };

  const handleApply = async (jobId: string) => {
    // TODO: Implement job application logic
    console.log('Applying for job:', jobId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button
          onClick={() => fetchJobs()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Find Your Dream Job</h1>
      
      <JobSearch onSearch={handleSearch} />
      
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No jobs found matching your criteria.
          </div>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default JobList; 