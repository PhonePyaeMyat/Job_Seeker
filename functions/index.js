const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const jobsCollection = db.collection('jobs');

// Create Express app
const app = express();

// Configure CORS for production and development
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, 'https://job-seeker-80fd8.web.app'] // Replace with your actual frontend URL
  : ['http://localhost:3000'];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
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
