import React from 'react';

const Dashboard: React.FC = () => {
  const role = localStorage.getItem('role') || 'jobseeker';
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Welcome, <span className="font-semibold">{role}</span>!</p>
      {/* Add dashboard content here based on role */}
    </div>
  );
};

export default Dashboard; 