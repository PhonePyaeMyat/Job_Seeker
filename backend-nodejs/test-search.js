const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSearch() {
  try {
    console.log('Testing search functionality...\n');

    // Test 1: Get all jobs
    console.log('1. Testing get all jobs...');
    const allJobs = await axios.get(`${BASE_URL}/jobs`);
    console.log(`Found ${allJobs.data.length} total jobs\n`);

    // Test 2: Search by keyword
    console.log('2. Testing keyword search for "React"...');
    const reactJobs = await axios.get(`${BASE_URL}/jobs/search?keyword=React`);
    console.log(`Found ${reactJobs.data.jobs.length} jobs with "React" keyword\n`);

    // Test 3: Search by location
    console.log('3. Testing location search for "New York"...');
    const nyJobs = await axios.get(`${BASE_URL}/jobs/search?location=New York`);
    console.log(`Found ${nyJobs.data.jobs.length} jobs in "New York"\n`);

    // Test 4: Search by type
    console.log('4. Testing type search for "FULL_TIME"...');
    const fullTimeJobs = await axios.get(`${BASE_URL}/jobs/search?type=FULL_TIME`);
    console.log(`Found ${fullTimeJobs.data.jobs.length} full-time jobs\n`);

    // Test 5: Combined search
    console.log('5. Testing combined search (keyword + location)...');
    const combinedSearch = await axios.get(`${BASE_URL}/jobs/search?keyword=Developer&location=New York`);
    console.log(`Found ${combinedSearch.data.jobs.length} developer jobs in New York\n`);

    // Test 6: Search with no results
    console.log('6. Testing search with no results...');
    const noResults = await axios.get(`${BASE_URL}/jobs/search?keyword=NonExistentJob`);
    console.log(`Found ${noResults.data.jobs.length} jobs for non-existent keyword\n`);

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testSearch();
