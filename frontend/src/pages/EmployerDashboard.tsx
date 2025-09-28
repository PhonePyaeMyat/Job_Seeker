import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  limit
} from 'firebase/firestore';
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
  active: boolean;
  applicants: string[];
  status: 'approved' | 'pending' | 'rejected';
  featured?: boolean;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter?: string;
  resumeUrl?: string;
}

interface EmployerStats {
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  newApplicationsToday: number;
  totalViews: number;
}

const EmployerDashboard: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadJobs(),
        loadApplications(),
        loadStats()
      ]);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('company', '==', user?.displayName || ''),
        orderBy('postedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'approved',
        active: doc.data().active || false,
        applicants: doc.data().applicants || []
      } as Job));
      setJobs(jobsData);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    }
  };

  const loadApplications = async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('companyId', '==', user?.uid),
        orderBy('appliedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending'
      } as Application));
      setApplications(applicationsData);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications');
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalApplications = applications.length;
      const newApplicationsToday = applications.filter(app => 
        new Date(app.appliedDate) >= today
      ).length;

      setStats({
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.active).length,
        pendingJobs: jobs.filter(j => j.status === 'pending').length,
        totalApplications,
        newApplicationsToday,
        totalViews: jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0)
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleJobAction = async (jobId: string, action: 'activate' | 'deactivate' | 'delete' | 'feature') => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      
      switch (action) {
        case 'activate':
          await updateDoc(jobRef, { active: true });
          setSuccess('Job activated successfully');
          break;
        case 'deactivate':
          await updateDoc(jobRef, { active: false });
          setSuccess('Job deactivated successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this job?')) {
            await deleteDoc(jobRef);
            setSuccess('Job deleted successfully');
          }
          break;
        case 'feature':
          await updateDoc(jobRef, { featured: true });
          setSuccess('Job featured successfully');
          break;
      }
      
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating job:', err);
      setError('Failed to update job');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject' | 'review') => {
    try {
      const appRef = doc(db, 'applications', applicationId);
      
      switch (action) {
        case 'accept':
          await updateDoc(appRef, { status: 'accepted' });
          setSuccess('Application accepted');
          break;
        case 'reject':
          await updateDoc(appRef, { status: 'rejected' });
          setSuccess('Application rejected');
          break;
        case 'review':
          await updateDoc(appRef, { status: 'reviewed' });
          setSuccess('Application marked as reviewed');
          break;
      }
      
      await loadApplications();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating application:', err);
      setError('Failed to update application');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600">Manage your job postings and applications</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="font-medium">{user.displayName || user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['overview', 'jobs', 'applications', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Success/Error Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-blue-600 text-sm font-medium">Total Jobs</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalJobs}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-blue-600 text-xs mt-1">{stats.activeJobs} active</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-green-600 text-sm font-medium">Applications</p>
                        <p className="text-2xl font-bold text-green-700">{stats.totalApplications}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs mt-1">+{stats.newApplicationsToday} today</p>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-yellow-600 text-sm font-medium">Pending Jobs</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pendingJobs}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-yellow-600 text-xs mt-1">Awaiting approval</p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-purple-600 text-sm font-medium">Total Views</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.totalViews}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-purple-600 text-xs mt-1">Job page views</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/post-job"
                      className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Post New Job
                    </Link>
                    <Link
                      to="/profile"
                      className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
                    >
                      Update Company Profile
                    </Link>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Review Applications
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map(application => (
                      <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{application.applicantName}</p>
                          <p className="text-xs text-gray-600">Applied to {application.jobTitle}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-gray-500 text-sm">No recent applications</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Job Postings</h3>
                <Link
                  to="/post-job"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post New Job
                </Link>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.location} • {job.type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'approved' ? 'bg-green-100 text-green-800' :
                              job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {job.status}
                            </span>
                            {job.featured && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Featured
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.applicants?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.postedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Link
                                to={`/jobs/${job.id}`}
                                className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                              >
                                View
                              </Link>
                              {job.active ? (
                                <button
                                  onClick={() => handleJobAction(job.id, 'deactivate')}
                                  className="text-yellow-600 hover:text-yellow-800 text-xs bg-yellow-100 px-2 py-1 rounded"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleJobAction(job.id, 'activate')}
                                  className="text-green-600 hover:text-green-800 text-xs bg-green-100 px-2 py-1 rounded"
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => handleJobAction(job.id, 'delete')}
                                className="text-red-600 hover:text-red-800 text-xs bg-red-100 px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Job Applications</h3>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{application.applicantName}</div>
                              <div className="text-sm text-gray-500">{application.applicantEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {application.jobTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(application.appliedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'accept')}
                                    className="text-green-600 hover:text-green-800 text-xs bg-green-100 px-2 py-1 rounded"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'reject')}
                                    className="text-red-600 hover:text-red-800 text-xs bg-red-100 px-2 py-1 rounded"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleApplicationAction(application.id, 'review')}
                                className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Analytics & Insights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Job Performance</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Most Popular Job</span>
                      <span className="text-sm font-medium">
                        {jobs.length > 0 ? jobs[0].title : 'No jobs posted'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Applications per Job</span>
                      <span className="text-sm font-medium">
                        {jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Response Rate</span>
                      <span className="text-sm font-medium">
                        {applications.length > 0 ? 
                          Math.round((applications.filter(app => app.status !== 'pending').length / applications.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Recent Trends</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Applications This Week</span>
                      <span className="text-sm font-medium">{stats?.newApplicationsToday || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Job Postings</span>
                      <span className="text-sm font-medium">{stats?.activeJobs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Job Views</span>
                      <span className="text-sm font-medium">{stats?.totalViews || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard; 