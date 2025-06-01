import { mockJobs } from './mockData';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE';
  salary: string;
  postedDate: string;
  description: string;
}

export const getJobs = async (): Promise<Job[]> => {
  // TODO: Replace with actual API call when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockJobs);
    }, 500); // Simulate network delay
  });
};

export const getJobById = async (id: string): Promise<Job | null> => {
  // TODO: Replace with actual API call when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      const job = mockJobs.find(j => j.id === id);
      resolve(job || null);
    }, 500);
  });
}; 