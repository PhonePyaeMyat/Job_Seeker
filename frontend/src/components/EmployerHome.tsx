import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
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
}

interface EnhancedStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplicationsToday: number;
  newApplicationsThisWeek: number;
  applicationRate: number; // applications per job
  averageTimeToFill: number; // days
  jobsNeedingAttention: number; // jobs with no applications
  recentlyFilled: number; // jobs filled in last 30 days
}

const EmployerHome: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<EnhancedStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplicationsToday: 0,
    newApplicationsThisWeek: 0,
    applicationRate: 0,
    averageTimeToFill: 0,
    jobsNeedingAttention: 0,
    recentlyFilled: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Debug logging
  console.log('EmployerHome - User:', user?.email, 'Role:', localStorage.getItem('role'));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadEmployerData();
  }, [user]);

  const loadEmployerData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadJobs(),
        loadApplications()
      ]);
      // Calculate stats and activity after data is loaded
      await calculateStats();
      generateRecentActivity();
    } catch (err: any) {
      console.error('Error loading employer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      // Use companyId instead of company name to avoid index issues
      const q = query(
        collection(db, 'jobs'),
        where('companyId', '==', user?.uid || ''),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'approved',
        active: doc.data().active || false,
        applicants: doc.data().applicants || []
      } as Job));
      
      // Sort by postedDate on the client side to avoid index requirement
      const sortedJobs = jobsData.sort((a, b) => 
        new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      );
      
      setJobs(sortedJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const loadApplications = async () => {
    try {
      // First get all jobs by this employer
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', user?.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobIds = jobsSnapshot.docs.map(doc => doc.id);
      
      if (jobIds.length === 0) {
        setApplications([]);
        return;
      }
      
      // Then get applications for those jobs
      const q = query(
        collection(db, 'applications'),
        where('jobId', 'in', jobIds),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending'
      } as Application));
      
      // Sort by appliedDate on client side
      const sortedApplications = applicationsData.sort((a, b) => 
        new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      );
      
      setApplications(sortedApplications);
    } catch (err) {
      console.error('Error loading applications:', err);
      // Set empty array on error to prevent UI issues
      setApplications([]);
    }
  };

  const calculateStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const newApplicationsToday = applications.filter(app => 
        new Date(app.appliedDate) >= today
      ).length;

      const newApplicationsThisWeek = applications.filter(app => 
        new Date(app.appliedDate) >= weekAgo
      ).length;

      const activeJobs = jobs.filter(j => j.active);
      const applicationRate = activeJobs.length > 0 ? 
        (applications.length / activeJobs.length) : 0;

      const jobsNeedingAttention = activeJobs.filter(job => 
        (job.applicants?.length || 0) === 0
      ).length;

      // Calculate average time to fill (simplified - using job age for active jobs)
      const averageTimeToFill = activeJobs.length > 0 ? 
        activeJobs.reduce((sum, job) => {
          const daysSincePosted = Math.floor(
            (new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + daysSincePosted;
        }, 0) / activeJobs.length : 0;

      // Recently filled jobs (jobs that are no longer active and had applications)
      const recentlyFilled = jobs.filter(job => 
        !job.active && (job.applicants?.length || 0) > 0
      ).length;

      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalApplications: applications.length,
        newApplicationsToday,
        newApplicationsThisWeek,
        applicationRate: Math.round(applicationRate * 10) / 10,
        averageTimeToFill: Math.round(averageTimeToFill),
        jobsNeedingAttention,
        recentlyFilled
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  const generateRecentActivity = () => {
    const activities: any[] = [];
    
    // Add recent applications
    applications.slice(0, 3).forEach(app => {
      activities.push({
        id: `app-${app.id}`,
        type: 'application',
        title: `New application for ${app.jobTitle}`,
        subtitle: `From ${app.applicantName}`,
        time: app.appliedDate,
        icon: '👤',
        color: 'blue'
      });
    });

    // Add jobs needing attention
    const jobsNeedingAttention = jobs.filter(job => 
      job.active && (job.applicants?.length || 0) === 0
    );
    
    jobsNeedingAttention.slice(0, 2).forEach(job => {
      const daysSincePosted = Math.floor(
        (new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      activities.push({
        id: `job-${job.id}`,
        type: 'job_attention',
        title: `${job.title} needs attention`,
        subtitle: `Posted ${daysSincePosted} days ago, no applications yet`,
        time: job.postedDate,
        icon: '⚠️',
        color: 'orange'
      });
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    setRecentActivity(activities.slice(0, 5));
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Job Seeker</h1>
          <p className="text-gray-600 mb-8">Please log in to access your employer dashboard</p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4">Welcome back, {user.displayName || 'Employer'}!</h1>
            <p className="text-xl mb-6">Manage your job postings and find the perfect candidates</p>
            <div className="flex space-x-4">
              <Link
                to="/post-job"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Post New Job
              </Link>
              <Link
                to="/profile"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Update Profile
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{stats.activeJobs} active • {stats.recentlyFilled} filled</p>
        </div>

        {/* Applications */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">+{stats.newApplicationsToday} today • +{stats.newApplicationsThisWeek} this week</p>
        </div>

        {/* Application Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Application Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.applicationRate}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Applications per job</p>
        </div>

        {/* Jobs Needing Attention */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-gray-900">{stats.jobsNeedingAttention}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Jobs with no applications</p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <span className="text-sm text-gray-500">Live updates</span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    activity.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
            <Link
              to="/post-job"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Post New Job
            </Link>
          </div>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No jobs posted yet</p>
                <Link
                  to="/post-job"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post Your First Job
                </Link>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.location} • {job.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'approved' ? 'bg-green-100 text-green-800' :
                      job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {job.applicants?.length || 0} applications
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
            <Link
              to="/profile"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Manage Profile
            </Link>
          </div>
          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No applications yet</p>
              </div>
            ) : (
              applications.map(application => (
                <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{application.applicantName}</p>
                    <p className="text-xs text-gray-500">Applied to {application.jobTitle}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {application.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to find your next great hire?</h3>
        <p className="text-gray-600 mb-6">Post a job and start receiving applications from qualified candidates</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/post-job"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Post a Job
          </Link>
          <Link
            to="/profile"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Update Company Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployerHome;
