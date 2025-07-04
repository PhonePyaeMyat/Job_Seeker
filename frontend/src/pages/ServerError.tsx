import React from 'react';

const ServerError: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-5xl font-bold mb-4">500</h1>
    <p className="text-xl mb-8">Internal Server Error</p>
    <a href="/" className="text-blue-600 hover:underline">Go Home</a>
  </div>
);

export default ServerError; 