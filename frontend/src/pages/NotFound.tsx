import React from 'react';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-5xl font-bold mb-4">404</h1>
    <p className="text-xl mb-8">Page Not Found</p>
    <a href="/" className="text-blue-600 hover:underline">Go Home</a>
  </div>
);

export default NotFound; 