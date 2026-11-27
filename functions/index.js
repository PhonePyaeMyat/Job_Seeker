const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const jobsCollection = db.collection('jobs');
const applicationsCollection = db.collection('applications');

// Create Express app
const app = express();

// Configure CORS for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://job-seeker-80fd8.web.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  // We do not use credentials from the browser, so omit credentials to simplify
};

// Handle preflight for all routes
app.options('*', cors(corsOptions));

// Apply CORS and common headers
app.use(cors(corsOptions));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(express.json());

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Require a Firebase ID token: `Authorization: Bearer <token>`. */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * True when the caller is an admin: an `admins/{uid}` document exists, the
 * caller's user document has role 'admin', or (interim fallback) the legacy
 * admin email. The email fallback should be removed once the first admin is
 * set up through the `admins` collection (see ADMIN_LOGIN_GUIDE.md).
 */
async function isAdminUser(user) {
  if (!user) return false;
  if (user.email === 'admin@jobseeker.com') return true;
  const adminDoc = await db.collection('admins').doc(user.uid).get();
  if (adminDoc.exists) return true;
  const userDoc = await db.collection('users').doc(user.uid).get();
  return userDoc.exists && userDoc.data().role === 'admin';
}

async function requireAdmin(req, res, next) {
  try {
    if (await isAdminUser(req.user)) return next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check admin status' });
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'TEMPORARY'];
const EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR'];

function isNonEmptyString(value, max = 5000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/**
 * Validate a job payload. Returns an array of error messages (empty = valid).
 * With `partial: true`, only fields that are present are validated (for PUT).
 */
function validateJobInput(body, { partial = false } = {}) {
  const errors = [];
  const check = (field, test, message) => {
    if (body[field] === undefined) {
      if (!partial) errors.push(`${field} is required`);
      return;
    }
    if (!test(body[field])) errors.push(message);
  };

  check('title', (v) => isNonEmptyString(v, 200), 'title must be a non-empty string (max 200 chars)');
  check('company', (v) => isNonEmptyString(v, 200), 'company must be a non-empty string (max 200 chars)');
  check('location', (v) => isNonEmptyString(v, 200), 'location must be a non-empty string (max 200 chars)');
  check('description', (v) => isNonEmptyString(v, 10000), 'description must be a non-empty string (max 10000 chars)');
  check(
    'requirements',
    (v) => typeof v === 'string' && v.length <= 10000,
    'requirements must be a string (max 10000 chars)',
  );
  check('type', (v) => JOB_TYPES.includes(v), `type must be one of ${JOB_TYPES.join(', ')}`);
  check(
    'experienceLevel',
    (v) => EXPERIENCE_LEVELS.includes(v),
    `experienceLevel must be one of ${EXPERIENCE_LEVELS.join(', ')}`,
  );
  check('salary', (v) => typeof v === 'string' && v.length <= 200, 'salary must be a string (max 200 chars)');
  check(
    'skills',
    (v) =>
      Array.isArray(v) &&
      v.length <= 30 &&
      v.every((s) => typeof s === 'string' && s.length <= 100),
    'skills must be an array of at most 30 strings',
  );
  check('expiryDate', (v) => !Number.isNaN(Date.parse(v)), 'expiryDate must be a valid date');
  return errors;
}

/** Fields a client may set on a job. Everything else is stamped server-side. */
function pickJobFields(body) {
  const out = {};
  const allowedFields = [
    'title',
    'company',
    'location',
    'description',
    'requirements',
    'type',
    'experienceLevel',
    'salary',
    'skills',
    'expiryDate',
  ];
  for (const field of allowedFields) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

/** Extract [min, max] numbers from a free-text salary string, or null. */
function parseSalaryNumbers(salary) {
  if (typeof salary !== 'string') return null;
  const nums = salary.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number);
  return [Math.min(...values), Math.max(...values)];
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

// Create a new job (authenticated; server stamps ownership and metadata)
app.post('/jobs', requireAuth, async (req, res) => {
  try {
    const errors = validateJobInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid job data', details: errors });
    }
    const jobData = {
      ...pickJobFields(req.body),
      type: req.body.type || 'FULL_TIME',
      experienceLevel: req.body.experienceLevel || 'ENTRY',
      skills: req.body.skills || [],
      postedBy: req.user.uid,
      companyId: req.user.uid,
      postedDate: new Date().toISOString(),
      active: true,
      status: 'pending',
      applicants: [],
    };
    const docRef = await jobsCollection.add(jobData);
    res.status(201).json({ id: docRef.id, ...jobData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all jobs
app.get('/jobs', async (req, res) => {
  try {
    const { page = 0, size = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;

    const snapshot = await jobsCollection.get();
    const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Pagination
    const start = pageNum * pageSize;
    const paginatedJobs = allJobs.slice(start, start + pageSize);

    res.json({
      jobs: paginatedJobs,
      total: allJobs.length,
      page: pageNum,
      size: pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search jobs with filters and pagination.
// NOTE: registered BEFORE /jobs/:id — Express matches routes in order, and
// /jobs/:id would otherwise swallow /jobs/search as a job-ID lookup (404).
app.get('/jobs/search', async (req, res) => {
  try {
    const {
      keyword = '',
      location = '',
      type = '',
      salary = '',
      experience = '',
      company = '',
      remote = '',
      datePosted = '',
      page = 0,
      size = 10,
    } = req.query;

    // Get all jobs first, then filter in memory to avoid Firestore index issues
    const snapshot = await jobsCollection.get();
    let jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (location) {
      jobs = jobs.filter(job => job.location && job.location.toLowerCase().includes(location.toLowerCase()));
    }

    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }

    if (company) {
      jobs = jobs.filter(job => job.company && job.company.toLowerCase().includes(company.toLowerCase()));
    }

    if (experience) {
      const wanted = experience.toUpperCase() === 'EXECUTIVE' ? 'SENIOR' : experience.toUpperCase();
      jobs = jobs.filter(job => (job.experienceLevel || '').toUpperCase() === wanted);
    }

    if (remote === 'true' || remote === true) {
      jobs = jobs.filter(job =>
        (job.location && job.location.toLowerCase().includes('remote')) || job.type === 'REMOTE');
    }

    if (salary) {
      // Salary filter is a range like "30000-50000" or "150000+".
      const [filterMin, filterMax] = salary.endsWith('+')
        ? [parseInt(salary, 10), Infinity]
        : salary.split('-').map((n) => parseInt(n, 10));
      jobs = jobs.filter(job => {
        const range = parseSalaryNumbers(job.salary);
        if (!range) return false;
        return range[1] >= filterMin && range[0] <= filterMax;
      });
    }

    if (datePosted) {
      const days = parseInt(datePosted, 10);
      if (!Number.isNaN(days)) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        jobs = jobs.filter(job => job.postedDate && new Date(job.postedDate).getTime() >= cutoff);
      }
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      jobs = jobs.filter(job =>
        (job.title && job.title.toLowerCase().includes(lowerKeyword)) ||
        (job.description && job.description.toLowerCase().includes(lowerKeyword)) ||
        (job.company && job.company.toLowerCase().includes(lowerKeyword)),
      );
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const start = pageNum * pageSize;
    const paginatedJobs = jobs.slice(start, start + pageSize);

    res.json({
      jobs: paginatedJobs,
      total: jobs.length,
      page: pageNum,
      size: pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Greenhouse jobs without storing (for display/search only)
app.get('/jobs/greenhouse/:boardToken', async (req, res) => {
  try {
    const { boardToken } = req.params;

    if (!boardToken) {
      return res.status(400).json({ error: 'Missing boardToken parameter' });
    }

    // Fetch jobs from Greenhouse API
    const greenhouseUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    const response = await axios.get(greenhouseUrl);
    const greenhouseJobs = response.data.jobs || [];

    // Map jobs to your format (without storing)
    const mappedJobs = greenhouseJobs.map(greenhouseJob => ({
      id: `gh_${greenhouseJob.id}`, // Prefix to distinguish from Firestore jobs
      title: greenhouseJob.title || '',
      company: greenhouseJob.departments?.[0]?.name || 'Unknown',
      location: greenhouseJob.location?.name || 'Unknown',
      type: mapGreenhouseJobType(greenhouseJob),
      salary: extractSalary(greenhouseJob),
      description: greenhouseJob.content || '',
      requirements: greenhouseJob.content || '',
      experienceLevel: 'MID',
      skills: extractSkills(greenhouseJob.content),
      active: true,
      postedDate: greenhouseJob.updated_at || new Date().toISOString(),
      expiryDate: greenhouseJob.updated_at ?
        new Date(new Date(greenhouseJob.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      applicants: [],
      greenhouseId: greenhouseJob.id,
      greenhouseInternalId: greenhouseJob.internal_job_id,
      greenhouseUrl: greenhouseJob.absolute_url,
      metadata: greenhouseJob.metadata,
      source: 'greenhouse', // Mark as Greenhouse job
    }));

    res.json({
      jobs: mappedJobs,
      total: mappedJobs.length,
      source: 'greenhouse',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a job by ID
app.get('/jobs/:id', async (req, res) => {
  try {
    const doc = await jobsCollection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a job by ID (owner or admin; ownership/status fields cannot be spoofed)
app.put('/jobs/:id', requireAuth, async (req, res) => {
  try {
    const jobRef = jobsCollection.doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = jobDoc.data();
    const admin = await isAdminUser(req.user);
    if (job.postedBy !== req.user.uid && !admin) {
      return res.status(403).json({ error: 'Only the job owner or an admin can update this job' });
    }
    const errors = validateJobInput(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid job data', details: errors });
    }
    const updates = pickJobFields(req.body);
    // Status changes are admin-only; owners cannot approve their own jobs.
    if (req.body.status !== undefined && admin) {
      if (!['pending', 'approved', 'rejected'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = req.body.status;
      updates.active = req.body.status === 'approved';
    }
    await jobRef.set(updates, { merge: true });
    res.json({ id: req.params.id, ...updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job by ID (owner or admin)
app.delete('/jobs/:id', requireAuth, async (req, res) => {
  try {
    const jobRef = jobsCollection.doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = jobDoc.data();
    const admin = await isAdminUser(req.user);
    if (job.postedBy !== req.user.uid && !admin) {
      return res.status(403).json({ error: 'Only the job owner or an admin can delete this job' });
    }
    await jobRef.delete();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync jobs from Greenhouse API to Firestore (admin only)
app.post('/jobs/sync-greenhouse', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { boardToken } = req.body;

    if (!boardToken) {
      return res.status(400).json({ error: 'Missing boardToken parameter' });
    }

    // Fetch jobs from Greenhouse API
    const greenhouseUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    const response = await axios.get(greenhouseUrl);
    const greenhouseJobs = response.data.jobs || [];

    let syncedCount = 0;
    let errorCount = 0;

    // Process each job from Greenhouse
    for (const greenhouseJob of greenhouseJobs) {
      try {
        // Map Greenhouse job format to our job format
        const jobData = {
          title: greenhouseJob.title || '',
          company: greenhouseJob.departments?.[0]?.name || 'Unknown',
          location: greenhouseJob.location?.name || 'Unknown',
          type: mapGreenhouseJobType(greenhouseJob),
          salary: extractSalary(greenhouseJob),
          description: greenhouseJob.content || '',
          requirements: greenhouseJob.content || '',
          experienceLevel: 'MID', // Default since not in Greenhouse API
          skills: extractSkills(greenhouseJob.content),
          active: true,
          postedDate: greenhouseJob.updated_at || new Date().toISOString(),
          expiryDate: greenhouseJob.updated_at ?
            new Date(new Date(greenhouseJob.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() :
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          applicants: [],
          greenhouseId: greenhouseJob.id,
          greenhouseInternalId: greenhouseJob.internal_job_id,
          greenhouseUrl: greenhouseJob.absolute_url,
          metadata: greenhouseJob.metadata,
        };

        // Check if job already exists (by Greenhouse ID)
        const existingJobQuery = await jobsCollection
          .where('greenhouseId', '==', greenhouseJob.id)
          .get();

        if (!existingJobQuery.empty) {
          // Update existing job
          const existingDoc = existingJobQuery.docs[0];
          await jobsCollection.doc(existingDoc.id).update(jobData);
        } else {
          // Create new job
          await jobsCollection.add(jobData);
        }
        syncedCount++;
      } catch (error) {
        errorCount++;
      }
    }

    res.json({
      message: 'Greenhouse sync completed',
      total: greenhouseJobs.length,
      synced: syncedCount,
      errors: errorCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply to a job (authenticated; the user ID always comes from the token,
// never from the request body). Creates ONE application record and updates
// the job's applicants array, so there is a single source of truth.
app.post('/jobs/:id/apply', requireAuth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.uid;

    const jobRef = jobsCollection.doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = jobDoc.data();

    // Idempotent: already applied if the uid is in the applicants array.
    if (Array.isArray(job.applicants) && job.applicants.includes(userId)) {
      return res.json({ message: 'Already applied', alreadyApplied: true });
    }

    const applicationData = {
      jobId,
      jobTitle: job.title || '',
      companyName: job.company || '',
      companyId: job.companyId || '',
      userId,
      userName: req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'User'),
      userEmail: req.user.email || '',
      applicationMethod: 'quick',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    };
    const applicationRef = await applicationsCollection.add(applicationData);

    await jobRef.update({
      applicants: admin.firestore.FieldValue.arrayUnion(userId),
    });

    res.json({ message: 'Application successful', applicationId: applicationRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to map Greenhouse job type
function mapGreenhouseJobType(greenhouseJob) {
  // You can customize this mapping based on your needs
  const title = (greenhouseJob.title || '').toLowerCase();
  const locationName = (greenhouseJob.location?.name || '').toLowerCase();

  if (locationName.includes('remote')) {
    return 'REMOTE';
  }
  if (title.includes('intern') || title.includes('internship')) {
    return 'INTERNSHIP';
  }
  if (title.includes('contract') || title.includes('consultant')) {
    return 'CONTRACT';
  }
  if (title.includes('part-time') || title.includes('part time')) {
    return 'PART_TIME';
  }
  return 'FULL_TIME';
}

// Helper function to extract salary information
function extractSalary() {
  // Greenhouse doesn't provide salary in the standard API
  // You might need to parse it from the content or add custom fields
  return 'Competitive';
}

// Helper function to extract skills from job description
function extractSkills(content) {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
    'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'HTML', 'CSS', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask',
    'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD',
  ];

  const foundSkills = [];
  const lowerContent = (content || '').toLowerCase();

  commonSkills.forEach(skill => {
    if (lowerContent.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
}

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Add sample jobs function.
// Admin only, and kept for development seeding — remove before a public
// launch. Previously this was unauthenticated, so anyone could seed fake
// jobs into production.
exports.addSampleJobs = functions.https.onRequest(async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (!(await isAdminUser(decoded))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const sampleJobs = [
      {
        title: 'Full Stack Developer',
        company: 'Tech Corp',
        location: 'New York',
        type: 'FULL_TIME',
        salary: '$80,000 - $120,000',
        description: 'We are looking for a Full Stack Developer with experience in React and Node.js.',
        requirements: '3+ years of experience with React, Node.js, and TypeScript.',
        experienceLevel: 'MID',
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        active: true,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
        companyId: 'tech-corp-001',
      },
      {
        title: 'Frontend Engineer',
        company: 'Startup Inc',
        location: 'San Francisco',
        type: 'FULL_TIME',
        salary: '$90,000 - $130,000',
        description: 'Join our team as a Frontend Engineer working with modern JavaScript frameworks.',
        requirements: 'Experience with React, Vue.js, or Angular. Knowledge of CSS and responsive design.',
        experienceLevel: 'SENIOR',
        skills: ['React', 'Vue.js', 'CSS', 'JavaScript'],
        active: true,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
        companyId: 'startup-inc-001',
      },
      {
        title: 'Backend Developer',
        company: 'Enterprise Solutions',
        location: 'Remote',
        type: 'CONTRACT',
        salary: '$70,000 - $100,000',
        description: 'Backend developer needed for API development and database management.',
        requirements: 'Experience with Node.js, Express, and PostgreSQL.',
        experienceLevel: 'MID',
        skills: ['Node.js', 'Express', 'PostgreSQL', 'REST APIs'],
        active: true,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
        companyId: 'enterprise-solutions-001',
      },
      {
        title: 'Part-time Web Developer',
        company: 'Small Business Inc',
        location: 'Chicago',
        type: 'PART_TIME',
        salary: '$40,000 - $60,000',
        description: 'Part-time web developer needed for website maintenance and updates.',
        requirements: 'Experience with HTML, CSS, JavaScript, and basic PHP.',
        experienceLevel: 'ENTRY',
        skills: ['HTML', 'CSS', 'JavaScript', 'PHP'],
        active: true,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
        companyId: 'small-business-inc-001',
      },
      {
        title: 'Software Engineering Intern',
        company: 'Tech Startup',
        location: 'Austin',
        type: 'INTERNSHIP',
        salary: '$25,000 - $35,000',
        description: 'Internship opportunity for software engineering students.',
        requirements: 'Currently enrolled in Computer Science or related field.',
        experienceLevel: 'ENTRY',
        skills: ['Java', 'Python', 'Git', 'Agile'],
        active: true,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
        companyId: 'tech-startup-001',
      },
    ];

    for (const job of sampleJobs) {
      await jobsCollection.add(job);
    }
    res.json({ message: 'Sample jobs added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
