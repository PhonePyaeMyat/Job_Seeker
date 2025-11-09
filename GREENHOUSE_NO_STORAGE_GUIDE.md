# Greenhouse Integration - Two Modes

The Greenhouse integration now supports **two modes** for handling jobs from Greenhouse.

## Mode 1: Display Only (No Storage) ✅

### What It Does
- Fetches jobs from Greenhouse API in real-time
- Displays jobs to users immediately
- **Does NOT store jobs in Firestore**
- Jobs are fetched fresh each time

### When To Use
- You want to display Greenhouse jobs without using database storage
- You want always-up-to-date job listings
- You don't need to edit or manage the jobs locally
- You want to save on Firestore read/write costs

### How It Works

**Backend Endpoint:**
```
GET /api/jobs/greenhouse/:boardToken
```

**Frontend Service:**
```typescript
fetchGreenhouseJobsDisplay(boardToken)
```

**Response:**
```json
{
  "jobs": [...],  // Mapped job objects
  "total": 25,
  "source": "greenhouse"
}
```

### Example Usage

```typescript
// Fetch jobs (no storage)
const data = await fetchGreenhouseJobsDisplay('exotec');
console.log(data.jobs);  // Array of mapped jobs

// Jobs have these extra fields:
// - id: "gh_123456" (prefixed)
// - source: "greenhouse"
// - greenhouseUrl: Direct link to Greenhouse posting
```

### Benefits
✅ No database writes  
✅ Always current data  
✅ No storage costs  
✅ No sync complexity  
✅ Jobs link directly to Greenhouse

### Limitations
❌ Jobs disappear on refresh (unless fetched again)  
❌ Can't edit or customize jobs locally  
❌ Requires API call each time  
❌ No offline access  

---

## Mode 2: Sync to Database 📦

### What It Does
- Fetches jobs from Greenhouse API
- Copies them into your Firestore database
- Tracks duplicates by Greenhouse ID
- Updates existing jobs

### When To Use
- You want to store jobs permanently
- You need to edit or customize job data
- You want offline access to jobs
- You're building a unified job board

### How It Works

**Backend Endpoint:**
```
POST /api/jobs/sync-greenhouse
Body: { "boardToken": "exotec" }
```

**Response:**
```json
{
  "message": "Greenhouse sync completed",
  "total": 25,
  "synced": 24,
  "errors": 1
}
```

### Benefits
✅ Permanent storage  
✅ Edit and customize jobs  
✅ Offline access  
✅ Unified with your other jobs  
✅ Can track applications  

### Limitations
❌ Uses Firestore storage  
❌ Requires periodic syncing  
❌ Data can become stale  

---

## Comparison Table

| Feature | Display Only | Sync to DB |
|---------|-------------|------------|
| Storage | ❌ No | ✅ Yes |
| Always Current | ✅ Yes | ❌ Requires sync |
| Offline Access | ❌ No | ✅ Yes |
| Editable | ❌ No | ✅ Yes |
| Cost | 💚 Low | 💛 Higher |
| Complexity | 💚 Simple | 💛 More complex |

---

## Code Examples

### Display Mode (No Storage)

```typescript
// In GreenhouseIntegration component
const handleLoadDisplay = async () => {
  const data = await fetchGreenhouseJobsDisplay(boardToken);
  setDisplayJobs(data.jobs);
  // Jobs are now displayed but NOT stored
};
```

### Sync Mode (With Storage)

```typescript
// In GreenhouseIntegration component
const handleSync = async () => {
  const results = await syncGreenhouseJobs(boardToken);
  // Jobs are now in Firestore
  // They persist across sessions
};
```

---

## Which Mode Should I Choose?

**Choose Display Only if:**
- You just want to show Greenhouse jobs alongside yours
- You don't need to edit them
- You want automatic updates
- Storage costs are a concern

**Choose Sync to Database if:**
- You need a permanent copy of the jobs
- You want to edit or customize them
- You need offline access
- You're building a unified job board

---

## UI Differences

### Display Mode
- Green "Load Greenhouse Jobs" button
- Shows jobs with "Not stored" indicator
- One-click loading
- Jobs disappear on refresh

### Sync Mode
- Gray "Preview" and Blue "Sync" buttons
- Shows preview first
- Two-step process
- Jobs persist in database

---

## Technical Implementation

### Backend Routes

**Display Mode:**
```javascript
app.get('/jobs/greenhouse/:boardToken', async (req, res) => {
  // Fetch from Greenhouse API
  // Map to your format
  // Return immediately (no storage)
});
```

**Sync Mode:**
```javascript
app.post('/jobs/sync-greenhouse', async (req, res) => {
  // Fetch from Greenhouse API
  // Map to your format
  // Check for duplicates
  // Store in Firestore
});
```

### Frontend Services

**Display Mode:**
```typescript
fetchGreenhouseJobsDisplay(boardToken)
  → GET /api/jobs/greenhouse/:boardToken
  → Returns mapped jobs
  → No storage
```

**Sync Mode:**
```typescript
syncGreenhouseJobs(boardToken)
  → POST /api/jobs/sync-greenhouse
  → Stores in Firestore
  → Returns sync results
```

---

## Summary

You now have **two ways** to use Greenhouse jobs:

1. **Display Only** - Just show them (no storage)
2. **Sync** - Store them in your database

Choose based on your needs! 🎯
