import { useState, useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { LoginComponent } from './auth/LoginComponent';
import { PrinterList } from './components/PrinterList';
import { UploadForm } from './components/UploadForm';
import { JobStatus } from './components/JobStatus';
import { useAuth } from './auth/AuthProvider';
import { apiClient } from './api/client';
import { Printer } from './types';
import './App.css';

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { getAccessToken } = useAuth();
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [createdJobId, setCreatedJobId] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'printers' | 'upload' | 'jobs'>('printers');

  useEffect(() => {
    if (isAuthenticated) {
      // Set the token provider for the API client
      apiClient.setTokenProvider(getAccessToken);
    }
  }, [isAuthenticated, getAccessToken]);

  const handlePrinterSelect = (printer: Printer) => {
    setSelectedPrinter(printer);
    setCurrentView('upload');
  };

  const handleJobCreated = (jobId: string) => {
    setCreatedJobId(jobId);
    setCurrentView('jobs');
  };

  const handleViewChange = (view: 'printers' | 'upload' | 'jobs') => {
    setCurrentView(view);
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <LoginComponent />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Azure Universal Print Demo</h1>
        <div className="header-actions">
          <LoginComponent />
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${currentView === 'printers' ? 'active' : ''}`}
          onClick={() => handleViewChange('printers')}
        >
          Printers
        </button>
        <button
          className={`nav-button ${currentView === 'upload' ? 'active' : ''}`}
          onClick={() => handleViewChange('upload')}
          disabled={!selectedPrinter}
        >
          Print Document
        </button>
        <button
          className={`nav-button ${currentView === 'jobs' ? 'active' : ''}`}
          onClick={() => handleViewChange('jobs')}
          disabled={!selectedPrinter}
        >
          Job Status
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'printers' && (
          <PrinterList
            onPrinterSelect={handlePrinterSelect}
            selectedPrinter={selectedPrinter || undefined}
          />
        )}

        {currentView === 'upload' && selectedPrinter && (
          <UploadForm
            selectedPrinter={selectedPrinter}
            onJobCreated={handleJobCreated}
          />
        )}

        {currentView === 'jobs' && selectedPrinter && (
          <JobStatus
            selectedPrinter={selectedPrinter}
            createdJobId={createdJobId}
          />
        )}

        {!selectedPrinter && currentView !== 'printers' && (
          <div className="no-printer-selected">
            <h3>No Printer Selected</h3>
            <p>Please select a printer first to continue.</p>
            <button onClick={() => handleViewChange('printers')}>
              Go to Printers
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Azure Universal Print Demo - Secure printing with Microsoft Graph APIs</p>
      </footer>
    </div>
  );
}

export default App;