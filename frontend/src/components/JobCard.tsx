import React from 'react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    postedDate: string;
    description: string;
  };
  onApply: (jobId: string) => void;
}

const JobCard = ({ job, onApply }: JobCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
          <p className="text-gray-600 mt-1">{job.company}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
          {job.type}
        </span>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {job.location}
        </div>
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {job.salary}
        </div>
      </div>

      <p className="mt-4 text-gray-600 line-clamp-2">{job.description}</p>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Posted {new Date(job.postedDate).toLocaleDateString()}
        </span>
        <button
          onClick={() => onApply(job.id)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default JobCard; 