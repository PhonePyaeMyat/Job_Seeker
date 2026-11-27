import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

const initialState = {
  title: '',
  company: '',
  location: '',
  description: '',
  requirements: '',
  type: 'FULL_TIME',
  salary: '',
  experienceLevel: 'ENTRY',
  skills: '', // comma-separated
  expiryDate: '',
};

const JobForm: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Basic validation
    if (!form.title || !form.company || !form.location || !form.description || !form.expiryDate) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (!user) {
      setError('Please log in to post a job.');
      setLoading(false);
      return;
    }
    try {
      // The API base URL comes from REACT_APP_API_URL (see frontend/.env.example)
      // and defaults to the deployed Functions URL — never a localhost address.
      const token = await user.getIdToken();
      await axios.post(`${API_BASE_URL}/jobs`, {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
        <p className="text-gray-600 mb-4">Please log in to post a job.</p>
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Title *</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Company *</label>
          <input name="company" value={form.company} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Location *</label>
          <input name="location" value={form.location} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border px-3 py-2 rounded" required rows={3} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Requirements</label>
          <textarea name="requirements" value={form.requirements} onChange={handleChange} className="w-full border px-3 py-2 rounded" rows={2} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="w-full border px-3 py-2 rounded">
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Intern</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Salary</label>
          <input name="salary" value={form.salary} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Experience Level</label>
          <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className="w-full border px-3 py-2 rounded">
            <option value="ENTRY">Entry</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Skills (comma separated)</label>
          <input name="skills" value={form.skills} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Expiry Date *</label>
          <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">Job posted successfully! It is pending review. Redirecting...</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
};

export default JobForm;
