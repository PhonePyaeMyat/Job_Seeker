const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Load Firebase credentials
const serviceAccountPath = path.join(__dirname, 'firebase-credentials.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Missing firebase-credentials.json. Please add your Firebase service account key.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();
const jobsCollection = db.collection('jobs');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

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
    const snapshot = await jobsCollection.get();
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(jobs);
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
    let query = jobsCollection;

    // Firestore can only filter on indexed fields, so we filter location and type in query
    if (location) {
      query = query.where('location', '==', location);
    }
    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    let jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Keyword search (in-memory, since Firestore doesn't support OR text search)
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      jobs = jobs.filter(job =>
        (job.title && job.title.toLowerCase().includes(lowerKeyword)) ||
        (job.description && job.description.toLowerCase().includes(lowerKeyword))
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
      size: pageSize
    });
  } catch (error) {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 