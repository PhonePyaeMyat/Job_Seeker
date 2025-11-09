const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const jobsCollection = db.collection('jobs');

// Create Express app
const app = express();

// Configure CORS for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://job-seeker-80fd8.web.app'
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

// Create a new job
app.post('/jobs', async (req, res) => {
  try {
    const jobData = req.body;
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
      size: pageSize
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

// Update a job by ID
app.put('/jobs/:id', async (req, res) => {
  try {
    const jobData = req.body;
    await jobsCollection.doc(req.params.id).set(jobData, { merge: true });
    res.json({ id: req.params.id, ...jobData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job by ID
app.delete('/jobs/:id', async (req, res) => {
  try {
    await jobsCollection.doc(req.params.id).delete();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search jobs with filters and pagination
app.get('/jobs/search', async (req, res) => {
  try {
    const { keyword = '', location = '', type = '', page = 0, size = 10 } = req.query;
    console.log('Search request with params:', { keyword, location, type, page, size });
    
    let jobs = [];

    // Get all jobs first, then filter in memory to avoid Firestore index issues
    const snapshot = await jobsCollection.get();
    jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Total jobs found:', jobs.length);

    // Apply filters in memory
    if (location) {
      jobs = jobs.filter(job => job.location && job.location.toLowerCase().includes(location.toLowerCase()));
      console.log('After location filter:', jobs.length, 'jobs');
    }
    
    if (type) {
      jobs = jobs.filter(job => job.type === type);
      console.log('After type filter:', jobs.length, 'jobs');
    }

    // Keyword search (in-memory)
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      jobs = jobs.filter(job =>
        (job.title && job.title.toLowerCase().includes(lowerKeyword)) ||
        (job.description && job.description.toLowerCase().includes(lowerKeyword)) ||
        (job.company && job.company.toLowerCase().includes(lowerKeyword))
      );
      console.log('After keyword filter:', jobs.length, 'jobs');
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
      size: pageSize
    });
  } catch (error) {
    console.error('Search error:', error);
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

    console.log(`Fetched ${greenhouseJobs.length} jobs from Greenhouse for display`);

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
      source: 'greenhouse' // Mark as Greenhouse job
    }));

    res.json({
      jobs: mappedJobs,
      total: mappedJobs.length,
      source: 'greenhouse'
    });
  } catch (error) {
    console.error('Error fetching Greenhouse jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync jobs from Greenhouse API to Firestore
app.post('/jobs/sync-greenhouse', async (req, res) => {
  try {
    const { boardToken } = req.body;
    
    if (!boardToken) {
      return res.status(400).json({ error: 'Missing boardToken parameter' });
    }

    // Fetch jobs from Greenhouse API
    const greenhouseUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    const response = await axios.get(greenhouseUrl);
    const greenhouseJobs = response.data.jobs || [];

    console.log(`Fetched ${greenhouseJobs.length} jobs from Greenhouse`);

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
          metadata: greenhouseJob.metadata
        };

        // Check if job already exists (by Greenhouse ID)
        const existingJobQuery = await jobsCollection
          .where('greenhouseId', '==', greenhouseJob.id)
          .get();

        if (!existingJobQuery.empty) {
          // Update existing job
          const existingDoc = existingJobQuery.docs[0];
          await jobsCollection.doc(existingDoc.id).update(jobData);
          console.log(`Updated job: ${jobData.title}`);
        } else {
          // Create new job
          await jobsCollection.add(jobData);
          console.log(`Created job: ${jobData.title}`);
        }
        syncedCount++;
      } catch (error) {
        console.error(`Error processing job ${greenhouseJob.id}:`, error.message);
        errorCount++;
      }
    }

    res.json({
      message: 'Greenhouse sync completed',
      total: greenhouseJobs.length,
      synced: syncedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Greenhouse sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply to a job
app.post('/jobs/:id/apply', async (req, res) => {
  try {
    const jobId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const jobRef = jobsCollection.doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Add userId to applicants array (if not already applied)
    await jobRef.update({
      applicants: admin.firestore.FieldValue.arrayUnion(userId)
    });

    res.json({ message: 'Application successful' });
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
function extractSalary(greenhouseJob) {
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
    'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD'
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

// Add sample jobs function
exports.addSampleJobs = functions.https.onRequest(async (req, res) => {
  try {
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
        companyId: 'tech-corp-001'
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
        companyId: 'startup-inc-001'
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
        companyId: 'enterprise-solutions-001'
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
        companyId: 'small-business-inc-001'
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
        companyId: 'tech-startup-001'
      }
    ];

    for (const job of sampleJobs) {
      await jobsCollection.add(job);
    }
    console.log('Sample jobs added successfully');
    res.json({ message: 'Sample jobs added successfully' });
  } catch (error) {
    console.log('Sample jobs already exist or error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
