import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Job, applyToJob } from '../services/jobService';
import { uploadCV, validateResumeFile } from '../services/storageService';

interface ApplicationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, isOpen, onClose, onSuccess }) => {
  const [user] = useAuthState(auth);
  const [applicationMethod, setApplicationMethod] = useState<'profile' | 'cv'>('profile');
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    coverLetter: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          fullName: data.displayName || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          summary: data.summary || '',
          skills: data.skills ? data.skills.join(', ') : '',
          experience: data.experience || '',
          education: data.education || '',
          coverLetter: '',
        });
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileError = validateResumeFile(file);
      if (fileError) {
        setError(fileError);
        return;
      }
      setCvFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (applicationMethod === 'profile') {
        // Apply with profile data — via the shared apply path, so the
        // already-applied check and the single application record are the
        // same as every other way of applying.
        const result = await applyToJob(job.id, user.uid, 'profile', {
          profileData: {
            fullName: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
            location: profileData.location,
            summary: profileData.summary,
            skills: profileData.skills,
            experience: profileData.experience,
            education: profileData.education,
            coverLetter: profileData.coverLetter,
          },
        });
        if (result.alreadyApplied) {
          setError('You have already applied to this job.');
          setLoading(false);
          return;
        }
      } else {
        // Apply with CV upload — the CV is really uploaded to Firebase
        // Storage first, then its metadata (including the download URL the
        // employer uses) is stored on the application record. Phase 1
        // stored only a made-up path string and no file was ever uploaded.
        if (!cvFile) {
          setError('Please upload your CV');
          setLoading(false);
          return;
        }
        const uploaded = await uploadCV(user.uid, cvFile);
        const result = await applyToJob(job.id, user.uid, 'cv', {
          coverLetter,
          additionalInfo,
          cvFile: {
            name: uploaded.name,
            size: uploaded.size,
            type: uploaded.contentType,
            url: uploaded.url,
            path: uploaded.path,
            status: 'uploaded',
          },
        });
        if (result.alreadyApplied) {
          setError('You have already applied to this job.');
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
              <p className="text-gray-600">{job.company} • {job.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Application Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Method
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="profile"
                  checked={applicationMethod === 'profile'}
                  onChange={(e) => setApplicationMethod(e.target.value as 'profile' | 'cv')}
                  className="mr-2"
                />
                Use My Profile
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cv"
                  checked={applicationMethod === 'cv'}
                  onChange={(e) => setApplicationMethod(e.target.value as 'profile' | 'cv')}
                  className="mr-2"
                />
                Upload CV
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {applicationMethod === 'profile' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
                  <textarea
                    value={profileData.summary}
                    onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Brief summary of your experience and skills..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <input
                    type="text"
                    value={profileData.skills}
                    onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="JavaScript, React, Node.js..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience</label>
                  <textarea
                    value={profileData.experience}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Describe your work experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                  <textarea
                    value={profileData.education}
                    onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Your educational background..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                  <textarea
                    value={profileData.coverLetter}
                    onChange={(e) => setProfileData({ ...profileData, coverLetter: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Why are you interested in this position?"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload CV</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX (max 5MB). Your CV is uploaded to secure
                    storage and shared with this employer.
                  </p>
                  {cvFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Why are you interested in this position?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
