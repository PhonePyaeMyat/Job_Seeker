import React from 'react';

const Categories: React.FC = () => {
  // TODO: Fetch and display categories/trending searches
  const categories = ['Engineering', 'Design', 'Marketing', 'Remote', 'Internships'];
  return (
    <section className="my-8">
      <h2 className="text-2xl font-bold mb-4">Trending Categories</h2>
      <div className="flex flex-wrap gap-4">
        {categories.map(cat => (
          <span key={cat} className="bg-blue-100 text-blue-800 px-4 py-2 rounded cursor-pointer hover:bg-blue-200">{cat}</span>
        ))}
      </div>
    </section>
  );
};

export default Categories; 