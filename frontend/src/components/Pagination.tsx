import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        Previous
      </button>
      <span>Page {page + 1} of {totalPages}</span>
      <button
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        onClick={() => onPageChange(page + 1)}
        disabled={page + 1 >= totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination; 