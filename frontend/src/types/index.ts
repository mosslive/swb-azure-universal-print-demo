export interface Printer {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  isShared: boolean;
  status?: {
    state: string;
    description?: string;
  };
}

export interface PrintJob {
  id: string;
  displayName: string;
  status: {
    state: string;
    description?: string;
  };
  createdDateTime: string;
  createdBy: {
    userPrincipalName: string;
  };
}

export interface PrintJobRequest {
  displayName: string;
  printerId: string;
  configuration?: {
    pageRanges?: { start: number; end: number }[];
    quality?: 'low' | 'medium' | 'high';
    feedOrientation?: 'portrait' | 'landscape';
    orientation?: 'portrait' | 'landscape';
    copies?: number;
    dpi?: number;
    fitPdfToPage?: boolean;
    colorMode?: 'blackAndWhite' | 'grayscale' | 'color';
    duplex?: 'simplex' | 'duplex' | 'duplexShortEdge';
  };
}

export interface CreatePrintJobResponse {
  id: string;
  status: {
    state: string;
  };
  redirectedFrom?: {
    url: string;
  };
  uploadUrl?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PrinterListResponse {
  printers: Printer[];
}

export interface PrintJobListResponse {
  jobs: PrintJob[];
}

export interface PrintJobResponse {
  job: PrintJob;
}

export interface CreateJobResponse {
  printJob: CreatePrintJobResponse;
}