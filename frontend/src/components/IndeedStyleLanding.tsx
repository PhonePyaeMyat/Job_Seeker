import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { Job, getJobs } from '../services/jobService';
import JobCard from './JobCard';
import JobRecommendations from './JobRecommendations';
import AdvancedJobSearch from './AdvancedJobSearch';

const IndeedStyleLanding: React.FC = () => {
  const [user] = useAuthState(auth);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    location: '',
    type: '',
    salary: '',
    experience: '',
    company: '',
    remote: false,
    datePosted: '',
    radius: '25'
  });

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

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
    // In a real implementation, this would trigger a search
    console.log('Search filters:', filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Indeed Style */}
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

          {/* Advanced Search */}
          <div className="max-w-4xl mx-auto">
            <AdvancedJobSearch onSearch={handleSearch} />
          </div>

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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Listings */}
          <div className="lg:col-span-2">
            {/* Featured Jobs Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
                <Link 
                  to="/jobs" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all jobs →
                </Link>
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
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Set Up Alerts
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
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

export default IndeedStyleLanding;
