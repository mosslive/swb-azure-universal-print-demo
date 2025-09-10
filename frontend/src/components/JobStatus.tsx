import { useState, useEffect } from 'react';
import { PrintJob, Printer } from '../types';
import { apiClient } from '../api/client';

interface JobStatusProps {
  selectedPrinter: Printer;
  createdJobId?: string;
}

export function JobStatus({ selectedPrinter, createdJobId }: JobStatusProps) {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [selectedPrinter.id, createdJobId]);

  useEffect(() => {
    // Auto-refresh every 10 seconds when there are active jobs
    const hasActiveJobs = jobs.some(job => 
      ['processing', 'queued', 'paused'].includes(job.status.state.toLowerCase())
    );

    if (hasActiveJobs) {
      const interval = setInterval(() => {
        refreshJobStatus();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobList = await apiClient.listPrintJobs(selectedPrinter.id);
      setJobs(jobList.sort((a, b) => 
        new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
      ));
    } catch (err) {
      setError('Failed to load print jobs. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobStatus = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      const jobList = await apiClient.listPrintJobs(selectedPrinter.id);
      setJobs(jobList.sort((a, b) => 
        new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
      ));
      
      // Update selected job if it exists
      if (selectedJob) {
        const updatedJob = jobList.find(job => job.id === selectedJob.id);
        if (updatedJob) {
          setSelectedJob(updatedJob);
        }
      }
    } catch (err) {
      console.error('Error refreshing job status:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleJobSelect = async (job: PrintJob) => {
    try {
      const updatedJob = await apiClient.getJobStatus(selectedPrinter.id, job.id);
      setSelectedJob(updatedJob);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setSelectedJob(job);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'printed':
        return 'green';
      case 'processing':
      case 'printing':
        return 'blue';
      case 'queued':
      case 'pending':
        return 'orange';
      case 'paused':
        return 'yellow';
      case 'failed':
      case 'error':
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="job-status">
        <h3>Print Jobs</h3>
        <div className="loading">Loading print jobs...</div>
      </div>
    );
  }

  return (
    <div className="job-status">
      <div className="job-status-header">
        <h3>Print Jobs for {selectedPrinter.name}</h3>
        <button 
          onClick={refreshJobStatus} 
          disabled={refreshing}
          className="refresh-button"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={loadJobs} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="job-status-content">
        <div className="jobs-list">
          <h4>Recent Jobs</h4>
          {jobs.length === 0 ? (
            <div className="no-jobs">No print jobs found for this printer.</div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''} ${
                    job.id === createdJobId ? 'highlighted' : ''
                  }`}
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="job-header">
                    <h5>{job.displayName}</h5>
                    <div
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(job.status.state) }}
                    />
                  </div>
                  <div className="job-details">
                    <p>
                      <strong>Status:</strong> {job.status.state}
                      {job.status.description && ` - ${job.status.description}`}
                    </p>
                    <p>
                      <strong>Created:</strong> {formatDateTime(job.createdDateTime)}
                    </p>
                    <p>
                      <strong>By:</strong> {job.createdBy.userPrincipalName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedJob && (
          <div className="job-details-panel">
            <h4>Job Details</h4>
            <div className="job-details-content">
              <div className="detail-row">
                <strong>Name:</strong> {selectedJob.displayName}
              </div>
              <div className="detail-row">
                <strong>ID:</strong> {selectedJob.id}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedJob.status.state) }}
                >
                  {selectedJob.status.state}
                </span>
                {selectedJob.status.description && (
                  <div className="status-description">{selectedJob.status.description}</div>
                )}
              </div>
              <div className="detail-row">
                <strong>Created:</strong> {formatDateTime(selectedJob.createdDateTime)}
              </div>
              <div className="detail-row">
                <strong>Created By:</strong> {selectedJob.createdBy.userPrincipalName}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}