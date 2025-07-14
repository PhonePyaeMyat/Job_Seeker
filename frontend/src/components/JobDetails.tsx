import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

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
  const [applied, setApplied] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get('http://localhost:3001/jobs/' + id)
      .then(res => {
        setJob(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Job not found or failed to load.');
        setLoading(false);
      });
  }, [id]);

  const handleApply = async () => {
    try {
      // Replace with real user ID from auth in a real app
      const userId = localStorage.getItem('userId') || 'demoUser';
      await axios.post(`http://localhost:3001/jobs/${id}/apply`, { userId });
      setApplied(true);
      setApplyMsg('You have successfully applied for this job!');
    } catch (err) {
      setApplyMsg('Failed to apply. Please try again.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!job) return null;

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white rounded shadow">
      <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Jobs</Link>
      <h2 className="text-3xl font-bold mt-4 mb-2">{job.title}</h2>
      <div className="text-gray-600 mb-2">{job.company} &bull; {job.location}</div>
      <div className="mb-4">
        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">{job.type}</span>
        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">{job.experienceLevel}</span>
        {job.salary && <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">{job.salary}</span>}
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Description</h3>
        <p className="text-gray-800 whitespace-pre-line">{job.description}</p>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Requirements</h3>
        <p className="text-gray-800 whitespace-pre-line">{job.requirements}</p>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {job.skills && job.skills.map((skill, idx) => (
            <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">{skill}</span>
          ))}
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Posted: {new Date(job.postedDate).toLocaleDateString()} | Expires: {new Date(job.expiryDate).toLocaleDateString()}
      </div>
      <div className="mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleApply}
          disabled={applied}
        >
          {applied ? 'Applied' : 'Apply Now'}
        </button>
        {applyMsg && <div className="text-green-600 mt-2">{applyMsg}</div>}
      </div>
    </div>
  );
};

export default JobDetails; 