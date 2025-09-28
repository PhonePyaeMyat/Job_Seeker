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
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'jobseeker' | 'employer';
  createdAt: string;
  updatedAt: string;
  bio?: string;
  location?: string;
  companyName?: string;
  status: 'active' | 'suspended' | 'pending';
}

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
  reportCount?: number;
}

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  newUsersThisWeek: number;
  newJobsThisWeek: number;
}

const AdminPanel: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'jobs' | 'reports' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const pageSize = 10;

  // Check if current user is admin (you can implement your own logic)
  const isAdmin = user?.email?.endsWith('@admin.com') || user?.email === 'admin@jobseeker.com';

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    loadInitialData();
  }, [user, isAdmin]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadJobs(),
        loadStats()
      ]);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (pageNum = 0, searchQuery = '') => {
    try {
      let q;
      if (pageNum === 0) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      } else if (lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        return; // No more pages
      }

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'active'
      } as User));

      if (searchQuery) {
        const filtered = usersData.filter(u => 
          u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setUsers(pageNum === 0 ? filtered : [...users, ...filtered]);
      } else {
        setUsers(pageNum === 0 ? usersData : [...users, ...usersData]);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };

  const loadJobs = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'jobs'), orderBy('postedDate', 'desc'))
      );
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'approved',
        reportCount: doc.data().reportCount || 0
      } as Job));
      setJobs(jobsData);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    }
  };

  const loadStats = async () => {
    try {
      const [usersSnapshot, jobsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'jobs'))
      ]);

      const allUsers = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      } as User));
      const allJobs = jobsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        status: doc.data().status || 'approved',
        active: doc.data().active || false,
        applicants: doc.data().applicants || []
      } as Job));

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const newUsersThisWeek = allUsers.filter(u => 
        new Date(u.createdAt) >= oneWeekAgo
      ).length;

      const newJobsThisWeek = allJobs.filter(j => 
        new Date(j.postedDate) >= oneWeekAgo
      ).length;

      const totalApplications = allJobs.reduce((sum, job) => 
        sum + (job.applicants?.length || 0), 0
      );

      setStats({
        totalUsers: allUsers.length,
        totalJobs: allJobs.length,
        activeJobs: allJobs.filter(j => j.active).length,
        pendingJobs: allJobs.filter(j => j.status === 'pending').length,
        totalApplications,
        newUsersThisWeek,
        newJobsThisWeek
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete' | 'promote') => {
    try {
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'suspend':
          await updateDoc(userRef, { status: 'suspended' });
          setSuccess('User suspended successfully');
          break;
        case 'activate':
          await updateDoc(userRef, { status: 'active' });
          setSuccess('User activated successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await deleteDoc(userRef);
            setSuccess('User deleted successfully');
          }
          break;
        case 'promote':
          await updateDoc(userRef, { role: 'admin' });
          setSuccess('User promoted to admin');
          break;
      }
      
      // Refresh users list
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleJobAction = async (jobId: string, action: 'approve' | 'reject' | 'delete' | 'feature') => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      
      switch (action) {
        case 'approve':
          await updateDoc(jobRef, { status: 'approved', active: true });
          setSuccess('Job approved successfully');
          break;
        case 'reject':
          await updateDoc(jobRef, { status: 'rejected', active: false });
          setSuccess('Job rejected successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            await deleteDoc(jobRef);
            setSuccess('Job deleted successfully');
          }
          break;
        case 'feature':
          await updateDoc(jobRef, { featured: true });
          setSuccess('Job featured successfully');
          break;
      }
      
      // Refresh jobs list
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating job:', err);
      setError('Failed to update job');
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredUsers = users.filter(user => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'jobseekers') return user.role === 'jobseeker';
    if (selectedFilter === 'employers') return user.role === 'employer';
    if (selectedFilter === 'suspended') return user.status === 'suspended';
    return true;
  });

  const filteredJobs = jobs.filter(job => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return job.status === 'pending';
    if (selectedFilter === 'approved') return job.status === 'approved';
    if (selectedFilter === 'rejected') return job.status === 'rejected';
    return true;
  });

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
        <h2 className="text-2xl font-bold mb-4">Please log in to access admin panel</h2>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <Link to="/" className="text-blue-600 hover:underline">Go back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage users, jobs, and system settings</p>
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
            {['dashboard', 'users', 'jobs', 'reports', 'settings'].map((tab) => (
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

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-blue-600 text-sm font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-blue-600 text-xs mt-1">+{stats.newUsersThisWeek} this week</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-green-600 text-sm font-medium">Total Jobs</p>
                        <p className="text-2xl font-bold text-green-700">{stats.totalJobs}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs mt-1">+{stats.newJobsThisWeek} this week</p>
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
                    <p className="text-yellow-600 text-xs mt-1">Need review</p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-purple-600 text-sm font-medium">Applications</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.totalApplications}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-purple-600 text-xs mt-1">Total submitted</p>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.displayName || 'No name'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'employer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map(job => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'approved' ? 'bg-green-100 text-green-800' :
                          job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search users by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="jobseekers">Job Seekers</option>
                    <option value="employers">Employers</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.companyName && (
                                <div className="text-sm text-gray-500">{user.companyName}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              user.role === 'employer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="text-red-600 hover:text-red-800 text-xs bg-red-100 px-2 py-1 rounded"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="text-green-600 hover:text-green-800 text-xs bg-green-100 px-2 py-1 rounded"
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => handleUserAction(user.id, 'delete')}
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

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search jobs by title or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Jobs</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Jobs Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
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
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.company}</div>
                              <div className="text-sm text-gray-500">{job.location}</div>
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.applicants?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.postedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {job.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleJobAction(job.id, 'approve')}
                                    className="text-green-600 hover:text-green-800 text-xs bg-green-100 px-2 py-1 rounded"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleJobAction(job.id, 'reject')}
                                    className="text-red-600 hover:text-red-800 text-xs bg-red-100 px-2 py-1 rounded"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {job.status === 'approved' && (
                                <button
                                  onClick={() => handleJobAction(job.id, 'feature')}
                                  className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                                >
                                  Feature
                                </button>
                              )}
                              <Link
                                to={`/jobs/${job.id}`}
                                className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                              >
                                View
                              </Link>
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

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">System Health</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database Status</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Response Time</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">~120ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Sessions</span>
                      <span className="text-sm font-medium">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="text-sm font-medium">2.4GB / 10GB</span>
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Job Report</p>
                      <p className="text-xs text-red-600">Inappropriate content reported in job posting #12345</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">User Report</p>
                      <p className="text-xs text-yellow-600">Spam behavior reported for user john@example.com</p>
                      <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">System Alert</p>
                      <p className="text-xs text-blue-600">High number of failed login attempts detected</p>
                      <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Chart placeholder - User registrations over time</p>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Job Postings</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Chart placeholder - Job postings over time</p>
                  </div>
                </div>
              </div>

              {/* Detailed Reports */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium mb-2">User Activity Report</h4>
                    <p className="text-sm text-gray-600">Export user engagement and activity data</p>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium mb-2">Job Performance Report</h4>
                    <p className="text-sm text-gray-600">Analyze job posting success rates</p>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium mb-2">Financial Report</h4>
                    <p className="text-sm text-gray-600">Revenue and cost analysis</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Platform Settings */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-approve jobs</h4>
                      <p className="text-sm text-gray-600">Automatically approve new job postings</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email notifications</h4>
                      <p className="text-sm text-gray-600">Send email notifications to admins</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Maintenance mode</h4>
                      <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>

              {/* Content Moderation */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Content Moderation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banned Keywords (comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="spam, inappropriate, offensive..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-moderation threshold
                    </label>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option>Low sensitivity</option>
                      <option>Medium sensitivity</option>
                      <option>High sensitivity</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Email Templates */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welcome Email Template
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Welcome to Job Seeker! We're excited to have you..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Approval Email Template
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your job posting has been approved..."
                    />
                  </div>
                </div>
              </div>

              {/* API Settings */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">API Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit (requests per hour)
                    </label>
                    <input
                      type="number"
                      defaultValue={1000}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key Expiration (days)
                    </label>
                    <input
                      type="number"
                      defaultValue={365}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Backup & Recovery */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Backup & Recovery</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Last Backup</h4>
                      <p className="text-sm text-gray-600">Yesterday at 3:00 AM</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Create Backup
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Backup</h4>
                      <p className="text-sm text-gray-600">Automatic daily backups at 3:00 AM</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSuccess('Settings saved successfully!')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save All Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;