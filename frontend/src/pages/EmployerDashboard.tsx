import React from 'react';

const EmployerDashboard: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Employer Dashboard</h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Posted Jobs</h3>
        <div className="bg-gray-100 p-4 rounded">(Posted jobs will appear here)</div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Applications</h3>
        <div className="bg-gray-100 p-4 rounded">(Applications will appear here)</div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Company Profile</h3>
        <div className="bg-gray-100 p-4 rounded">(Company info will appear here)</div>
      </div>
    </div>
  );
};

export default EmployerDashboard; 