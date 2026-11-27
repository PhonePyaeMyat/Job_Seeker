import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  logo?: string;
  ownerId: string;
  verified?: boolean;
  createdAt: string;
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
  postedDate: string;
  applicants: string[];
}

interface Review {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'reviews'>('overview');

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCompanyData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Load company details
      const companyDoc = await getDoc(doc(db, 'companies', id));
      if (!companyDoc.exists()) {
        setError('Company not found');
        return;
      }

      const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company;
      setCompany(companyData);

      // Load company jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', id),
        where('active', '==', true),
        orderBy('postedDate', 'desc')
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = jobsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Job[];
      setJobs(jobsData);

      // Load company reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('companyId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Review[];
      setReviews(reviewsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return <div className="text-center py-8">Loading company profile...</div>;
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Company not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold text-blue-600">
                {company.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.verified && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">{company.industry} • {company.location}</p>
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-sm text-gray-600">
                {reviews.length > 0 ? `${getAverageRating()} ★ (${reviews.length} reviews)` : 'No reviews yet'}
              </span>
              <span className="text-sm text-gray-600">{jobs.length} open positions</span>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
        {company.description && (
          <p className="text-gray-700 mt-4">{company.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">About {company.name}</h3>
                <p className="text-gray-700">{company.description || 'No description available.'}</p>
                <div className="mt-6 space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Industry: </span>
                    <span className="text-gray-600">{company.industry || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Company Size: </span>
                    <span className="text-gray-600">{company.size || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{company.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Website: </span>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-gray-600">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Company Stats</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Open Positions</p>
                    <p className="text-2xl font-bold">{jobs.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{reviews.length > 0 ? `${getAverageRating()} ★` : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold">{reviews.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No open positions at this time.</p>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-gray-600">{job.location} • {job.type} • {job.salary}</p>
                          <p className="text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Posted {new Date(job.postedDate).toLocaleDateString()} • {job.applicants?.length || 0} applicants
                          </p>
                        </div>
                        <a
                          href={`/jobs/${job.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                        >
                          View Job
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this company!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{review.title}</h3>
                          <p className="text-sm text-gray-600">by {review.userName}</p>
                          <p className="text-yellow-500">{renderStars(review.rating)}</p>
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
