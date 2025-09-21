import React, { useState } from 'react';

interface SaveJobButtonProps {
  jobId: string;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
}

const SaveJobButton: React.FC<SaveJobButtonProps> = ({ jobId, isSaved = false, onSave, onUnsave }) => {
  const [saved, setSaved] = useState(isSaved);

  const handleClick = () => {
    if (saved) {
      setSaved(false);
      onUnsave && onUnsave(jobId);
    } else {
      setSaved(true);
      onSave && onSave(jobId);
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded ${saved ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-500`}
      onClick={handleClick}
    >
      {saved ? 'Saved' : 'Save Job'}
    </button>
  );
};

export default SaveJobButton; 