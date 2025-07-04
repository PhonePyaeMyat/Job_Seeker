import React from 'react';

const AdminPanel: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">User Management</h3>
        <div className="bg-gray-100 p-4 rounded">(User management will appear here)</div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Job Moderation</h3>
        <div className="bg-gray-100 p-4 rounded">(Job moderation will appear here)</div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Analytics</h3>
        <div className="bg-gray-100 p-4 rounded">(Analytics will appear here)</div>
      </div>
    </div>
  );
};

export default AdminPanel; 