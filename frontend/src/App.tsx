import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerHome from './components/EmployerHome';
import JobSeekerHome from './components/JobSeekerHome';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import { auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import JobDetails from './components/JobDetails';

function App() {
  const [user, loading] = useAuthState(auth);
  const role = localStorage.getItem('role') || 'jobseeker';
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  return (
    <Router>
      <Header />
      <main>
        
          <Routes>
            <Route path="/" element={user ? (role === 'admin' ? <AdminPanel /> : role === 'employer' ? <EmployerHome /> : role === 'jobseeker' ? <JobSeekerHome /> : <JobList />) : <JobList />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/post-job" element={<JobForm />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={user && role === 'jobseeker' ? <JobSeekerDashboard /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && (user.email === 'admin@jobseeker.com' || user.displayName === 'admin') ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes> 
      </main>
      <Footer />
    </Router>
  );
}

export default App; 