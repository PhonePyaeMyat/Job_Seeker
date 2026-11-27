/**
 * Base URL of the Firebase Functions Express API.
 * Same pattern as greenhouseService.ts: prefer REACT_APP_API_URL, fall back
 * to the deployed us-central1 URL for project job-seeker-80fd8. Local
 * development can point it at the Functions emulator instead.
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://us-central1-job-seeker-80fd8.cloudfunctions.net/api';
