import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import MsalClient from './msalClient';
import logger from '../utils/logger';

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

class GraphPrintService {
  private axiosInstance: AxiosInstance;
  private msalClient: MsalClient;

  constructor() {
    this.msalClient = MsalClient.getInstance();
    this.axiosInstance = axios.create({
      baseURL: config.graph.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Graph API error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  private async getHeaders(userToken: string): Promise<Record<string, string>> {
    const accessToken = await this.msalClient.acquireTokenOnBehalfOf(userToken);
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async listPrinters(userToken: string): Promise<Printer[]> {
    try {
      logger.debug('Fetching printers from Graph API');
      
      const headers = await this.getHeaders(userToken);
      const response: AxiosResponse<{ value: Printer[] }> = await this.axiosInstance.get(
        '/print/printers',
        { headers }
      );

      logger.info(`Successfully retrieved ${response.data.value.length} printers`);
      return response.data.value;
    } catch (error) {
      logger.error('Failed to list printers', { error: error instanceof Error ? error.message : error });
      throw new Error('Failed to retrieve printers from Microsoft Graph');
    }
  }

  async createPrintJob(
    userToken: string,
    jobRequest: PrintJobRequest
  ): Promise<CreatePrintJobResponse> {
    try {
      logger.debug('Creating print job', { 
        displayName: jobRequest.displayName,
        printerId: jobRequest.printerId 
      });

      const headers = await this.getHeaders(userToken);
      const response: AxiosResponse<CreatePrintJobResponse> = await this.axiosInstance.post(
        `/print/printers/${jobRequest.printerId}/jobs`,
        {
          displayName: jobRequest.displayName,
          configuration: jobRequest.configuration || {},
        },
        { headers }
      );

      logger.info('Successfully created print job', { 
        jobId: response.data.id,
        printerId: jobRequest.printerId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create print job', { 
        error: error instanceof Error ? error.message : error,
        printerId: jobRequest.printerId 
      });
      throw new Error('Failed to create print job');
    }
  }

  async uploadDocument(
    userToken: string,
    uploadUrl: string,
    fileBuffer: Buffer,
    contentType: string = 'application/pdf'
  ): Promise<void> {
    try {
      logger.debug('Uploading document to print job');

      // For upload, we don't use Graph API headers, just the upload URL
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
        },
        timeout: 60000, // Longer timeout for file uploads
      });

      logger.info('Successfully uploaded document');
    } catch (error) {
      logger.error('Failed to upload document', { error: error instanceof Error ? error.message : error });
      throw new Error('Failed to upload document to print job');
    }
  }

  async getJobStatus(userToken: string, printerId: string, jobId: string): Promise<PrintJob> {
    try {
      logger.debug('Fetching print job status', { printerId, jobId });

      const headers = await this.getHeaders(userToken);
      const response: AxiosResponse<PrintJob> = await this.axiosInstance.get(
        `/print/printers/${printerId}/jobs/${jobId}`,
        { headers }
      );

      logger.debug('Successfully retrieved job status', { 
        jobId,
        status: response.data.status.state 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get job status', { 
        error: error instanceof Error ? error.message : error,
        printerId,
        jobId 
      });
      throw new Error('Failed to retrieve print job status');
    }
  }

  async listPrintJobs(userToken: string, printerId: string): Promise<PrintJob[]> {
    try {
      logger.debug('Fetching print jobs', { printerId });

      const headers = await this.getHeaders(userToken);
      const response: AxiosResponse<{ value: PrintJob[] }> = await this.axiosInstance.get(
        `/print/printers/${printerId}/jobs`,
        { headers }
      );

      logger.info(`Successfully retrieved ${response.data.value.length} print jobs for printer ${printerId}`);
      return response.data.value;
    } catch (error) {
      logger.error('Failed to list print jobs', { 
        error: error instanceof Error ? error.message : error,
        printerId 
      });
      throw new Error('Failed to retrieve print jobs');
    }
  }
}

export default GraphPrintService;