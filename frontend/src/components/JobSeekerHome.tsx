import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  orderBy, 
  where,
  limit
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import JobSearch from './JobSearch';
import JobCard from './JobCard';

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

interface JobSeekerStats {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  profileViews: number;
}

const JobSeekerHome: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [stats, setStats] = useState<JobSeekerStats | null>(null);
  const [searchFilters, setSearchFilters] = useState<{ keyword: string; location: string; type: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'recent' | 'saved'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load jobs regardless of user login status for job seekers
    loadJobSeekerData();
  }, []); // Remove user dependency

  const loadJobSeekerData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadAllJobs(),
        loadFeaturedJobs(),
        loadRecentJobs(),
        loadSavedJobs(),
        loadStats()
      ]);
    } catch (err: any) {
      console.error('Error loading job seeker data:', err);
      setError(`Failed to load jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllJobs = async () => {
    try {
      // First try to load all jobs without complex filters
      const jobsRef = collection(db, 'jobs');
      let q;

      try {
        // Try with full query first
        q = query(
          jobsRef,
          where('active', '==', true),
          orderBy('postedDate', 'desc'),
          limit(20)
        );
      } catch (queryError) {
        console.warn('Complex query failed, trying simple query:', queryError);
        // Fallback to simpler query
        q = query(jobsRef, limit(20));
      }

      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Job',
          company: data.company || 'Unknown Company',
          location: data.location || 'Location TBD',
          type: data.type || 'FULL_TIME',
          salary: data.salary || 'Salary TBD',
          postedDate: data.postedDate || new Date().toISOString(),
          description: data.description || 'No description available',
          active: data.active !== false, // Default to true
          applicants: data.applicants || [],
          status: data.status || 'approved',
          featured: data.featured || false
        } as Job;
      });

      console.log('Loaded jobs:', jobsData.length);
      setJobs(jobsData);
    } catch (err) {
      console.error('Error loading all jobs:', err);
      // Try to load without any filters as absolute fallback
      try {
        const snapshot = await getDocs(collection(db, 'jobs'));
        const jobsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          active: doc.data().active !== false,
          applicants: doc.data().applicants || [],
          status: doc.data().status || 'approved'
        } as Job));
        console.log('Fallback: Loaded jobs without filters:', jobsData.length);
        setJobs(jobsData);
      } catch (fallbackErr) {
        console.error('Even fallback query failed:', fallbackErr);
        throw fallbackErr;
      }
    }
  };

  const loadFeaturedJobs = async () => {
    try {
      let q;
      try {
        q = query(
          collection(db, 'jobs'),
          where('featured', '==', true),
          limit(6)
        );
      } catch (queryError) {
        // If featured query fails, just return empty array
        console.warn('Featured jobs query failed:', queryError);
        setFeaturedJobs([]);
        return;
      }

      const snapshot = await getDocs(q);
      const featuredData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        active: doc.data().active !== false,
        applicants: doc.data().applicants || [],
        status: doc.data().status || 'approved'
      } as Job));
      
      console.log('Loaded featured jobs:', featuredData.length);
      setFeaturedJobs(featuredData);
    } catch (err) {
      console.error('Error loading featured jobs:', err);
      setFeaturedJobs([]);
    }
  };

  const loadRecentJobs = async () => {
    try {
      let q;
      try {
        q = query(
          collection(db, 'jobs'),
          orderBy('postedDate', 'desc'),
          limit(8)
        );
      } catch (queryError) {
        console.warn('Recent jobs query failed:', queryError);
        // Use jobs from loadAllJobs as fallback
        setRecentJobs(jobs.slice(0, 8));
        return;
      }

      const snapshot = await getDocs(q);
      const recentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        active: doc.data().active !== false,
        applicants: doc.data().applicants || [],
        status: doc.data().status || 'approved'
      } as Job));
      
      console.log('Loaded recent jobs:', recentData.length);
      setRecentJobs(recentData);
    } catch (err) {
      console.error('Error loading recent jobs:', err);
      // Use first 8 jobs as fallback
      setRecentJobs(jobs.slice(0, 8));
    }
  };

  const loadSavedJobs = async () => {
    if (!user) {
      setSavedJobs([]);
      setSavedJobIds([]);
      return;
    }

    try {
      // Get user's saved job IDs from their profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedIds = userData.savedJobs || [];
        setSavedJobIds(savedIds);

        if (savedIds.length > 0) {
          // Get the actual job data for saved jobs from Firestore
          const savedJobsData = [];
          for (const jobId of savedIds) {
            try {
              const jobDoc = await getDoc(doc(db, 'jobs', jobId));
              if (jobDoc.exists()) {
                const jobData = jobDoc.data();
                savedJobsData.push({
                  id: jobDoc.id,
                  title: jobData.title || 'Untitled Job',
                  company: jobData.company || 'Unknown Company',
                  location: jobData.location || 'Location TBD',
                  type: jobData.type || 'FULL_TIME',
                  salary: jobData.salary || 'Salary TBD',
                  postedDate: jobData.postedDate || new Date().toISOString(),
                  description: jobData.description || 'No description available',
                  active: jobData.active !== false,
                  applicants: jobData.applicants || [],
                  status: jobData.status || 'approved',
                  featured: jobData.featured || false
                } as Job);
              }
            } catch (jobErr) {
              console.warn(`Failed to load saved job ${jobId}:`, jobErr);
            }
          }
          setSavedJobs(savedJobsData);
        } else {
          setSavedJobs([]);
        }
      } else {
        setSavedJobs([]);
        setSavedJobIds([]);
      }
    } catch (err) {
      console.error('Error loading saved jobs:', err);
      setSavedJobs([]);
      setSavedJobIds([]);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats based on loaded jobs
      const userApplications = user ? jobs.filter(job => 
        job.applicants && job.applicants.includes(user.uid)
      ).length : 0;

      setStats({
        totalJobs: jobs.length,
        appliedJobs: userApplications,
        savedJobs: savedJobIds.length, // Use savedJobIds length for accurate count
        profileViews: 0 // Would be calculated from profile views
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      // Provide default stats
      setStats({
        totalJobs: jobs.length,
        appliedJobs: 0,
        savedJobs: savedJobIds.length,
        profileViews: 0
      });
    }
  };

  // Recalculate stats when jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      loadStats();
    }
  }, [jobs, user]);

  // Recalculate stats when saved jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      loadStats();
    }
  }, [savedJobIds]);

  // Reload saved jobs when user changes
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  const handleSearch = (filters: { keyword: string; location: string; type: string }) => {
    setSearchFilters(filters);
    // Filter jobs based on search criteria
    let filteredJobs = [...jobs];
    
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword)
      );
    }
    
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.location.toLowerCase().includes(location)
      );
    }
    
    if (filters.type) {
      filteredJobs = filteredJobs.filter(job => job.type === filters.type);
    }
    
    // Update the jobs display with filtered results
    setJobs(filteredJobs);
    setActiveTab('all');
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      alert('Please log in to apply for jobs');
      return;
    }

    try {
      // Use the service function to apply to the job
      const { applyToJob } = await import('../services/jobService');
      await applyToJob(jobId, user.uid);
      
      // Update the job in the current state to reflect the application
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, applicants: [...job.applicants, user.uid] }
          : job
      ));
      
      // Update featured jobs if applicable
      setFeaturedJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, applicants: [...job.applicants, user.uid] }
          : job
      ));
      
      // Update recent jobs if applicable
      setRecentJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, applicants: [...job.applicants, user.uid] }
          : job
      ));
      
      // Refresh stats to show updated applied jobs count
      loadStats();
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  const getDisplayJobs = () => {
    switch (activeTab) {
      case 'featured':
        return featuredJobs.length > 0 ? featuredJobs : jobs.filter(job => job.featured);
      case 'recent':
        return recentJobs.length > 0 ? recentJobs : jobs.slice(0, 8);
      case 'saved':
        return savedJobs;
      default:
        return jobs;
    }
  };

  const handleSaveChange = async (jobId: string, isSaved: boolean) => {
    if (isSaved) {
      setSavedJobIds(prev => [...prev, jobId]);
      // Find job in any of the job lists and add to saved jobs
      let jobToAdd = jobs.find(j => j.id === jobId) || 
                    featuredJobs.find(j => j.id === jobId) || 
                    recentJobs.find(j => j.id === jobId);
      
      // If not found in current lists, fetch from Firestore
      if (!jobToAdd) {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          if (jobDoc.exists()) {
            const jobData = jobDoc.data();
            jobToAdd = {
              id: jobDoc.id,
              title: jobData.title || 'Untitled Job',
              company: jobData.company || 'Unknown Company',
              location: jobData.location || 'Location TBD',
              type: jobData.type || 'FULL_TIME',
              salary: jobData.salary || 'Salary TBD',
              postedDate: jobData.postedDate || new Date().toISOString(),
              description: jobData.description || 'No description available',
              active: jobData.active !== false,
              applicants: jobData.applicants || [],
              status: jobData.status || 'approved',
              featured: jobData.featured || false
            } as Job;
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        }
      }
      
      if (jobToAdd) {
        setSavedJobs(prev => {
          // Check if already in saved jobs to avoid duplicates
          const exists = prev.some(job => job.id === jobId);
          return exists ? prev : [...prev, jobToAdd];
        });
      }
    } else {
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    }
    
    // Update stats to reflect the change
    setTimeout(() => {
      loadStats();
    }, 100);
  };

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={loadJobSeekerData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Find Your Dream Job</h1>
          <p className="text-gray-600 mb-8">Please log in to access personalized job recommendations</p>
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
            <h1 className="text-4xl font-bold mb-4">Welcome back, {user.displayName || 'Job Seeker'}!</h1>
            <p className="text-xl mb-6">Discover amazing opportunities and advance your career</p>
            <div className="flex space-x-4">
              <Link
                to="/profile"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Update Profile
              </Link>
              <Link
                to="/dashboard"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Dashboard
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Available Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Active listings</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Applied Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appliedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Applications sent</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Bookmarked jobs</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Job</h2>
        <JobSearch onSearch={handleSearch} />
      </div>

      {/* Job Categories */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Popular Categories</h3>
        <div className="flex flex-wrap gap-3">
          {['Engineering', 'Design', 'Marketing', 'Sales', 'Remote', 'Internships', 'Finance', 'Healthcare'].map(category => (
            <button
              key={category}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Job Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Jobs', count: jobs.length },
              { id: 'featured', label: 'Featured', count: featuredJobs.length },
              { id: 'recent', label: 'Recent', count: recentJobs.length },
              { id: 'saved', label: 'Saved Jobs', count: savedJobs.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Job List */}
        <div className="p-6">
          <div className="space-y-4">
            {getDisplayJobs().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or check back later for new opportunities.</p>
                <button 
                  onClick={loadJobSeekerData}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Reload Jobs
                </button>
              </div>
            ) : (
              getDisplayJobs().map(job => (
                <div key={job.id} className="block hover:shadow-lg transition-shadow">
                  <JobCard
                    job={job}
                    onApply={handleApply}
                    isSaved={savedJobIds.includes(job.id)}
                    onSaveChange={handleSaveChange}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to take the next step?</h3>
        <p className="text-gray-600 mb-6">Update your profile to get better job recommendations and increase your chances of being hired</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Update Profile
          </Link>
          <Link
            to="/dashboard"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerHome;