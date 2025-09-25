import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
    const snapshot = await getDocs(collection(db, 'jobs'));
    const allJobs: Job[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Job, 'id'>) }));
    const start = page * size;
    return {
        jobs: allJobs.slice(start, start + size),
        total: allJobs.length,
    };
};

export const getJobById = async (id: string): Promise<Job> => {
    const ref = doc(db, 'jobs', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Job not found');
    return { id: snap.id, ...(snap.data() as Omit<Job, 'id'>) };
};

export const searchJobs = async (keyword: string, location: string, type: string, page = 0, size = 10): Promise<PaginatedJobs> => {
    const snapshot = await getDocs(collection(db, 'jobs'));
    let jobs: Job[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Job, 'id'>) }));
    const k = keyword?.toLowerCase?.() || '';
    if (location) jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(location.toLowerCase()));
    if (type) jobs = jobs.filter(j => j.type === type);
    if (k) jobs = jobs.filter(j =>
        (j.title && j.title.toLowerCase().includes(k)) ||
        (j.description && j.description.toLowerCase().includes(k)) ||
        (j.company && j.company.toLowerCase().includes(k))
    );
    const start = page * size;
    return {
        jobs: jobs.slice(start, start + size),
        total: jobs.length,
    };
};

// Mutations (post/update/delete) intentionally omitted to avoid needing Cloud Functions/billing.