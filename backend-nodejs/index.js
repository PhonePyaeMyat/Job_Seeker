const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 