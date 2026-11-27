import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getJobById, Job, applyToJob, getUserApplications, APPLICATION_STATUS_LABELS, ApplicationStatus } from '../services/jobService';
import { getCompany } from '../services/companyService';
import ApplicationModal from './ApplicationModal';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-blue-100 text-blue-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [ownStatus, setOwnStatus] = useState<ApplicationStatus | null>(null);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [companyVerified, setCompanyVerified] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const loadJobDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const jobData = await getJobById(id);
      if (!jobData) {
        setError('Job not found');
        return;
      }
      setJob(jobData);

      // Verified badge: the company record is keyed by the poster's uid.
      if (jobData.companyId) {
        const company = await getCompany(jobData.companyId);
        setCompanyVerified(company?.verified === true);
      }

      if (user) {
        // Check if job is saved
        const savedJobDoc = await getDoc(doc(db, 'savedJobs', `${user.uid}_${id}`));
        setIsSaved(savedJobDoc.exists());

        // Check if user has applied, and if so, which status the
        // application is in (pending / interview / offer / rejected).
        const userApplications = await getUserApplications(user.uid);
        const own = userApplications.find((app) => app.jobId === id);
        setHasApplied(!!own);
        setOwnStatus(own ? own.status : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApply = async () => {
    if (!user || !job) return;

    try {
      setApplying(true);
      setError('');
      const result = await applyToJob(job.id, user.uid, 'quick');
      if (result.alreadyApplied) {
        setError('You have already applied to this job.');
        setHasApplied(true);
        return;
      }
      setHasApplied(true);
      setOwnStatus('pending');
    } catch (err: any) {
      setError(err.message || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!user || !job) return;

    try {
      if (isSaved) {
        // Unsave job
        await deleteDoc(doc(db, 'savedJobs', `${user.uid}_${job.id}`));
        setIsSaved(false);
      } else {
        // Save job
        await setDoc(doc(db, 'savedJobs', `${user.uid}_${job.id}`), {
          userId: user.uid,
          jobId: job.id,
          savedAt: new Date(),
        });
        setIsSaved(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save job');
    }
  };

  const handleApplySuccess = () => {
    setHasApplied(true);
    setOwnStatus('pending');
    loadJobDetails();
  };

  if (loading) {
    return <div className="text-center py-8">Loading job details...</div>;
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Job not found'}
        </div>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/jobs')}
        className="mb-6 text-blue-600 hover:text-blue-800"
      >
        ← Back to Jobs
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-xl text-gray-600 mt-2">
              {job.company}
              {companyVerified && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 align-middle">
                  ✓ Verified
                </span>
              )}
              {' '}• {job.location}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {job.type}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {job.experienceLevel}
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                {job.salary}
              </span>
            </div>
          </div>
          {hasApplied && (
            <div className="flex flex-col items-end gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✓ Applied
              </span>
              {ownStatus && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGE[ownStatus]}`}>
                  Status: {APPLICATION_STATUS_LABELS[ownStatus]}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Posted:</span> {new Date(job.postedDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Expires:</span> {new Date(job.expiryDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Applicants:</span> {job.applicants?.length || 0}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Requirements</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {user ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {!hasApplied ? (
              <>
                <button
                  onClick={handleQuickApply}
                  disabled={applying}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {applying ? 'Applying...' : 'Quick Apply'}
                </button>
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
                >
                  Apply with CV/Profile
                </button>
              </>
            ) : (
              <div className="flex-1 text-center py-3 bg-green-50 text-green-700 rounded-md font-medium">
                You have applied to this job
                {ownStatus && ` — status: ${APPLICATION_STATUS_LABELS[ownStatus]}`}
              </div>
            )}
            <button
              onClick={handleSaveJob}
              className={`px-6 py-3 rounded-md font-medium ${
                isSaved
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSaved ? '★ Saved' : '☆ Save Job'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">Please sign in to apply for this job.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Sign In to Apply
          </button>
        </div>
      )}

      <ApplicationModal
        job={job}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
};

export default JobDetails;
