import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import { auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import Header from './components/Header';
import Footer from './components/Footer';

// Placeholder for JobDetails component
const JobDetails = () => <div className="container mx-auto p-4">Job Details Page (to be implemented)</div>;

function App() {
  const [user, loading] = useAuthState(auth);
  const role = localStorage.getItem('role') || 'jobseeker';
  if (loading) return <div>Loading...</div>;
  return (
    <>
      <Header />
      <main>
        <Router>
          <Routes>
            <Route path="/" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/post-job" element={<JobForm />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={user ? (role === 'employer' ? <EmployerDashboard /> : <JobSeekerDashboard />) : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </main>
      <Footer />
    </>
  );
}

export default App; 