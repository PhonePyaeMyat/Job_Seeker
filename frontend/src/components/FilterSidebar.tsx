import React from 'react';

const FilterSidebar: React.FC = () => {
  // TODO: Implement filter logic and state
  return (
    <aside className="w-full md:w-64 bg-white p-4 rounded shadow mb-6 md:mb-0">
      <h3 className="font-bold mb-4">Filters</h3>
      {/* Location Filter */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Location</label>
        <input type="text" className="w-full border px-2 py-1 rounded" placeholder="Enter location" />
      </div>
      {/* Job Type Filter */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Job Type</label>
        <select className="w-full border px-2 py-1 rounded">
          <option value="">All Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="REMOTE">Remote</option>
        </select>
      </div>
      {/* Date Posted Filter */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Date Posted</label>
        <select className="w-full border px-2 py-1 rounded">
          <option value="">Anytime</option>
          <option value="1">Last 24 hours</option>
          <option value="3">Last 3 days</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      {/* Salary Range Filter */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Salary Range</label>
        <input type="range" min="0" max="200000" step="1000" className="w-full" />
        <div className="text-sm text-gray-600">$0 - $200,000+</div>
      </div>
      {/* TODO: Add filter apply/reset buttons */}
    </aside>
  );
};

export default FilterSidebar; 