import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import JobSeekerHome from './components/JobSeekerHome';
import EmployerHome from './components/EmployerHome';
import JobList from './components/JobList';
import JobDetails from './components/JobDetails';
import JobForm from './components/JobForm';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import BackendStatus from './components/BackendStatus';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'jobseeker' | 'employer' | 'admin'>('jobseeker');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role) {
              setRole(userData.role);
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setRole('jobseeker');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const canPostJob = user && (role === 'employer' || role === 'admin');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header role={role} />
        <BackendStatus />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              user ? (
                role === 'employer' || role === 'admin' ? <EmployerHome /> : <JobSeekerHome />
              ) : (
                <LandingPage />
              )
            } />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={
              user && role === 'employer' ? <Navigate to="/dashboard" /> : <JobDetails />
            } />
            <Route path="/post-job" element={
              user ? (
                canPostJob ? <JobForm /> : <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/dashboard" element={
              user ? (
                role === 'employer' || role === 'admin' ? <EmployerDashboard /> : <JobSeekerDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/admin" element={
              user && role === 'admin' ? <AdminPanel /> : <Navigate to="/" />
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
