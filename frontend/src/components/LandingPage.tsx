import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Job, getJobs, searchJobs } from '../services/jobService';
import JobCard from './JobCard';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';

const LandingPage: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    location: '',
    type: ''
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const data = await getJobs(0, 6); // Get first 6 jobs as featured
        setFeaturedJobs(data.jobs || []);
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchFilters.keyword && !searchFilters.location && !searchFilters.type) {
      return;
    }

    try {
      setSearchLoading(true);
      const data = await searchJobs(
        searchFilters.keyword,
        searchFilters.location,
        searchFilters.type,
        0,
        20
      );
      setSearchResults(data.jobs || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearSearch = () => {
    setSearchFilters({
      keyword: '',
      location: '',
      type: ''
    });
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleApply = (jobId: string) => {
    if (!user) {
      // If user is not logged in, redirect to signup with a message
      navigate('/signup', { 
        state: { 
          message: 'Please create an account to apply for jobs',
          redirectTo: `/jobs/${jobId}`
        } 
      });
    } else {
      // If user is logged in, redirect to job details page
      navigate(`/jobs/${jobId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Dream Job Today
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect with top employers and discover opportunities that match your skills and career goals. 
            Join thousands of job seekers who have found their perfect match.
          </p>
          
          {/* Search Form */}
          <div className="max-w-4xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Keywords
                  </label>
                  <input
                    type="text"
                    id="keyword"
                    name="keyword"
                    value={searchFilters.keyword}
                    onChange={handleSearchInputChange}
                    placeholder="Job title, company, or keywords"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={searchFilters.location}
                    onChange={handleSearchInputChange}
                    placeholder="City, state, or remote"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Job Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={searchFilters.type}
                    onChange={handleSearchInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {searchLoading ? 'Searching...' : 'Search Jobs'}
                </button>
                {showSearchResults && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {showSearchResults && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                Search Results ({searchResults.length} jobs found)
              </h2>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Search
              </button>
            </div>
            
            {searchLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or browse all jobs.</p>
                <Link
                  to="/jobs"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse All Jobs
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(job => (
                  <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <JobCard 
                      job={job} 
                      onApply={handleApply}
                      isApplied={user ? job.applicants?.includes(user.uid) : false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Job Seeker?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Job Search</h3>
              <p className="text-gray-600">
                Advanced filtering and search capabilities to find jobs that match your exact criteria.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Companies</h3>
              <p className="text-gray-600">
                Access job opportunities from leading companies and startups across various industries.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Application</h3>
              <p className="text-gray-600">
                Apply to jobs with just one click. Track your applications and manage your job search efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Featured Jobs
          </h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <JobCard 
                    job={job} 
                    onApply={handleApply}
                    isApplied={user ? job.applicants?.includes(user.uid) : false}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link
              to="/jobs"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-200">Active Jobs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Job Seekers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-200">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Ready to Start Your Job Search?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs through our platform. 
            Create your account today and take the first step towards your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
