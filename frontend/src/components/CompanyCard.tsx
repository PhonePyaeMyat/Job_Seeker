import React from 'react';

interface CompanyCardProps {
  name: string;
  location: string;
  website?: string;
  description?: string;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ name, location, website, description }) => {
  return (
    <div className="bg-white rounded shadow p-6 mb-4">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="text-gray-700 mb-1">{location}</div>
      {website && (
        <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{website}</a>
      )}
      {description && <div className="text-gray-600 mt-2">{description}</div>}
    </div>
  );
};

export default CompanyCard; 