import axios from 'axios';

const API_URL = 'http://localhost:8080/api/jobs';

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
  companyId: string;
  applicants: string[];
}

export const getJobs = async (): Promise<Job[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getJobById = async (id: string): Promise<Job> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const searchJobs = async (keyword: string, location: string, type: string): Promise<Job[]> => {
    const response = await axios.get(`${API_URL}/search`, {
        params: { keyword, location, type }
    });
    return response.data;
}; 