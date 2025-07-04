import React from 'react';

const JobSeekerDashboard: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Job Seeker Dashboard</h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Saved Jobs</h3>
        <div className="bg-gray-100 p-4 rounded">(Saved jobs will appear here)</div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Applied Jobs</h3>
        <div className="bg-gray-100 p-4 rounded">(Applied jobs will appear here)</div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Profile Summary</h3>
        <div className="bg-gray-100 p-4 rounded">(Profile info will appear here)</div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard; 