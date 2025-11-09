import React, { useState } from 'react';
import { syncGreenhouseJobs, fetchGreenhouseJobsPreview, fetchGreenhouseJobsDisplay } from '../services/greenhouseService';

interface GreenhouseIntegrationProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const GreenhouseIntegration: React.FC<GreenhouseIntegrationProps> = ({ onSuccess, onError }) => {
  const [boardToken, setBoardToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [mode, setMode] = useState<'display' | 'sync'>('display');
  const [displayJobs, setDisplayJobs] = useState<any[]>([]);

  const handlePreview = async () => {
    if (!boardToken.trim()) {
      onError?.('Please enter a board token');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchGreenhouseJobsPreview(boardToken);
      setPreviewData(data);
      setShowPreview(true);
    } catch (error: any) {
      onError?.(error.message || 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDisplay = async () => {
    if (!boardToken.trim()) {
      onError?.('Please enter a board token');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchGreenhouseJobsDisplay(boardToken);
      setDisplayJobs(data.jobs || []);
      setShowPreview(true);
      onSuccess?.(`Loaded ${data.jobs?.length || 0} jobs from Greenhouse (display mode)`);
    } catch (error: any) {
      onError?.(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!boardToken.trim()) {
      onError?.('Please enter a board token');
      return;
    }

    setSyncing(true);
    try {
      const results = await syncGreenhouseJobs(boardToken);
      setSyncResults(results);
      onSuccess?.(`Successfully synced ${results.synced} jobs from Greenhouse`);
    } catch (error: any) {
      onError?.(error.message || 'Failed to sync jobs');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Greenhouse Integration</h2>
      
      <div className="space-y-4">
        {/* Input for board token */}
        <div>
          <label htmlFor="boardToken" className="block text-sm font-medium text-gray-700 mb-2">
            Greenhouse Board Token
          </label>
          <input
            id="boardToken"
            type="text"
            value={boardToken}
            onChange={(e) => setBoardToken(e.target.value)}
            placeholder="Enter your Greenhouse board token"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500">
            Find your board token in your Greenhouse job board URL: 
            <code className="bg-gray-100 px-2 py-1 rounded">boards.greenhouse.io/YOUR_TOKEN</code>
          </p>
        </div>

        {/* Mode selection */}
        <div className="p-4 bg-gray-50 rounded-md border-2 border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">Choose integration mode:</h4>
          <div className="space-y-2">
            <div className="flex items-start">
              <input 
                type="radio" 
                id="mode-display" 
                name="mode" 
                value="display" 
                checked={mode === 'display'}
                onChange={() => setMode('display')}
                className="mt-1 mr-2" 
              />
              <label htmlFor="mode-display" className="flex-1">
                <span className="font-medium text-gray-800">Display Only (No Storage)</span>
                <p className="text-sm text-gray-600">Fetch and display jobs from Greenhouse without storing them. Jobs are fetched fresh each time.</p>
              </label>
            </div>
            <div className="flex items-start">
              <input 
                type="radio" 
                id="mode-sync" 
                name="mode" 
                value="sync" 
                checked={mode === 'sync'}
                onChange={() => setMode('sync')}
                className="mt-1 mr-2" 
              />
              <label htmlFor="mode-sync" className="flex-1">
                <span className="font-medium text-gray-800">Sync to Database</span>
                <p className="text-sm text-gray-600">Copy jobs from Greenhouse into your Firestore database for permanent access and editing.</p>
              </label>
            </div>
          </div>
        </div>

        {/* Action buttons based on mode */}
        <div className="flex gap-3">
          {mode === 'display' ? (
            <button
              onClick={handleLoadDisplay}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading Jobs...' : 'Load Greenhouse Jobs'}
            </button>
          ) : (
            <>
              <button
                onClick={handlePreview}
                disabled={loading || syncing}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading Preview...' : 'Preview Jobs'}
              </button>
              
              <button
                onClick={handleSync}
                disabled={loading || syncing || !showPreview}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync to Database'}
              </button>
            </>
          )}
        </div>

        {/* Display mode: Show loaded jobs */}
        {mode === 'display' && displayJobs.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Loaded Jobs (Display Mode)</h3>
            <p className="text-sm text-green-700 mb-3">
              <strong>{displayJobs.length}</strong> jobs loaded from Greenhouse
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayJobs.slice(0, 10).map((job: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded border border-green-100">
                  <h4 className="font-medium text-gray-800">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.location}</p>
                  <p className="text-xs text-green-600 mt-1">• Not stored in database</p>
                </div>
              ))}
              {displayJobs.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {displayJobs.length - 10} more jobs
                </p>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-700">
                <strong>Note:</strong> These jobs are not saved to your database. They'll be fetched fresh each time you load them.
              </p>
            </div>
          </div>
        )}

        {/* Sync mode: Preview section */}
        {mode === 'sync' && showPreview && previewData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-700 mb-2">Preview</h3>
            <p className="text-sm text-gray-600 mb-3">
              Found <strong>{previewData.jobs?.length || 0}</strong> jobs from Greenhouse
            </p>
            
            {previewData.jobs && previewData.jobs.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {previewData.jobs.slice(0, 5).map((job: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-800">{job.title}</h4>
                    <p className="text-sm text-gray-600">
                      {job.location?.name || 'Location not specified'}
                    </p>
                  </div>
                ))}
                {previewData.jobs.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {previewData.jobs.length - 5} more jobs
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sync results */}
        {syncResults && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Sync Complete!</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p>Total jobs: {syncResults.total}</p>
              <p>Successfully synced: {syncResults.synced}</p>
              {syncResults.errors > 0 && (
                <p className="text-yellow-600">Errors: {syncResults.errors}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Enter your Greenhouse board token</li>
          <li>Click "Preview Jobs" to see what will be synced</li>
          <li>Click "Sync to Database" to import jobs into your job board</li>
          <li>Synced jobs will appear in your job listings</li>
        </ol>
      </div>

      {/* Backend requirement notice */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Backend Required</h3>
        <p className="text-sm text-yellow-700">
          The Greenhouse sync feature requires the backend API. 
          {window.location.hostname === 'localhost' ? (
            <>
              {' '}Start the Firebase Functions emulator with:
              <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs">
                npm run dev:functions
              </code>
              Or deploy to production to use this feature.
            </>
          ) : (
            ' Deploy the functions to use this feature.'
          )}
        </p>
      </div>
    </div>
  );
};

export default GreenhouseIntegration;
