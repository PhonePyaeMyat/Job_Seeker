import React, { useState } from 'react';
import { fetchGreenhouseJobsDisplay } from '../services/greenhouseService';
import JobCard from './JobCard';
import { useNavigate } from 'react-router-dom';

interface GreenhouseJobsProps {
  boardToken: string;
}

const GreenhouseJobs: React.FC<GreenhouseJobsProps> = ({ boardToken }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadJobs = async () => {
    if (!boardToken.trim()) {
      setError('Please enter a board token');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchGreenhouseJobsDisplay(boardToken);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = (job: any) => {
    // Store job in sessionStorage for viewing details
    sessionStorage.setItem('greenhouseJob', JSON.stringify(job));
    navigate(`/jobs/gh_${job.greenhouseId}`);
  };

  const handleApply = async (job: any) => {
    // For Greenhouse jobs, redirect to Greenhouse URL
    if (job.greenhouseUrl) {
      window.open(job.greenhouseUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button
          onClick={loadJobs}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No Greenhouse jobs loaded. Enter a board token and click "Load Jobs".
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-700">
          <strong>ℹ️ These jobs are from Greenhouse and are not stored in your database.</strong> 
          Click "Apply" to go to the Greenhouse posting.
        </p>
      </div>

      {/* Job list */}
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onApply={() => handleApply(job)}
          onViewMore={() => handleViewMore(job)}
          isApplied={false}
        />
      ))}
    </div>
  );
};

export default GreenhouseJobs;
