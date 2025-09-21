import React, { useState, useEffect } from 'react';
import JobSearch from './JobSearch';
import JobCard from './JobCard';
import BackendStatus from './BackendStatus';
import { searchJobs, Job, getJobs } from '../services/jobService';
import { Link } from 'react-router-dom';

const JobList = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ keyword: string; location: string; type: string } | null>(null);
  const size = 10;

  const fetchJobs = async (pageNum = 0, filtersArg = filters) => {
    try {
      setLoading(true);
      console.log('Fetching jobs...', { pageNum, filtersArg });
      
      let data;
      if (filtersArg) {
        data = await searchJobs(filtersArg.keyword, filtersArg.location, filtersArg.type, pageNum, size);
      } else {
        data = await getJobs(pageNum, size);
      }
      
      console.log('Jobs data received:', data);
      
      // Handle paginated response
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:3001');
      } else {
        setError(`Failed to load jobs: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(page);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = (filtersObj: { keyword: string; location: string; type: string }) => {
    console.log('Search triggered with filters:', filtersObj);
    setFilters(filtersObj);
    setPage(0);
    fetchJobs(0, filtersObj);
  };

  const handleApply = async (jobId: string) => {
    // TODO: Implement job application logic
    console.log('Applying for job:', jobId);
  };

  const totalPages = Math.ceil(total / size);

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
      
      <BackendStatus />
      
      <JobSearch onSearch={handleSearch} />
      
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No jobs found matching your criteria.
          </div>
        ) : (
          jobs.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} className="block hover:shadow-lg transition-shadow">
              <JobCard
                job={job}
                onApply={handleApply}
              />
            </Link>
          ))
        )}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default JobList; 