import { useState, useEffect } from 'react';
import { Printer } from '../types';
import { apiClient } from '../api/client';

interface PrinterListProps {
  onPrinterSelect: (printer: Printer) => void;
  selectedPrinter?: Printer;
}

export function PrinterList({ onPrinterSelect, selectedPrinter }: PrinterListProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);
      const printerList = await apiClient.listPrinters();
      setPrinters(printerList);
    } catch (err) {
      setError('Failed to load printers. Please try again.');
      console.error('Error loading printers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: { state: string }) => {
    switch (status?.state?.toLowerCase()) {
      case 'ready':
      case 'idle':
        return 'green';
      case 'busy':
      case 'processing':
        return 'orange';
      case 'error':
      case 'offline':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="printer-list">
        <h3>Available Printers</h3>
        <div className="loading">Loading printers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="printer-list">
        <h3>Available Printers</h3>
        <div className="error">
          {error}
          <button onClick={loadPrinters} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="printer-list">
      <h3>Available Printers</h3>
      {printers.length === 0 ? (
        <div className="no-printers">
          No printers found. Please ensure you have access to Universal Print printers.
        </div>
      ) : (
        <div className="printers-grid">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className={`printer-card ${selectedPrinter?.id === printer.id ? 'selected' : ''}`}
              onClick={() => onPrinterSelect(printer)}
            >
              <div className="printer-header">
                <h4>{printer.name}</h4>
                <div
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(printer.status) }}
                />
              </div>
              <div className="printer-details">
                <p>
                  <strong>Manufacturer:</strong> {printer.manufacturer}
                </p>
                <p>
                  <strong>Model:</strong> {printer.model}
                </p>
                <p>
                  <strong>Shared:</strong> {printer.isShared ? 'Yes' : 'No'}
                </p>
                {printer.status && (
                  <p>
                    <strong>Status:</strong> {printer.status.state}
                    {printer.status.description && ` - ${printer.status.description}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}