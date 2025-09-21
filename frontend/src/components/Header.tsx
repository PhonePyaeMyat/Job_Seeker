import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';

const Header: React.FC = () => {
  const [user] = useAuthState(auth);
  return (
    <header className="bg-blue-600 text-white py-4 shadow">
      <nav className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-2xl font-bold">Job Seeker</Link>
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:underline">Home</Link>
          {user && <Link to="/profile" className="hover:underline">Profile</Link>}
          {user && <Link to="/dashboard" className="hover:underline">Dashboard</Link>}
          {user && <Link to="/admin" className="hover:underline">Admin</Link>}
          {!user && <Link to="/login" className="hover:underline">Login</Link>}
          {!user && <Link to="/signup" className="hover:underline">Sign Up</Link>}
        </div>
      </nav>
    </header>
  );
};

export default Header; 