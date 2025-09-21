import React from 'react';

const FeaturedJobs: React.FC = () => {
  // TODO: Fetch and display featured jobs
  return (
    <section className="my-8">
      <h2 className="text-2xl font-bold mb-4">Featured Jobs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* TODO: Map featured jobs to JobCard components */}
        <div className="bg-gray-100 rounded p-4 text-center">No featured jobs yet.</div>
      </div>
    </section>
  );
};

export default FeaturedJobs; 