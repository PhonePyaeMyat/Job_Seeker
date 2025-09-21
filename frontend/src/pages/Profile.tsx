import React, { useState } from 'react';

const Profile: React.FC = () => {
  const role = localStorage.getItem('role') || 'jobseeker';
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [, setResume] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [, setLogo] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setResume(e.target.files[0]);
  };
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setLogo(e.target.files[0]);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      {role === 'jobseeker' ? (
        <form className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Skills (comma separated)</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Resume Upload</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} className="w-full" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
        </form>
      ) : (
        <form className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Logo Upload</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border px-3 py-2 rounded" rows={3} />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
        </form>
      )}
    </div>
  );
};

export default Profile; 