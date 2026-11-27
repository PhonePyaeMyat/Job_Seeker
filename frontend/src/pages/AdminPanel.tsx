import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
} from 'firebase/firestore';
import { setCompanyVerified } from '../services/companyService';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'jobseeker' | 'employer' | 'admin';
  createdAt: string;
  companyName?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  active: boolean;
  status: string;
  postedBy: string;
  postedDate: string;
  applicants: string[];
}

interface CompanyRow {
  employerId: string;
  displayName: string;
  email: string;
  companyName: string;
  verified: boolean;
}

const AdminPanel: React.FC = () => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'companies' | 'reports' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadJobs(), loadCompanies()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as User[];
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      throw err;
    }
  };

  const loadJobs = async (loadMore = false) => {
    try {
      let jobsQuery;
      if (loadMore && lastVisible) {
        jobsQuery = query(
          collection(db, 'jobs'),
          orderBy('postedDate', 'desc'),
          startAfter(lastVisible),
          limit(20)
        );
      } else {
        jobsQuery = query(
          collection(db, 'jobs'),
          orderBy('postedDate', 'desc'),
          limit(20)
        );
      }

      const snapshot = await getDocs(jobsQuery);
      const jobsData = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Job[];

      if (loadMore) {
        setJobs((prev) => [...prev, ...jobsData]);
      } else {
        setJobs(jobsData);
      }

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 20);
    } catch (err: any) {
      console.error('Error loading jobs:', err);
      throw err;
    }
  };

  // Companies: one row per employer account, merged with the companies
  // document (if any) for the verified flag. Employers who signed up
  // before company records existed have no document yet — they show as
  // unverified and verifying them creates the record.
  const loadCompanies = async () => {
    try {
      const employersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'employer'),
        limit(50),
      );
      const employersSnapshot = await getDocs(employersQuery);
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const verifiedById: Record<string, boolean> = {};
      const nameById: Record<string, string> = {};
      companiesSnapshot.docs.forEach((d) => {
        verifiedById[d.id] = d.data().verified === true;
        nameById[d.id] = d.data().name || '';
      });
      const rows: CompanyRow[] = employersSnapshot.docs.map((d) => {
        const data = d.data();
        return {
          employerId: d.id,
          displayName: data.displayName || '',
          email: data.email || '',
          companyName: nameById[d.id] || data.companyName || '',
          verified: verifiedById[d.id] || false,
        };
      });
      setCompanies(rows);
    } catch (err: any) {
      console.error('Error loading companies:', err);
      throw err;
    }
  };

  const handleCompanyVerify = async (row: CompanyRow, verified: boolean) => {
    try {
      setError('');
      setSuccess('');
      await setCompanyVerified(row.employerId, row.employerId, row.companyName, verified);
      await loadCompanies();
      setSuccess(
        verified
          ? `${row.companyName || row.email} is now verified.`
          : `${row.companyName || row.email} is no longer verified.`,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update verification');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'jobseeker' | 'employer' | 'admin') => {
    try {
      setError('');
      setSuccess('');
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccess(`User role updated to ${newRole}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await deleteDoc(doc(db, 'users', userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccess('User deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {
    try {
      setError('');
      setSuccess('');
      await updateDoc(doc(db, 'jobs', jobId), {
        status: newStatus,
        active: newStatus === 'approved',
      });
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: newStatus, active: newStatus === 'approved' } : job
        )
      );
      setSuccess(`Job status updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setSuccess('Job deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.displayName.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employer':
        return 'bg-blue-100 text-blue-800';
      case 'jobseeker':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin panel...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Jobs</h3>
          <p className="text-3xl font-bold text-green-600">{jobs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pending Jobs</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {jobs.filter((job) => job.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Verified Companies</h3>
          <p className="text-3xl font-bold text-purple-600">
            {companies.filter((c) => c.verified).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {(['users', 'jobs', 'companies', 'reports', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          {(activeTab === 'users' || activeTab === 'jobs' || activeTab === 'companies') && (
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              {activeTab === 'users' && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Roles</option>
                  <option value="jobseeker">Job Seeker</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              {activeTab === 'jobs' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
            </div>
          )}

          {activeTab === 'users' && (
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
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userData.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role)}`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            value={userData.role}
                            onChange={(e) => handleRoleChange(userData.id, e.target.value as 'jobseeker' | 'employer' | 'admin')}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="jobseeker">Job Seeker</option>
                            <option value="employer">Employer</option>
                            <option value="admin">Admin</option>
                          </select>
                          {userData.id !== user?.uid && (
                            <button
                              onClick={() => handleDeleteUser(userData.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="text-center py-8 text-gray-500">No users found.</p>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
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
                        Applicants
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
                      <tr key={job.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.company} • {job.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status || 'pending')}`}>
                            {job.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.applicants?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.postedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <select
                              value={job.status || 'pending'}
                              onChange={(e) => handleJobStatusChange(job.id, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredJobs.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No jobs found.</p>
                )}
              </div>
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => loadJobs(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Load More Jobs
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="overflow-x-auto">
              <p className="text-sm text-gray-600 mb-4">
                Verify an employer to show a Verified badge on their company profile
                and job listings. Only an admin can change this — an employer cannot
                verify their own company (enforced by the Firestore rules).
              </p>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((row) => (
                    <tr key={row.employerId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {row.companyName || 'No company record yet'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {row.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{row.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.verified ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCompanyVerify(row, !row.verified)}
                          className={row.verified ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        >
                          {row.verified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCompanies.length === 0 && (
                <p className="text-center py-8 text-gray-500">No employers found.</p>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">User Growth</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter((u) => u.role === 'jobseeker').length}
                  </p>
                  <p className="text-sm text-blue-700">Job seekers registered</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Employer Growth</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter((u) => u.role === 'employer').length}
                  </p>
                  <p className="text-sm text-green-700">Employers registered</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900">Job Postings</h3>
                  <p className="text-2xl font-bold text-purple-600">{jobs.length}</p>
                  <p className="text-sm text-purple-700">Total jobs posted</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">System Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Database Status</p>
                    <p className="font-medium text-green-600">● Connected</p>
                  </div>
                  <div>
                    <p className="text-gray-600">API Response Time</p>
                    <p className="font-medium">~120ms</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Active Sessions</p>
                    <p className="font-medium">24</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job Auto-Approval</p>
                      <p className="text-sm text-gray-500">Automatically approve new job postings</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Send email notifications to users</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-500">Put the platform in maintenance mode</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
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

export default AdminPanel;
