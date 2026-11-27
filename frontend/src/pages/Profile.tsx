import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { uploadResume, deleteStoredFile, validateResumeFile } from '../services/storageService';

interface ResumeFile {
  name: string;
  url: string;
  path?: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: string;
  education: string;
  role: 'jobseeker' | 'employer' | 'admin';
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  resume?: ResumeFile;
  resumeUrl?: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: '',
    education: '',
    role: 'jobseeker',
    createdAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          summary: userData.summary || '',
          skills: userData.skills || [],
          experience: userData.experience || '',
          education: userData.education || '',
          role: userData.role || 'jobseeker',
          companyName: userData.companyName || '',
          companyWebsite: userData.companyWebsite || '',
          industry: userData.industry || '',
          companySize: userData.companySize || '',
          resume: userData.resume,
          resumeUrl: userData.resumeUrl || '',
          createdAt: userData.createdAt || '',
        });
      } else {
        // User document doesn't exist, create default profile from auth data.
        // The role defaults to jobseeker — the role lives in Firestore, not
        // in localStorage (Phase 2: the old code read it from localStorage).
        setProfile({
          displayName: user.displayName || '',
          email: user.email || '',
          phone: '',
          location: '',
          summary: '',
          skills: [],
          experience: '',
          education: '',
          role: 'jobseeker',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: Record<string, any> = {
        displayName: profile.displayName,
        phone: profile.phone,
        location: profile.location,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        updatedAt: new Date().toISOString(),
      };

      if (profile.role === 'employer') {
        updateData.companyName = profile.companyName;
        updateData.companyWebsite = profile.companyWebsite;
        updateData.industry = profile.industry;
        updateData.companySize = profile.companySize;
      }

      // The stored resume metadata travels with the profile (it is set by
      // the upload handler below, which persists it immediately).
      if (profile.resume) {
        updateData.resume = profile.resume;
        updateData.resumeUrl = profile.resume.url;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Upload a new resume to Firebase Storage and persist its metadata on
  // the user document straight away, so it is kept even if the user never
  // presses Save Profile.
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const fileError = validateResumeFile(file);
    if (fileError) {
      setResumeError(fileError);
      return;
    }
    setResumeError('');
    setResumeUploading(true);
    try {
      const uploaded = await uploadResume(user.uid, file);
      const resume: ResumeFile = {
        name: uploaded.name,
        url: uploaded.url,
        path: uploaded.path,
        size: uploaded.size,
        contentType: uploaded.contentType,
        uploadedAt: uploaded.uploadedAt,
      };
      await updateDoc(doc(db, 'users', user.uid), {
        resume,
        resumeUrl: uploaded.url,
        updatedAt: new Date().toISOString(),
      });
      setProfile((prev) => ({ ...prev, resume, resumeUrl: uploaded.url }));
      setSuccess('Resume uploaded successfully!');
    } catch (err: any) {
      setResumeError(err.message || 'Failed to upload resume');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!user || !profile.resume) return;
    try {
      if (profile.resume.path) {
        await deleteStoredFile(profile.resume.path);
      }
      await updateDoc(doc(db, 'users', user.uid), {
        resume: null,
        resumeUrl: '',
        updatedAt: new Date().toISOString(),
      });
      setProfile((prev) => ({ ...prev, resume: undefined, resumeUrl: '' }));
      setSuccess('Resume removed.');
    } catch (err: any) {
      setError(err.message || 'Failed to remove resume');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Re-authenticate user before deletion
      if (user.email && deletePassword) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user account
      await deleteUser(user);

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Please check your password and try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profile.displayName || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{profile.email}</p>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profile.phone || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profile.location || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-gray-900 capitalize">{profile.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-gray-900">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {profile.role === 'employer' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.companyName || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Website</label>
              {isEditing ? (
                <input
                  type="url"
                  value={profile.companyWebsite || ''}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.companyWebsite || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.industry || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              {isEditing ? (
                <select
                  value={profile.companySize || ''}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900">{profile.companySize || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {profile.role === 'jobseeker' && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
            {isEditing ? (
              <textarea
                value={profile.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Write a brief summary of your professional background..."
              />
            ) : (
              <p className="mt-1 text-gray-900">{profile.summary || 'No summary provided'}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            {isEditing ? (
              <div>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Add a skill..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills added yet</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Experience</h2>
            {isEditing ? (
              <textarea
                value={profile.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Describe your work experience..."
              />
            ) : (
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{profile.experience || 'No experience provided'}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Education</h2>
            {isEditing ? (
              <textarea
                value={profile.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Your educational background..."
              />
            ) : (
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{profile.education || 'No education provided'}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Resume</h2>
            {resumeError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {resumeError}
              </div>
            )}
            {profile.resume ? (
              <div>
                <p className="text-gray-900">
                  <a
                    href={profile.resume.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.resume.name}
                  </a>
                  <span className="text-sm text-gray-500">
                    {' '}({(profile.resume.size / 1024).toFixed(1)} KB, uploaded{' '}
                    {new Date(profile.resume.uploadedAt).toLocaleDateString()})
                  </span>
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm">
                    {resumeUploading ? 'Uploading...' : 'Upload new resume'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={resumeUploading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove resume
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm inline-block">
                  {resumeUploading ? 'Uploading...' : 'Upload resume'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={resumeUploading}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Accepted formats: PDF, DOC, DOCX (max 5MB). The file is stored in
                  secure storage and attached to your applications when you apply
                  with your profile.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-red-600 font-medium">
              Are you sure? This action cannot be undone.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Your password"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
