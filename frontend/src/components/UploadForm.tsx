import { useState } from 'react';
import { Printer, PrintJobRequest } from '../types';
import { apiClient } from '../api/client';

interface UploadFormProps {
  selectedPrinter: Printer;
  onJobCreated: (jobId: string) => void;
}

export function UploadForm({ selectedPrinter, onJobCreated }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobName, setJobName] = useState('');
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<'blackAndWhite' | 'grayscale' | 'color'>('color');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [duplex, setDuplex] = useState<'simplex' | 'duplex' | 'duplexShortEdge'>('simplex');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!jobName) {
        setJobName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove file extension
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file || !jobName.trim()) {
      setError('Please select a file and enter a job name');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const jobRequest: PrintJobRequest = {
        displayName: jobName.trim(),
        printerId: selectedPrinter.id,
        configuration: {
          copies,
          colorMode,
          orientation,
          duplex,
          quality: 'medium',
          fitPdfToPage: true,
        },
      };

      const result = await apiClient.createAndUploadPrintJob(jobRequest, file);
      onJobCreated(result.id);
      
      // Reset form
      setFile(null);
      setJobName('');
      setCopies(1);
      setColorMode('color');
      setOrientation('portrait');
      setDuplex('simplex');
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError('Failed to create print job. Please try again.');
      console.error('Error creating print job:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-form">
      <h3>Print Document</h3>
      <div className="selected-printer-info">
        <h4>Selected Printer: {selectedPrinter.name}</h4>
        <p>
          {selectedPrinter.manufacturer} {selectedPrinter.model}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file-input">Select Document:</label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileChange}
            required
          />
          {file && (
            <div className="file-info">
              <strong>Selected:</strong> {file.name} ({formatFileSize(file.size)})
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="job-name">Job Name:</label>
          <input
            id="job-name"
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="Enter a name for this print job"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="copies">Copies:</label>
            <input
              id="copies"
              type="number"
              min="1"
              max="100"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value, 10))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="color-mode">Color Mode:</label>
            <select
              id="color-mode"
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as typeof colorMode)}
            >
              <option value="color">Color</option>
              <option value="grayscale">Grayscale</option>
              <option value="blackAndWhite">Black & White</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="orientation">Orientation:</label>
            <select
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as typeof orientation)}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duplex">Print Sides:</label>
            <select
              id="duplex"
              value={duplex}
              onChange={(e) => setDuplex(e.target.value as typeof duplex)}
            >
              <option value="simplex">Single-sided</option>
              <option value="duplex">Double-sided (Long Edge)</option>
              <option value="duplexShortEdge">Double-sided (Short Edge)</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Creating Print Job...' : 'Print Document'}
        </button>
      </form>
    </div>
  );
}