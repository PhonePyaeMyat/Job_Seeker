import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: string;
  description: string;
  logo?: string;
  headquarters: string;
  founded: string;
  benefits: string[];
  culture: string;
  mission: string;
  rating: number;
  reviewCount: number;
}

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  description: string;
  applicants: string[];
}

interface Review {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  pros: string;
  cons: string;
  advice: string;
  workLifeBalance: number;
  compensation: number;
  jobSecurity: number;
  management: number;
  culture: number;
  overall: number;
  datePosted: string;
  jobTitle: string;
  employmentStatus: string;
  lengthOfEmployment: string;
}

const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'reviews'>('overview');

  useEffect(() => {
    const loadCompanyData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Load company data
        const companyDoc = await getDoc(doc(db, 'companies', id));
        if (companyDoc.exists()) {
          setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
        } else {
          setError('Company not found');
          return;
        }

        // Load company jobs
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(
          jobsRef,
          where('companyId', '==', id),
          where('active', '==', true),
          orderBy('postedDate', 'desc'),
          limit(10)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsData = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        setJobs(jobsData);

        // Load company reviews
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(
          reviewsRef,
          where('companyId', '==', id),
          orderBy('datePosted', 'desc'),
          limit(5)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(reviewsData);

      } catch (err) {
        console.error('Error loading company data:', err);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [id]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The company you are looking for does not exist.'}</p>
          <Link to="/jobs" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-gray-500">{company.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{company.industry}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{company.size} employees</span>
                <span>•</span>
                <span>{company.headquarters}</span>
                <span>•</span>
                <span>Founded {company.founded}</span>
              </div>
              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {company.website}
                </a>
              )}
            </div>
          </div>
          
          {/* Company Rating */}
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex">{renderStars(Math.round(company.rating))}</div>
              <span className="text-lg font-semibold">{company.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-600">{company.reviewCount} reviews</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'jobs', label: 'Jobs', count: jobs.length },
              { id: 'reviews', label: 'Reviews', count: reviews.length }
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
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Company Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About {company.name}</h3>
                <p className="text-gray-700 leading-relaxed">{company.description}</p>
              </div>

              {/* Mission Statement */}
              {company.mission && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mission</h3>
                  <p className="text-gray-700 leading-relaxed">{company.mission}</p>
                </div>
              )}

              {/* Company Culture */}
              {company.culture && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Culture</h3>
                  <p className="text-gray-700 leading-relaxed">{company.culture}</p>
                </div>
              )}

              {/* Benefits */}
              {company.benefits && company.benefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {company.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Open Positions at {company.name}
              </h3>
              {jobs.length > 0 ? (
                jobs.map((job) => (
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
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                          <span>•</span>
                          <span>{job.salary}</span>
                        </div>
                        <p className="text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                      </div>
                      <div className="text-right">
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
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No open positions at this time.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Employee Reviews
              </h3>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.title}</h4>
                        <p className="text-sm text-gray-600">
                          {review.jobTitle} • {review.employmentStatus} • {review.lengthOfEmployment}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(review.overall)}</div>
                        <span className="font-semibold">{review.overall}/5</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Pros</h5>
                        <p className="text-gray-700">{review.pros}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Cons</h5>
                        <p className="text-gray-700">{review.cons}</p>
                      </div>
                      {review.advice && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">Advice to Management</h5>
                          <p className="text-gray-700">{review.advice}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Work-Life Balance</span>
                          <div className="flex">{renderStars(review.workLifeBalance)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Compensation</span>
                          <div className="flex">{renderStars(review.compensation)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Security</span>
                          <div className="flex">{renderStars(review.jobSecurity)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Management</span>
                          <div className="flex">{renderStars(review.management)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Culture</span>
                          <div className="flex">{renderStars(review.culture)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No reviews yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
