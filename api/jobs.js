// Vercel serverless function for jobs API
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const jobsCollection = db.collection('jobs');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get job by ID
          const doc = await jobsCollection.doc(req.query.id).get();
          if (!doc.exists) {
            return res.status(404).json({ error: 'Job not found' });
          }
          res.json({ id: doc.id, ...doc.data() });
        } else {
          // Get all jobs with pagination
          const { page = 0, size = 10, keyword = '', location = '', type = '' } = req.query;
          const pageNum = parseInt(page, 10) || 0;
          const pageSize = parseInt(size, 10) || 10;
          
          const snapshot = await jobsCollection.get();
          let jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Apply filters
          if (location) {
            jobs = jobs.filter(job => job.location && job.location.toLowerCase().includes(location.toLowerCase()));
          }
          
          if (type) {
            jobs = jobs.filter(job => job.type === type);
          }

          if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            jobs = jobs.filter(job =>
              (job.title && job.title.toLowerCase().includes(lowerKeyword)) ||
              (job.description && job.description.toLowerCase().includes(lowerKeyword)) ||
              (job.company && job.company.toLowerCase().includes(lowerKeyword))
            );
          }

          // Pagination
          const start = pageNum * pageSize;
          const paginatedJobs = jobs.slice(start, start + pageSize);

          res.json({
            jobs: paginatedJobs,
            total: jobs.length,
            page: pageNum,
            size: pageSize
          });
        }
        break;

      case 'POST':
        // Create new job
        const jobData = req.body;
        const docRef = await jobsCollection.add(jobData);
        res.status(201).json({ id: docRef.id, ...jobData });
        break;

      case 'PUT':
        // Update job
        const { id } = req.query;
        const updateData = req.body;
        await jobsCollection.doc(id).set(updateData, { merge: true });
        res.json({ id, ...updateData });
        break;

      case 'DELETE':
        // Delete job
        const { id: deleteId } = req.query;
        await jobsCollection.doc(deleteId).delete();
        res.json({ message: 'Job deleted' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
