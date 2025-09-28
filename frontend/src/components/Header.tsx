import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const Header: React.FC = () => {
  const [user] = useAuthState(auth);
  const role = localStorage.getItem('role') || 'jobseeker';
  const isAdmin = user?.email === 'admin@jobseeker.com' || user?.displayName === 'admin';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('role');
      // The page will automatically redirect due to auth state change
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className="bg-blue-600 text-white py-4 shadow">
      <nav className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-2xl font-bold">Job Seeker</Link>
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:underline">Home</Link>
          
          {/* Role-specific navigation */}
          {user && role === 'employer' && (
            <Link to="/post-job" className="hover:underline">Post Job</Link>
          )}
          
          
          {user && role === 'admin' && (
            <>
              <Link to="/jobs" className="hover:underline">Manage Jobs</Link>
              <Link to="/admin" className="hover:underline">Admin Panel</Link>
            </>
          )}
          
          {user && <Link to="/profile" className="hover:underline">Profile</Link>}
          {user && (
            <button
              onClick={handleLogout}
              className="hover:underline bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
            >
              Logout
            </button>
          )}
          {!user && <Link to="/login" className="hover:underline">Login</Link>}
          {!user && <Link to="/signup" className="hover:underline">Sign Up</Link>}
        </div>
      </nav>
    </header>
  );
};

export default Header; 