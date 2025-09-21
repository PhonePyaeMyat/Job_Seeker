// Vercel serverless function for individual job operations
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const doc = await jobsCollection.doc(id).get();
        if (!doc.exists) {
          return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ id: doc.id, ...doc.data() });
        break;

      case 'PUT':
        const updateData = req.body;
        await jobsCollection.doc(id).set(updateData, { merge: true });
        res.json({ id, ...updateData });
        break;

      case 'DELETE':
        await jobsCollection.doc(id).delete();
        res.json({ message: 'Job deleted' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
