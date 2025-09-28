import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { getJobById, applyToJob } from '../services/jobService';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  type: string;
  salary: string;
  experienceLevel: string;
  skills: string[];
  postedDate: string;
  expiryDate: string;
  active: boolean;
  companyId: string;
  applicants: string[];
}

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');
  const [user, userLoading] = useAuthState(auth);
  const navigate = useNavigate();

  // Check if user has already applied (force to boolean)
  const hasApplied = !!(user && job?.applicants?.includes(user.uid));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) throw new Error('Missing job id');
        const data = await getJobById(id);
        setJob(data as Job);
      } catch (e: any) {
        console.error('Error loading job:', e);
        setError('Job not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (hasApplied) {
      setApplyMsg('You have already applied to this job.');
      return;
    }

    try {
      setApplying(true);
      const userId = user.uid;
      if (!id) throw new Error('Missing job id');
      
      await applyToJob(id, userId);
      
      // Update local job state to reflect the application
      if (job) {
        setJob({
          ...job,
          applicants: [...(job.applicants || []), userId]
        });
      }
      
      setApplyMsg('You have successfully applied for this job! 🎉');
    } catch (err: any) {
      console.error('Application error:', err);
      setApplyMsg('Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading job details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white rounded shadow">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Jobs
      </Link>
      
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-bold">{job.title}</h1>
          {hasApplied && (
            <div className="ml-4 flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Applied
              </span>
            </div>
          )}
        </div>
        <div className="text-gray-600 mb-4 flex items-center gap-2">
          <span className="font-medium">{job.company}</span>
          <span>•</span>
          <span>{job.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {job.type}
          </span>
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {job.experienceLevel}
          </span>
          {job.salary && (
            <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {job.salary}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Job Description</h3>
          <div className="text-gray-800 whitespace-pre-line leading-relaxed">
            {job.description}
          </div>
        </div>

        {job.requirements && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Requirements</h3>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed">
              {job.requirements}
            </div>
          </div>
        )}

        {job.skills && job.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
            <span>Expires: {new Date(job.expiryDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                hasApplied 
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${applying ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleApply}
              disabled={applying || userLoading || hasApplied}
            >
              {applying ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Applying...
                </span>
              ) : hasApplied ? (
                '✓ Applied'
              ) : (
                'Apply Now'
              )}
            </button>

            {!user && (
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>{' '}
                to apply for this job
              </p>
            )}
          </div>

          {applyMsg && (
            <div className={`mt-4 p-4 rounded-lg ${
              applyMsg.includes('successfully') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {applyMsg.includes('successfully') ? (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{applyMsg}</p>
                  {applyMsg.includes('successfully') && (
                    <p className="text-sm text-green-700 mt-1">
                      The employer will review your application and contact you if you're selected for an interview.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasApplied && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-green-800 font-medium text-sm">Application Submitted Successfully!</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Your application has been sent to the employer. You can track your applications in your dashboard.
                  </p>
                  <Link to="/dashboard" className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium mt-2">
                    View Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;