# Greenhouse Integration Guide

This document explains how to use the Greenhouse integration feature to sync jobs from your Greenhouse job board to your Job Seeker platform.

## Overview

The Greenhouse integration allows you to automatically sync job postings from Greenhouse's Job Board API into your Job Seeker platform. This enables you to display Greenhouse jobs alongside your own job listings.

## Features

- **One-Click Sync**: Sync all jobs from a Greenhouse board with a single click
- **Preview Before Sync**: Preview jobs from Greenhouse before importing them
- **Automatic Mapping**: Greenhouse job data is automatically mapped to your job format
- **Duplicate Prevention**: Existing jobs are updated instead of duplicated
- **Error Handling**: Comprehensive error handling and reporting

## How to Use

### Step 1: Access the Admin Panel

1. Log in to your Job Seeker platform as an administrator
2. Navigate to the Admin Panel
3. Click on the "Integrations" tab

### Step 2: Find Your Greenhouse Board Token

Your Greenhouse board token is found in your Greenhouse job board URL:

```
https://boards.greenhouse.io/YOUR_TOKEN
```

The part after `/boards.greenhouse.io/` is your board token.

### Step 3: Preview Jobs

1. Enter your Greenhouse board token in the input field
2. Click "Preview Jobs" to see what jobs will be synced
3. Review the preview to ensure the correct jobs will be imported

### Step 4: Sync Jobs

1. Click "Sync to Database" to import the jobs
2. Wait for the sync to complete
3. Review the sync results showing:
   - Total jobs found
   - Successfully synced jobs
   - Any errors that occurred

### Step 5: View Synced Jobs

Synced jobs will appear in your job listings and can be viewed, edited, and managed just like regular jobs.

## Technical Details

### API Endpoints

#### Backend Endpoint
```
POST /api/jobs/sync-greenhouse
```

**Request Body:**
```json
{
  "boardToken": "your-greenhouse-board-token"
}
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

#### Greenhouse API Endpoint
```
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
```

### Data Mapping

Greenhouse job data is automatically mapped to the Job Seeker format:

| Greenhouse Field | Job Seeker Field | Notes |
|-----------------|------------------|-------|
| `title` | `title` | Direct mapping |
| `departments[0].name` | `company` | Uses first department |
| `location.name` | `location` | Direct mapping |
| Derived from title/location | `type` | FULL_TIME, PART_TIME, REMOTE, etc. |
| "Competitive" | `salary` | Default value |
| `content` | `description` | Full job description |
| `content` | `requirements` | Same as description |
| "MID" | `experienceLevel` | Default value |
| Extracted from content | `skills` | Auto-detected from description |
| `updated_at` | `postedDate` | Last update date |
| `id` | `greenhouseId` | Track Greenhouse ID |
| `internal_job_id` | `greenhouseInternalId` | Internal Greenhouse ID |
| `absolute_url` | `greenhouseUrl` | Link to Greenhouse posting |

### Job Type Detection

Job types are automatically detected from the job title and location:

- **REMOTE**: Location contains "remote"
- **INTERNSHIP**: Title contains "intern" or "internship"
- **CONTRACT**: Title contains "contract" or "consultant"
- **PART_TIME**: Title contains "part-time" or "part time"
- **FULL_TIME**: Default for all other jobs

### Skills Extraction

Common skills are automatically extracted from the job description, including:
- JavaScript, TypeScript, React, Node.js
- Python, Java, C++
- SQL, MongoDB, PostgreSQL
- AWS, Docker, Kubernetes
- And many more...

### Duplicate Prevention

The system checks for existing jobs by comparing the `greenhouseId` field. If a job with the same Greenhouse ID exists, it will be updated instead of creating a duplicate.

## Error Handling

Common errors and their solutions:

### "Failed to fetch Greenhouse jobs"
- **Cause**: Invalid board token or Greenhouse API is down
- **Solution**: Verify your board token is correct and try again

### "Cannot connect to server"
- **Cause**: Backend server is not running
- **Solution**: Ensure your Firebase Functions are deployed and running

### "Error processing job X"
- **Cause**: Individual job data is malformed
- **Solution**: Check the Greenhouse job posting for missing required fields

## Security Considerations

- Board tokens are publicly accessible and safe to use in frontend code
- No authentication is required for Greenhouse Job Board API
- Greenhouse data is stored in your Firebase database
- Regular syncing ensures data stays up-to-date

## Scheduling Automatic Syncs

To automatically sync jobs on a schedule, you can:

1. Create a scheduled Firebase Cloud Function
2. Use the sync endpoint in your cron job
3. Use external scheduling services like Zapier or Make

## Limitations

- Greenhouse API does not provide salary information in the standard API
- Experience levels must be defaulted or inferred
- Skills are auto-detected and may not be 100% accurate
- Custom Greenhouse fields are not automatically mapped

## Support

For issues or questions:
1. Check the Greenhouse API documentation: https://developers.greenhouse.io/job-board.html
2. Review error messages in the sync results
3. Check browser console for detailed error logs
4. Contact support if issues persist

## Future Enhancements

Planned improvements:
- Support for Greenhouse custom fields
- Automatic scheduling and syncing
- More ATS integrations (Workday, Lever, etc.)
- Enhanced skill detection
- Salary data extraction from job descriptions
