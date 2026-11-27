import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, searchJobs, Job, SearchFilters, PaginatedJobs } from '../services/jobService';
import AdvancedJobSearch from './AdvancedJobSearch';

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  // Cursor stack for browsing: cursors[page] is the cursor to fetch that
  // page. Browsing goes through the server-side cursor pagination in
  // getJobs; search uses page offsets instead (searchJobs).
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const jobsPerPage = 10;

  const fetchJobs = async (pageNum = 0, filtersArg: SearchFilters | null = filters) => {
    try {
      setLoading(true);
      let data: PaginatedJobs;
      if (filtersArg) {
        data = await searchJobs(filtersArg, pageNum, jobsPerPage);
      } else {
        data = await getJobs(cursors[pageNum] ?? null, jobsPerPage);
      }
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      if (!filtersArg && data.nextCursor !== undefined) {
        setCursors((prev) => {
          const next = [...prev];
          next[pageNum + 1] = data.nextCursor || null;
          return next;
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(page);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = (searchFilters: SearchFilters) => {
    // Advanced search should never silently drop filters (Phase 1 fix).
    setFilters(searchFilters);
    setCursors([null]);
    setPage(0);
    fetchJobs(0, searchFilters);
  };

  const handleClearFilters = () => {
    setFilters(null);
    setCursors([null]);
    setPage(0);
    fetchJobs(0, null);
  };

  const totalPages = Math.ceil(total / jobsPerPage);
  // Browsing: there is a next page when the last fetch returned a cursor.
  // Searching: there is a next page while the page offset allows one.
  const hasNext = filters ? page + 1 < totalPages : cursors[page + 1] != null;

  const renderJobCard = (job: Job) => (
    <div key={job.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <Link to={`/jobs/${job.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
            {job.title}
          </Link>
          <p className="text-gray-600 mt-1">{job.company} • {job.location}</p>
          <p className="text-gray-500 text-sm mt-1">
            {job.type} • {job.experienceLevel} • {job.salary}
          </p>
          <p className="text-gray-700 mt-2 line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {job.skills?.slice(0, 5).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">
            Posted {new Date(job.postedDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {job.applicants?.length || 0} applicants
        </span>
        <Link
          to={`/jobs/${job.id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Jobs</h1>

      <AdvancedJobSearch onSearch={handleSearch} />

      {loading ? (
        <div className="text-center py-8">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            Showing {jobs.length} of {total} jobs
          </div>

          <div className="space-y-4">
            {jobs.map(renderJobCard)}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNext}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobList;
