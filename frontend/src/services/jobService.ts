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
import { db, auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  experienceLevel: string;
  skills: string[];
  active: boolean;
  postedDate: string;
  expiryDate: string;
  applicants: string[];
  postedBy?: string;
  companyId?: string;
  status?: string;
  featured?: boolean;
  greenhouseId?: number;
  greenhouseInternalId?: number;
  greenhouseUrl?: string;
  metadata?: any;
  source?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  applicationMethod: string;
  appliedAt: any;
  status: 'pending' | 'interview' | 'offer' | 'rejected';
  coverLetter?: string;
  additionalInfo?: string;
  profileData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
    coverLetter?: string;
  };
  cvFile?: {
    name: string;
    size: number;
    type: string;
    url: string | null;
    path?: string;
    status: string;
  };
}

export const APPLICATION_STATUSES = ['pending', 'interview', 'offer', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

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
  nextCursor?: string | null;
}

export interface EmployerApplications {
  applications: Application[];
  total: number;
  counts: Record<ApplicationStatus, number>;
}

/**
 * Small wrapper for the Cloud Functions API. With `requireAuth` it sends
 * the caller's Firebase ID token; on any non-2xx response it throws an
 * Error carrying the server's message.
 */
async function apiRequest(
  path: string,
  init: RequestInit = {},
  options: { requireAuth?: boolean } = {},
): Promise<any> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (options.requireAuth) {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : null;
    if (!token) throw new Error('Please sign in to continue');
    headers.Authorization = `Bearer ${token}`;
  }
  if (init.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Get all jobs — newest first, cursor paginated (Phase 2: the API now
// paginates server-side instead of fetching the whole collection).
export const getJobs = async (cursor: string | null = null, size = 10): Promise<PaginatedJobs> => {
  const params = new URLSearchParams({ size: String(size) });
  if (cursor) params.set('cursor', cursor);
  const data = await apiRequest(`/jobs?${params.toString()}`);
  return { jobs: data.jobs || [], total: data.total || 0, nextCursor: data.nextCursor || null };
};

// Search jobs with filters — Phase 2: exact filters run as Firestore
// queries on the server; substring filters run in memory over the bounded,
// server-filtered set (Firestore has no substring search). See
// functions/index.js for the full note.
export const searchJobs = async (
  filters: SearchFilters,
  page = 0,
  size = 10,
): Promise<PaginatedJobs> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.location) params.set('location', filters.location);
  if (filters.type) params.set('type', filters.type);
  if (filters.salary) params.set('salary', filters.salary);
  if (filters.experience) params.set('experience', filters.experience);
  if (filters.company) params.set('company', filters.company);
  if (filters.remote) params.set('remote', 'true');
  if (filters.datePosted) params.set('datePosted', filters.datePosted);
  const data = await apiRequest(`/jobs/search?${params.toString()}`);
  return { jobs: data.jobs || [], total: data.total || 0 };
};

// Get job by ID (single document read — direct Firestore is fine here)
export const getJobById = async (id: string): Promise<Job | null> => {
  const jobDoc = await getDoc(doc(db, 'jobs', id));
  if (!jobDoc.exists()) {
    return null;
  }
  return { id: jobDoc.id, ...jobDoc.data() } as Job;
};

export interface ApplyExtras {
  coverLetter?: string;
  additionalInfo?: string;
  profileData?: Application['profileData'];
  cvFile?: Application['cvFile'];
}

// Apply to a job — one application record, idempotent. Optional extras
// (cover letter, profile data, uploaded CV metadata) are stored on the
// application record. Returns { alreadyApplied } when the user applied
// before, so callers can say so instead of failing.
export const applyToJob = async (
  jobId: string,
  userId: string,
  applicationMethod: 'quick' | 'profile' | 'cv' = 'quick',
  extras: ApplyExtras = {},
): Promise<{ applicationId: string; alreadyApplied: boolean }> => {
  // Check if user already applied
  const jobRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(jobRef);
  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }

  const jobData = jobDoc.data();
  const applicants = jobData.applicants || [];

  if (applicants.includes(userId)) {
    return { applicationId: '', alreadyApplied: true };
  }

  // Get user details
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.exists() ? userDoc.data() : {};

  const applicationData: Record<string, unknown> = {
    jobId,
    jobTitle: jobData.title || '',
    companyName: jobData.company || '',
    companyId: jobData.companyId || '',
    userId,
    userName: userData.displayName || userData.email?.split('@')[0] || 'User',
    userEmail: userData.email || '',
    applicationMethod,
    appliedAt: serverTimestamp(),
    status: 'pending',
  };
  if (extras.coverLetter) applicationData.coverLetter = extras.coverLetter;
  if (extras.additionalInfo) applicationData.additionalInfo = extras.additionalInfo;
  if (extras.profileData) applicationData.profileData = extras.profileData;
  if (extras.cvFile) applicationData.cvFile = extras.cvFile;

  const applicationRef = await addDoc(collection(db, 'applications'), applicationData);

  // Add user to job's applicants array
  await updateDoc(jobRef, {
    applicants: arrayUnion(userId),
  });

  return { applicationId: applicationRef.id, alreadyApplied: false };
};

// Get user's applications — newest first, with the job's posted date
// (Phase 1 fix) rather than the application's date where relevant.
export const getUserApplications = async (userId: string): Promise<Application[]> => {
  const applicationsRef = collection(db, 'applications');
  const q = query(applicationsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const applications = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  })) as Application[];

  // Sort by appliedAt (newest first) and add job posted date
  const sortedApplications = applications.sort((a, b) => {
    const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt);
    const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Fetch job details to get posted dates
  for (const app of sortedApplications) {
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
      if (jobDoc.exists()) {
        (app as any).jobPostedDate = jobDoc.data().postedDate;
      }
    } catch (error) {
      // Continue without job posted date
    }
  }

  return sortedApplications;
};

// Move an application through the status pipeline (pending → interview →
// offer / rejected). Only the job poster or an admin may do this — the API
// and the Firestore rules both enforce it.
export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> => {
  const data = await apiRequest(
    `/applications/${applicationId}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { requireAuth: true },
  );
  return data as Application;
};

// Applications for one job, newest first (job poster or admin only).
export const getJobApplications = async (jobId: string): Promise<Application[]> => {
  const data = await apiRequest(`/jobs/${jobId}/applications`, {}, { requireAuth: true });
  return (data.applications || []) as Application[];
};

// All applications for jobs posted by the caller, newest first, with counts
// by status. Optional `from`/`to` (ISO dates) narrow the set — the
// employer dashboard's date filter uses them.
export const getEmployerApplications = async (
  opts: { from?: string; to?: string } = {},
): Promise<EmployerApplications> => {
  const params = new URLSearchParams();
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  const qs = params.toString();
  const data = await apiRequest(
    `/applications/employer${qs ? `?${qs}` : ''}`,
    {},
    { requireAuth: true },
  );
  return {
    applications: (data.applications || []) as Application[],
    total: data.total || 0,
    counts: data.counts || { pending: 0, interview: 0, offer: 0, rejected: 0 },
  };
};

// Helper function to parse salary strings for filtering
export const parseSalaryNumbers = (salary: string | undefined): [number, number] | null => {
  if (!salary) return null;
  const nums = salary.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number);
  return [Math.min(...values), Math.max(...values)];
};

// Helper function to apply search filters to jobs (client-side)
// NOTE: Phase 2 moved job search to the server (searchJobs above). This
// helper stays because JobSeekerHome still filters its bounded 20-job
// window in memory — it is NOT the main search path any more.
export const applySearchFilters = (jobs: Job[], filters: SearchFilters): Job[] => {
  let filtered = [...jobs];

  // Keyword search
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword),
    );
  }

  // Location filter
  if (filters.location) {
    filtered = filtered.filter((job) =>
      job.location.toLowerCase().includes(filters.location.toLowerCase()),
    );
  }

  // Job type filter
  if (filters.type) {
    filtered = filtered.filter((job) => job.type === filters.type);
  }

  // Salary filter
  if (filters.salary) {
    const [filterMin, filterMax] = filters.salary.endsWith('+')
      ? [parseInt(filters.salary), Infinity]
      : filters.salary.split('-').map((n) => parseInt(n));

    filtered = filtered.filter((job) => {
      const salaryRange = parseSalaryNumbers(job.salary);
      if (!salaryRange) return false;
      return salaryRange[1] >= filterMin && salaryRange[0] <= filterMax;
    });
  }

  // Experience level filter
  if (filters.experience) {
    const experienceMap: Record<string, string> = {
      ENTRY: 'ENTRY',
      MID: 'MID',
      SENIOR: 'SENIOR',
      EXECUTIVE: 'SENIOR',
    };
    const targetLevel = experienceMap[filters.experience] || filters.experience;
    filtered = filtered.filter((job) => job.experienceLevel === targetLevel);
  }

  // Company filter
  if (filters.company) {
    filtered = filtered.filter((job) =>
      job.company.toLowerCase().includes(filters.company.toLowerCase()),
    );
  }

  // Remote filter
  if (filters.remote) {
    filtered = filtered.filter(
      (job) => job.location.toLowerCase().includes('remote') || job.type === 'REMOTE',
    );
  }

  // Date posted filter
  if (filters.datePosted) {
    const days = parseInt(filters.datePosted);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    filtered = filtered.filter((job) => {
      const postedDate = new Date(job.postedDate);
      return postedDate >= cutoffDate;
    });
  }

  return filtered;
};
