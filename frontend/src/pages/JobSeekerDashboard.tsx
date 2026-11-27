import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getUserApplications, Job, Application, APPLICATION_STATUS_LABELS, ApplicationStatus } from '../services/jobService';

interface SavedJob {
  id: string;
  jobId: string;
  userId: string;
  savedAt: any;
  job?: Job;
}

interface AppliedEntry {
  application: Application;
  job?: Job;
}

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-blue-100 text-blue-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const JobSeekerDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [appliedEntries, setAppliedEntries] = useState<AppliedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'applied'>('saved');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Load saved jobs
      const savedJobsQuery = query(
        collection(db, 'savedJobs'),
        where('userId', '==', user.uid)
      );
      const savedJobsSnapshot = await getDocs(savedJobsQuery);
      const savedJobsData = savedJobsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as SavedJob[];

      // Fetch job details for saved jobs
      for (const savedJob of savedJobsData) {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', savedJob.jobId));
          if (jobDoc.exists()) {
            savedJob.job = { id: jobDoc.id, ...jobDoc.data() } as Job;
          }
        } catch (err) {
          console.error('Error fetching job details:', err);
        }
      }

      setSavedJobs(savedJobsData);

      // Load applied jobs — one application record per job, with its real
      // status (pending / interview / offer / rejected) and real applied
      // date. The job's posted date is shown separately.
      const applications = await getUserApplications(user.uid);
      const entries: AppliedEntry[] = [];
      for (const application of applications) {
        let job: Job | undefined;
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', application.jobId));
          if (jobDoc.exists()) {
            job = { id: jobDoc.id, ...jobDoc.data() } as Job;
          }
        } catch (err) {
          console.error('Error fetching job details:', err);
        }
        entries.push({ application, job });
      }
      setAppliedEntries(entries);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (savedJobId: string) => {
    try {
      await deleteDoc(doc(db, 'savedJobs', savedJobId));
      setSavedJobs(savedJobs.filter(job => job.id !== savedJobId));
    } catch (err: any) {
      setError(err.message || 'Failed to unsave job');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-blue-100 text-blue-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Counts are real: they come from the application records, not estimates.
  const applicationCount = appliedEntries.length;
  const interviewCount = appliedEntries.filter((e) => e.application.status === 'interview').length;
  const offerCount = appliedEntries.filter((e) => e.application.status === 'offer').length;
  const rejectedCount = appliedEntries.filter((e) => e.application.status === 'rejected').length;
  const visibleApplied = statusFilter === 'all'
    ? appliedEntries
    : appliedEntries.filter((e) => e.application.status === statusFilter);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Applications</h3>
          <p className="text-3xl font-bold text-blue-600">{applicationCount}</p>
          <p className="text-sm text-gray-500">Total applied</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Interviews</h3>
          <p className="text-3xl font-bold text-green-600">{interviewCount}</p>
          <p className="text-sm text-gray-500">In interview stage</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Offers</h3>
          <p className="text-3xl font-bold text-purple-600">{offerCount}</p>
          <p className="text-sm text-gray-500">Offers received</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-sm text-gray-500">Not successful</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Saved Jobs</h3>
          <p className="text-3xl font-bold text-orange-600">{savedJobs.length}</p>
          <p className="text-sm text-gray-500">Jobs saved</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Jobs ({savedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applied'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Applied Jobs ({applicationCount})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'saved' ? (
            savedJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't saved any jobs yet.</p>
                <Link
                  to="/jobs"
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedJobs.map((savedJob) => (
                  <div key={savedJob.id} className="border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <Link
                        to={`/jobs/${savedJob.jobId}`}
                        className="text-lg font-semibold text-blue-600 hover:underline"
                      >
                        {savedJob.job?.title || 'Job not found'}
                      </Link>
                      <p className="text-gray-600">
                        {savedJob.job?.company} • {savedJob.job?.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {savedJob.job?.type} • {savedJob.job?.salary}
                      </p>
                      <p className="text-sm text-gray-400">
                        Saved on {formatDate(savedJob.savedAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/jobs/${savedJob.jobId}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleUnsaveJob(savedJob.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="appliedStatusFilter" className="text-sm text-gray-600">Filter by status</label>
                <select
                  id="appliedStatusFilter"
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
              {visibleApplied.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {statusFilter === 'all'
                      ? "You haven't applied to any jobs yet."
                      : `No applications with status ${APPLICATION_STATUS_LABELS[statusFilter]}.`}
                  </p>
                  <Link
                    to="/jobs"
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleApplied.map(({ application, job }) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            to={`/jobs/${application.jobId}`}
                            className="text-lg font-semibold text-blue-600 hover:underline"
                          >
                            {job?.title || application.jobTitle}
                          </Link>
                          <p className="text-gray-600">
                            {job?.company || application.companyName} • {job?.location}
                          </p>
                          <p className="text-sm text-gray-500">
                            {job?.type} • {job?.salary}
                          </p>
                          <p className="text-sm text-gray-500">
                            Applied on {formatDate(application.appliedAt)}
                            {job?.postedDate && ` • Job posted on ${formatDate(job.postedDate)}`}
                          </p>
                          {application.cvFile?.url && (
                            <a
                              href={application.cvFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View submitted CV ({application.cvFile.name})
                            </a>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[application.status] || getStatusColor(application.status)}`}>
                          {APPLICATION_STATUS_LABELS[application.status] || application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
