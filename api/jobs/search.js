// Vercel serverless function for job search
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const { keyword = '', location = '', type = '', page = 0, size = 10 } = req.query;
    console.log('Search request with params:', { keyword, location, type, page, size });
    
    // Get all jobs first, then filter in memory
    const snapshot = await jobsCollection.get();
    let jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
}
