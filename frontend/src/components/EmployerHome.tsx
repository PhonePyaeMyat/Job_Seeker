import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getEmployerApplications, Application } from '../services/jobService';

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

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplicationsToday: number;
  newApplicationsThisWeek: number;
  averageApplicationsPerJob: number;
  jobsNeedingAttention: number;
  recentlyFilled: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'job' | 'interview' | 'offer';
  message: string;
  time: string;
  jobTitle?: string;
}

const EmployerHome: React.FC = () => {
  const [user] = useAuthState(auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplicationsToday: 0,
    newApplicationsThisWeek: 0,
    averageApplicationsPerJob: 0,
    jobsNeedingAttention: 0,
    recentlyFilled: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadEmployerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEmployerData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [jobsData, applicationsData] = await Promise.all([
        loadJobs(),
        loadApplications(),
      ]);
      setJobs(jobsData);
      setApplications(applicationsData);
      // Stats and activity are computed from the returned data, not from
      // state — setState is async, so reading state right after setting it
      // would use the previous (stale) values (Phase 2 fix).
      calculateStats(applicationsData, jobsData);
      generateRecentActivity(applicationsData, jobsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async (): Promise<Job[]> => {
    if (!user) return [];
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('companyId', '==', user.uid)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    return jobsSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as Job[];
  };

  const loadApplications = async (): Promise<Application[]> => {
    if (!user) return [];
    // The server-side endpoint returns all of this employer's applications
    // (newest first) with real counts. This replaces the old query that
    // fetched applications per job with `where('jobId', 'in', jobIds)`,
    // which broke above 30 jobs and truncated the result to 5.
    const result = await getEmployerApplications();
    return result.applications;
  };

  const calculateStats = (applicationsData: Application[], jobsData: Job[]) => {
    const totalJobs = jobsData.length;
    const activeJobs = jobsData.filter((job) => job.active !== false).length;
    const totalApplications = applicationsData.length;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Applications store the date as `appliedAt` (a Timestamp or ISO
    // string) — the old code read a non-existent `appliedDate` field, so
    // these counts were always 0.
    const newApplicationsToday = applicationsData.filter((app) => {
      const appliedDate = app.appliedAt?.toDate ? app.appliedAt.toDate() : new Date(app.appliedAt);
      return appliedDate >= todayStart;
    }).length;

    const newApplicationsThisWeek = applicationsData.filter((app) => {
      const appliedDate = app.appliedAt?.toDate ? app.appliedAt.toDate() : new Date(app.appliedAt);
      return appliedDate >= weekStart;
    }).length;

    const averageApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0;

    const jobsNeedingAttention = jobsData.filter((job) => {
      const postedDate = new Date(job.postedDate);
      const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePosted > 30 && (job.applicants?.length || 0) < 5;
    }).length;

    const recentlyFilled = jobsData.filter((job) => {
      const postedDate = new Date(job.postedDate);
      const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePosted < 30 && (job.applicants?.length || 0) > 0;
    }).length;

    setStats({
      totalJobs,
      activeJobs,
      totalApplications,
      newApplicationsToday,
      newApplicationsThisWeek,
      averageApplicationsPerJob: Math.round(averageApplicationsPerJob * 10) / 10,
      jobsNeedingAttention,
      recentlyFilled,
    });
  };

  const generateRecentActivity = (applicationsData: Application[], jobsData: Job[]) => {
    const activities: RecentActivity[] = [];

    // Recent applications (newest first)
    applicationsData.slice(0, 5).forEach((app) => {
      const appliedDate = app.appliedAt?.toDate ? app.appliedAt.toDate() : new Date(app.appliedAt);
      activities.push({
        id: `app-${app.id}`,
        type: 'application',
        message: `${app.userName} applied to ${app.jobTitle}`,
        time: appliedDate.toLocaleDateString(),
        jobTitle: app.jobTitle,
      });
    });

    // Recent jobs
    jobsData.slice(0, 3).forEach((job) => {
      activities.push({
        id: `job-${job.id}`,
        type: 'job',
        message: `You posted ${job.title}`,
        time: new Date(job.postedDate).toLocaleDateString(),
        jobTitle: job.title,
      });
    });

    // Sort by time (most recent first) and take top 8
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 8));
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return '📄';
      case 'job':
        return '💼';
      case 'interview':
        return '🎯';
      case 'offer':
        return '🎉';
      default:
        return '📋';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Employer'}!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your job postings today.</p>
        </div>
        <Link
          to="/post-job"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
        >
          Post New Job
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              <p className="text-sm text-gray-500">{stats.activeJobs} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              <p className="text-sm text-gray-500">{stats.newApplicationsToday} new today</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newApplicationsThisWeek}</p>
              <p className="text-sm text-gray-500">New applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. per Job</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageApplicationsPerJob}</p>
              <p className="text-sm text-gray-500">Applications per job</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/post-job" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">➕</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Post a Job</h3>
              <p className="text-sm text-gray-600">Create a new job posting</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">View Analytics</h3>
              <p className="text-sm text-gray-600">Detailed insights and reports</p>
            </div>
          </div>
        </Link>

        <Link to="/profile" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Company Profile</h3>
              <p className="text-sm text-gray-600">Update your company info</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No applications yet.</p>
              <p className="text-sm text-gray-400 mt-2">Applications will appear here once candidates apply to your jobs.</p>
            </div>
          ) : (
            <div className="divide-y">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{app.userName}</h3>
                      <p className="text-sm text-gray-600">{app.userEmail}</p>
                      <p className="text-sm text-gray-500">Applied to {app.jobTitle}</p>
                      <p className="text-xs text-gray-400">
                        {app.appliedAt?.toDate
                          ? app.appliedAt.toDate().toLocaleDateString()
                          : new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No recent activity.</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-start">
                  <span className="text-2xl mr-3">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your Jobs */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Jobs</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Manage All →
          </Link>
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
            {jobs.slice(0, 5).map((job) => (
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

      {/* Insights */}
      {(stats.jobsNeedingAttention > 0 || stats.recentlyFilled > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Insights</h3>
          <div className="space-y-2">
            {stats.jobsNeedingAttention > 0 && (
              <p className="text-blue-800">
                • You have {stats.jobsNeedingAttention} job{stats.jobsNeedingAttention > 1 ? 's' : ''} posted 30+ days ago with fewer than 5 applicants. Consider updating the job description or salary.
              </p>
            )}
            {stats.recentlyFilled > 0 && (
              <p className="text-blue-800">
                • {stats.recentlyFilled} of your jobs posted in the last 30 days have received applications. Great job!
              </p>
            )}
            {stats.averageApplicationsPerJob > 10 && (
              <p className="text-blue-800">
                • Your jobs are getting good traction with an average of {stats.averageApplicationsPerJob} applications per job.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerHome;
