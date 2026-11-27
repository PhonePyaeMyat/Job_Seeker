import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
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
  postedBy?: string;
  status?: string;
  applicants: string[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  applicationMethod: string;
  /** ISO string once read back; a Firestore Timestamp while pending. */
  appliedAt: any;
  status: 'pending' | 'interview' | 'offer' | 'rejected';
}

export interface SearchFilters {
  keyword: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  company: string;
  remote: boolean;
  datePosted: string;
}

export const EMPTY_FILTERS: SearchFilters = {
  keyword: '',
  location: '',
  type: '',
  salary: '',
  experience: '',
  company: '',
  remote: false,
  datePosted: '',
};

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

/**
 * The single apply path. Creates ONE `applications` document (status
 * 'pending', with a real appliedAt timestamp) AND adds the user to the job's
 * applicants array. Idempotent: if the user already applied, nothing is
 * written and the existing application is returned.
 */
export const applyToJob = async (
  jobId: string,
  userId: string,
  applicationMethod: 'quick' | 'profile' | 'cv' = 'quick',
): Promise<{ applicationId: string | null; alreadyApplied: boolean }> => {
  const ref = doc(db, 'jobs', jobId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Job not found');
  const data = snap.data() as Omit<Job, 'id'>;
  const alreadyApplicant = Array.isArray(data.applicants) && data.applicants.includes(userId);
  if (alreadyApplicant) return { applicationId: null, alreadyApplied: true };

  // Fill in the applicant's name/email from their profile so employers
  // see who applied (the modal path already does this).
  let userProfile: { displayName?: string; email?: string } = {};
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) userProfile = userSnap.data() as typeof userProfile;
  } catch (e) {
    // Non-fatal: the application is still recorded without profile details.
  }

  const applicationRef = await addDoc(collection(db, 'applications'), {
    jobId,
    jobTitle: data.title || '',
    companyName: data.company || '',
    companyId: data.companyId || '',
    userId,
    userName: userProfile.displayName || '',
    userEmail: userProfile.email || '',
    applicationMethod,
    appliedAt: serverTimestamp(),
    status: 'pending',
  });
  await updateDoc(ref, {
    applicants: arrayUnion(userId),
  });
  return { applicationId: applicationRef.id, alreadyApplied: false };
};

/** All applications belonging to one user, newest first. */
export const getUserApplications = async (userId: string): Promise<Application[]> => {
  const q = query(collection(db, 'applications'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const applications: Application[] = snapshot.docs.map(d => {
    const data = d.data();
    const appliedAt = data.appliedAt;
    return {
      id: d.id,
      ...(data as Omit<Application, 'id' | 'appliedAt'>),
      appliedAt: appliedAt && typeof appliedAt.toDate === 'function'
        ? appliedAt.toDate().toISOString()
        : (appliedAt || ''),
    } as Application;
  });
  applications.sort((a, b) =>
    new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
  return applications;
};

/** Extract [min, max] numbers from a free-text salary string, or null. */
export function parseSalaryNumbers(salary: string | undefined): [number, number] | null {
  if (typeof salary !== 'string') return null;
  const nums = salary.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number);
  return [Math.min(...values), Math.max(...values)];
}

/** Minimal shape a job needs for search filtering. */
export interface SearchableJob {
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  salary?: string;
  experienceLevel?: string;
  postedDate?: string;
  description?: string;
}

/**
 * Apply the full advanced-search filter set to a job list, in memory.
 * Shared by searchJobs and by the home page's client-side filtering so the
 * two never drift apart again. Radius is intentionally not supported: jobs
 * carry no coordinates, so a radius filter cannot be computed honestly.
 */
export function applySearchFilters<T extends SearchableJob>(jobs: T[], filters: SearchFilters): T[] {
  let result = [...jobs];
  const k = filters.keyword?.toLowerCase?.() || '';
  if (filters.location) {
    result = result.filter(j => j.location && j.location.toLowerCase().includes(filters.location.toLowerCase()));
  }
  if (filters.type) {
    result = result.filter(j => j.type === filters.type);
  }
  if (filters.company) {
    result = result.filter(j => j.company && j.company.toLowerCase().includes(filters.company.toLowerCase()));
  }
  if (filters.experience) {
    const wanted = filters.experience.toLowerCase() === 'executive' ? 'SENIOR' : filters.experience.toUpperCase();
    result = result.filter(j => (j.experienceLevel || '').toUpperCase() === wanted);
  }
  if (filters.remote) {
    result = result.filter(j =>
      (j.location && j.location.toLowerCase().includes('remote')) || j.type === 'REMOTE');
  }
  if (filters.salary) {
    const [filterMin, filterMax] = filters.salary.endsWith('+')
      ? [parseInt(filters.salary, 10), Infinity]
      : filters.salary.split('-').map(n => parseInt(n, 10));
    result = result.filter(j => {
      const range = parseSalaryNumbers(j.salary);
      if (!range) return false;
      return range[1] >= filterMin && range[0] <= filterMax;
    });
  }
  if (filters.datePosted) {
    const days = parseInt(filters.datePosted, 10);
    if (!Number.isNaN(days)) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter(j => j.postedDate && new Date(j.postedDate).getTime() >= cutoff);
    }
  }
  if (k) {
    result = result.filter(j =>
      (j.title && j.title.toLowerCase().includes(k)) ||
      (j.description && j.description.toLowerCase().includes(k)) ||
      (j.company && j.company.toLowerCase().includes(k)),
    );
  }
  return result;
}

export const searchJobs = async (
  filters: SearchFilters,
  page = 0,
  size = 10,
): Promise<PaginatedJobs> => {
  const snapshot = await getDocs(collection(db, 'jobs'));
  const allJobs: Job[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Job, 'id'>) }));
  const jobs = applySearchFilters(allJobs, filters);
  const start = page * size;
  return {
    jobs: jobs.slice(start, start + size),
    total: jobs.length,
  };
};

// Mutations (post/update/delete) go through the authenticated Express API,
// not direct Firestore writes — see JobForm and the functions backend.
