import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="bg-gray-100 text-gray-700 py-4 mt-12">
    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
      <div>&copy; {new Date().getFullYear()} Job Seeker. All rights reserved.</div>
      <div className="flex gap-4 mt-2 md:mt-0">
        <Link to="/about" className="hover:underline">About</Link>
        <Link to="/contact" className="hover:underline">Contact</Link>
        <Link to="/terms" className="hover:underline">Terms</Link>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
      </div>
    </div>
  </footer>
);

export default Footer; 