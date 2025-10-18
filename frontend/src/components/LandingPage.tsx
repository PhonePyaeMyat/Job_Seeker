import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { Job, getJobs, searchJobs } from '../services/jobService';
import JobCard from './JobCard';
import JobRecommendations from './JobRecommendations';
import AdvancedJobSearch from './AdvancedJobSearch';

const LandingPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'jobseeker';

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const data = await getJobs(0, 8);
        setFeaturedJobs(data.jobs || []);
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  const handleSearch = async (filters: {
    keyword: string;
    location: string;
    type: string;
    salary: string;
    experience: string;
    company: string;
    remote: boolean;
    datePosted: string;
    radius: string;
  }) => {
    // Check if user entered any search criteria
    if (!filters.keyword && !filters.location && !filters.type && !filters.company && !filters.remote) {
      return;
    }

    try {
      setSearchLoading(true);
      
      // Use the searchJobs API with the basic filters it supports
      const data = await searchJobs(
        filters.keyword,
        filters.location,
        filters.type,
        0,
        20
      );
      
      let results = data.jobs || [];
      
      // Apply client-side filtering for advanced filters not supported by API
      if (filters.company) {
        const companyLower = filters.company.toLowerCase();
        results = results.filter(job => 
          job.company.toLowerCase().includes(companyLower)
        );
      }
      
      if (filters.remote) {
        results = results.filter(job => 
          job.location.toLowerCase().includes('remote') || 
          job.type.toLowerCase().includes('remote')
        );
      }
      
      if (filters.salary) {
        // Filter by salary range (this is a simple implementation)
        results = results.filter(job => {
          if (!job.salary) return false;
          // Extract numbers from salary string for comparison
          const salaryMatch = job.salary.match(/\d+/g);
          if (!salaryMatch) return false;
          const jobSalary = parseInt(salaryMatch[0]);
          
          if (filters.salary === '30000-50000') return jobSalary >= 30000 && jobSalary <= 50000;
          if (filters.salary === '50000-75000') return jobSalary >= 50000 && jobSalary <= 75000;
          if (filters.salary === '75000-100000') return jobSalary >= 75000 && jobSalary <= 100000;
          if (filters.salary === '100000-150000') return jobSalary >= 100000 && jobSalary <= 150000;
          if (filters.salary === '150000+') return jobSalary >= 150000;
          
          return true;
        });
      }
      
      if (filters.experience) {
        // Filter by experience level
        results = results.filter(job => {
          if (!job.experienceLevel) return false;
          const expLevel = job.experienceLevel.toLowerCase();
          
          if (filters.experience === 'entry' && (expLevel.includes('entry') || expLevel.includes('junior'))) return true;
          if (filters.experience === 'mid' && expLevel.includes('mid')) return true;
          if (filters.experience === 'senior' && expLevel.includes('senior')) return true;
          if (filters.experience === 'executive' && (expLevel.includes('executive') || expLevel.includes('lead'))) return true;
          
          return false;
        });
      }
      
      if (filters.datePosted) {
        const daysAgo = parseInt(filters.datePosted);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        
        results = results.filter(job => {
          const postedDate = new Date(job.postedDate);
          return postedDate >= cutoffDate;
        });
      }
      
      setSearchResults(results);
      setShowSearchResults(true);
      
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleApply = (jobId: string) => {
    if (!user) {
      navigate('/signup', { 
        state: { 
          message: 'Please create an account to apply for jobs',
          redirectTo: `/jobs/${jobId}`
        } 
      });
    } else {
      navigate(`/jobs/${jobId}`);
    }
  };

  const handleViewMore = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  // If user is an employer, redirect to dashboard
  if (user && role === 'employer') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              Find Your Next Job Today
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Discover millions of jobs and get personalized recommendations. 
              Join the world's #1 job site and find your perfect match.
            </p>
          </div>

          {/* Advanced Search - Only show for job seekers and non-authenticated users */}
          {(role === 'jobseeker' || !user) && (
            <div className="max-w-4xl mx-auto">
              <AdvancedJobSearch onSearch={handleSearch} />
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">2.5M+</div>
              <div className="text-blue-200">Active Jobs</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">250M+</div>
              <div className="text-blue-200">Job Seekers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">10M+</div>
              <div className="text-blue-200">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {showSearchResults && (
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Search Results ({searchResults.length} jobs found)
              </h2>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            </div>
            
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or browse all jobs.</p>
                <button
                  onClick={clearSearch}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View All Jobs
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApply={handleApply}
                    onViewMore={handleViewMore}
                    isApplied={user ? job.applicants?.includes(user.uid) : false}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content - Only show for job seekers, admins, and non-authenticated users */}
      {!showSearchResults && (role === 'jobseeker' || role === 'admin' || !user) && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Listings */}
            <div className="lg:col-span-2">
              {/* Featured Jobs Section */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
                  {(role === 'jobseeker' || role === 'admin') && (
                    <Link 
                      to="/jobs" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all jobs →
                    </Link>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {featuredJobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link 
                              to={`/jobs/${job.id}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                            >
                              {job.title}
                            </Link>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="font-medium">{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{job.type}</span>
                              <span>•</span>
                              <span>{job.salary}</span>
                            </div>
                            <p className="text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-sm text-gray-500">
                              {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                            <div className="mt-2">
                              <Link
                                to={`/jobs/${job.id}`}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                              >
                                View Job
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Categories */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Technology', count: '125K+', icon: '💻' },
                    { name: 'Healthcare', count: '89K+', icon: '🏥' },
                    { name: 'Finance', count: '67K+', icon: '💰' },
                    { name: 'Education', count: '45K+', icon: '🎓' },
                    { name: 'Marketing', count: '78K+', icon: '📈' },
                    { name: 'Sales', count: '92K+', icon: '📞' },
                    { name: 'Design', count: '34K+', icon: '🎨' },
                    { name: 'Remote', count: '156K+', icon: '🏠' }
                  ].map((category) => (
                    <Link
                      key={category.name}
                      to={`/jobs?category=${category.name.toLowerCase()}`}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-center"
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.count} jobs</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Recommendations & Sidebar */}
            <div className="space-y-6">
              {/* Job Recommendations */}
              {user && <JobRecommendations />}

              {/* Company Spotlight */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Spotlight</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Google', logo: '🔍', jobs: 1247, rating: 4.2 },
                    { name: 'Microsoft', logo: '🪟', jobs: 892, rating: 4.1 },
                    { name: 'Amazon', logo: '📦', jobs: 2156, rating: 3.8 },
                    { name: 'Apple', logo: '🍎', jobs: 456, rating: 4.3 }
                  ].map((company) => (
                    <Link
                      key={company.name}
                      to={`/companies/${company.name.toLowerCase()}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{company.logo}</span>
                        <div>
                          <div className="font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.jobs} jobs</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-medium">{company.rating}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Job Alerts */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Job Alerts</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get notified when new jobs match your criteria
                </p>
                {user ? (
                  <Link
                    to="/profile"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Set Up Alerts
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Sign Up for Alerts
                  </Link>
                )}
              </div>

              {/* Salary Insights */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Insights</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Software Engineer', salary: '$95,000', change: '+5%' },
                    { title: 'Data Analyst', salary: '$72,000', change: '+8%' },
                    { title: 'Marketing Manager', salary: '$68,000', change: '+3%' },
                    { title: 'Sales Representative', salary: '$55,000', change: '+2%' }
                  ].map((insight) => (
                    <div key={insight.title} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{insight.title}</div>
                        <div className="text-sm text-gray-600">Average salary</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{insight.salary}</div>
                        <div className="text-sm text-green-600">{insight.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Next Job?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join millions of job seekers who have found their dream jobs through our platform.
          </p>
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
    </div>
  );
};

export default LandingPage;