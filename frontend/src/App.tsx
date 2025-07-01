import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';

// Placeholder for JobDetails component
const JobDetails = () => <div className="container mx-auto p-4">Job Details Page (to be implemented)</div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">JobSeeker</Link>
              <div className="space-x-4">
                <button className="text-gray-600 hover:text-gray-800">Sign In</button>
                <Link to="/post-job" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Post a Job
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/post-job" element={<JobForm />} />
          </Routes>
        </main>

        <footer className="bg-white mt-8 py-6">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-600">
              <p>&copy; 2024 JobSeeker. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App; 