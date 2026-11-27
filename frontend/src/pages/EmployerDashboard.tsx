import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  getEmployerApplications,
  updateApplicationStatus,
  Application,
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
} from '../services/jobService';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  active: boolean;
  postedDate: string;
  expiryDate: string;
  applicants: string[];
  status?: string;
  companyId?: string;
}

type DateRange = 'all' | 'today' | '7d' | '30d';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-blue-100 text-blue-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function dateRangeToFromTo(range: DateRange): { from?: string; to?: string } {
  const now = new Date();
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (range === '7d') {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  }
  if (range === '30d') {
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
  }
  return {};
}

const EmployerDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<Record<ApplicationStatus, number>>({
    pending: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      // Jobs posted by this employer (companyId is stamped server-side as
      // the poster's uid — see POST /jobs in functions/index.js).
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', user.uid),
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = jobsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Job[];
      setJobs(jobsData);

      // Real applications, filtered by the chosen date range on the server.
      const { from, to } = dateRangeToFromTo(dateRange);
      const result = await getEmployerApplications({ from, to });
      setApplications(result.applications);
      setCounts(result.counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (applicationId: string, status: ApplicationStatus) => {
    setUpdatingId(applicationId);
    try {
      const updated = await updateApplicationStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: updated.status } : a)),
      );
      setCounts((prev) => {
        const old = applications.find((a) => a.id === applicationId);
        if (!old || old.status === status) return prev;
        return {
          ...prev,
          [old.status]: Math.max(0, prev[old.status] - 1),
          [status]: prev[status] + 1,
        };
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats are computed from the real applications fetched above — never
  // estimated. (Phase 1 found the old code estimated them as
  // total × 0.1 / × 0.3.)
  const totalApplications = applications.length;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newToday = applications.filter((a) => new Date(a.appliedAt || 0) >= todayStart).length;
  const newThisWeek = applications.filter((a) => new Date(a.appliedAt || 0) >= weekStart).length;
  const activeJobs = jobs.filter((job) => job.active !== false).length;
  const applicationRate = jobs.length > 0
    ? (totalApplications / jobs.length).toFixed(1)
    : '0';

  const jobsNeedingAttention = jobs.filter((job) => {
    const postedDate = new Date(job.postedDate);
    const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSincePosted > 30 && (job.applicants?.length || 0) < 5;
  }).length;

  // Average days between a job being posted and its first application is
  // the closest proxy we have for time-to-fill; a real time-to-fill needs
  // a hired timestamp, which the pipeline does not record yet.
  const averageTimeToFill = jobs.length > 0
    ? Math.round(jobs.reduce((sum, job) => {
      const postedDate = new Date(job.postedDate);
      return sum + Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    }, 0) / jobs.length)
    : 0;

  const recentlyFilled = jobs.filter((job) => {
    const postedDate = new Date(job.postedDate);
    const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSincePosted < 30 && (job.applicants?.length || 0) > 0;
  }).length;

  const visibleApplications = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Employer Dashboard</h1>
        <Link
          to="/post-job"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Post New Job
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
          <p className="text-sm text-gray-500">{activeJobs} active</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Applications</h3>
          <p className="text-3xl font-bold text-green-600">{totalApplications}</p>
          <p className="text-sm text-gray-500">{newToday} new today</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Applications This Week</h3>
          <p className="text-3xl font-bold text-purple-600">{newThisWeek}</p>
          <p className="text-sm text-gray-500">Last 7 days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Avg. Applications per Job</h3>
          <p className="text-3xl font-bold text-orange-600">{applicationRate}</p>
          <p className="text-sm text-gray-500">Across all jobs</p>
        </div>
      </div>

      {/* Application status breakdown — real counts from the API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`bg-white p-4 rounded-lg shadow text-left hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-sm text-gray-500">{APPLICATION_STATUS_LABELS[status]}</p>
            <p className="text-2xl font-bold">{counts[status]}</p>
            <p className="text-xs text-blue-600">{statusFilter === status ? 'Click to clear' : 'Click to filter'}</p>
          </button>
        ))}
      </div>

      {/* Job Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Jobs Needing Attention</h3>
          <p className="text-3xl font-bold text-red-600">{jobsNeedingAttention}</p>
          <p className="text-sm text-gray-500">Posted 30+ days ago with fewer than 5 applicants</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recently Filled</h3>
          <p className="text-3xl font-bold text-green-600">{recentlyFilled}</p>
          <p className="text-sm text-gray-500">Jobs posted in the last 30 days with applicants</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Average Job Age</h3>
          <p className="text-3xl font-bold text-blue-600">{averageTimeToFill} days</p>
          <p className="text-sm text-gray-500">Average days since posting</p>
        </div>
      </div>

      {/* Applications — the status pipeline in action */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between">
          <h2 className="text-xl font-semibold">
            Applications {dateRange !== 'all' && (
              <span className="text-sm font-normal text-gray-500">
                ({dateRange === 'today' ? 'today' : dateRange === '7d' ? 'last 7 days' : 'last 30 days'})
              </span>
            )}
          </h2>
          <div className="flex gap-2 items-center">
            <label htmlFor="dateRange" className="text-sm text-gray-600">Date range</label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <label htmlFor="statusFilter" className="text-sm text-gray-600">Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All statuses</option>
              {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
        {visibleApplications.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 text-center">
            No applications {statusFilter !== 'all' ? `with status ${APPLICATION_STATUS_LABELS[statusFilter]}` : 'yet'}.
          </p>
        ) : (
          <ul className="divide-y">
            {visibleApplications.map((app) => (
              <li key={app.id} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{app.userName} <span className="text-gray-500 font-normal">({app.userEmail})</span></p>
                  <p className="text-sm text-gray-600">
                    {app.jobTitle} • Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                  </p>
                  {app.cvFile?.url && (
                    <a
                      href={app.cvFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View CV ({app.cvFile.name})
                    </a>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[app.status]}`}>
                  {APPLICATION_STATUS_LABELS[app.status]}
                </span>
                <select
                  value={app.status}
                  disabled={updatingId === app.id}
                  onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  className="border rounded px-2 py-1 text-sm"
                  aria-label={`Change status for ${app.userName}`}
                >
                  {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                    <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Your Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">You haven't posted any jobs yet.</p>
            <Link
              to="/post-job"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => (
              <div key={job.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-600">
                    {job.location} • {job.type} • {job.salary}
                  </p>
                  <p className="text-sm text-gray-500">
                    {job.applicants?.length || 0} applicants • Posted {new Date(job.postedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    job.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.active ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
