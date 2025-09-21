import React from 'react';

interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  resumeUrl?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ name, email, role, resumeUrl }) => {
  return (
    <div className="bg-white rounded shadow p-6 mb-4">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="text-gray-700 mb-1">{email}</div>
      <div className="text-gray-500 mb-2">Role: {role}</div>
      {resumeUrl && (
        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
      )}
    </div>
  );
};

export default ProfileCard; 