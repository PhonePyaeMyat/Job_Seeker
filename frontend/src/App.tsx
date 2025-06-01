import React from 'react';
import JobList from './components/JobList';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">JobSeeker</h1>
            <div className="space-x-4">
              <button className="text-gray-600 hover:text-gray-800">Sign In</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Post a Job
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <JobList />
      </main>

      <footer className="bg-white mt-8 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 JobSeeker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 