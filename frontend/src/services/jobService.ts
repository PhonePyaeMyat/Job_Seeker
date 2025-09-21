import axios from 'axios';

// Use Firebase Functions in production, local emulator in development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://us-central1-job-seeker-80fd8.cloudfunctions.net/api/jobs' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/job-seeker-80fd8/us-central1/api/jobs');
const API_KEY = process.env.REACT_APP_API_KEY || 'CHANGE_ME_TO_A_SECRET_KEY';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE' | 'INTERNSHIP';
  salary: string;
  postedDate: string;
  description: string;
  requirements: string;
  experienceLevel: string;
  skills: string[];
  active: boolean;
  companyId?: string;
  applicants: string[];
}

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
}

export const getJobs = async (page = 0, size = 10): Promise<PaginatedJobs> => {
    const response = await axios.get(API_URL, { params: { page, size } });
    return response.data;
};

export const getJobById = async (id: string): Promise<Job> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const searchJobs = async (keyword: string, location: string, type: string, page = 0, size = 10): Promise<PaginatedJobs> => {
    console.log('searchJobs called with:', { keyword, location, type, page, size });
    const response = await axios.get(`${API_URL}/search`, {
        params: { keyword, location, type, page, size }
    });
    console.log('searchJobs response:', response.data);
    return response.data;
};

export const postJob = async (job: Partial<Job>) => {
    const response = await axios.post(API_URL, job, {
        headers: { Authorization: API_KEY }
    });
    return response.data;
};

export const updateJob = async (id: string, job: Partial<Job>) => {
    const response = await axios.put(`${API_URL}/${id}`, job, {
        headers: { Authorization: API_KEY }
    });
    return response.data;
};

export const deleteJob = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: API_KEY }
    });
    return response.data;
}; 