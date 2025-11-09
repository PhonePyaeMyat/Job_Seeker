const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://us-central1-job-seeker-80fd8.cloudfunctions.net/api';

export interface GreenhouseSyncResponse {
  message: string;
  total: number;
  synced: number;
  errors: number;
}

/**
 * Sync jobs from Greenhouse API
 * @param boardToken - The Greenhouse board token
 * @returns Promise with sync results
 */
export const syncGreenhouseJobs = async (boardToken: string): Promise<GreenhouseSyncResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/sync-greenhouse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boardToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync Greenhouse jobs');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error syncing Greenhouse jobs:', error);
    throw error;
  }
};

/**
 * Fetch jobs directly from Greenhouse API (for preview)
 * @param boardToken - The Greenhouse board token
 * @returns Promise with jobs data
 */
export const fetchGreenhouseJobsPreview = async (boardToken: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Greenhouse jobs');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching Greenhouse jobs:', error);
    throw error;
  }
};

/**
 * Fetch Greenhouse jobs via backend (mapped format, no storage)
 * @param boardToken - The Greenhouse board token
 * @returns Promise with mapped jobs data
 */
export const fetchGreenhouseJobsDisplay = async (boardToken: string): Promise<{ jobs: any[], total: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/greenhouse/${boardToken}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch Greenhouse jobs');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching Greenhouse jobs:', error);
    throw error;
  }
};
