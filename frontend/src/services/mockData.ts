import { Job } from './jobService';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'New York, NY',
    type: 'FULL_TIME',
    salary: '$120,000 - $150,000',
    postedDate: '2024-03-01',
    description: 'We are looking for a Senior Software Engineer to join our team...'
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'Web Solutions',
    location: 'Remote',
    type: 'REMOTE',
    salary: '$90,000 - $110,000',
    postedDate: '2024-03-02',
    description: 'Join our team as a Frontend Developer and work on exciting projects...'
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'Data Systems',
    location: 'San Francisco, CA',
    type: 'FULL_TIME',
    salary: '$100,000 - $130,000',
    postedDate: '2024-03-03',
    description: 'Looking for a Backend Developer with experience in Java and Spring Boot...'
  }
]; 