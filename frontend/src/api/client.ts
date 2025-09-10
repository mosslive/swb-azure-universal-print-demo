import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { backendConfig } from '../auth/authConfig';
import {
  Printer,
  PrintJob,
  PrintJobRequest,
  PrinterListResponse,
  PrintJobListResponse,
  PrintJobResponse,
  CreateJobResponse,
} from '../types';

class ApiClient {
  private axiosInstance: AxiosInstance;
  private getAccessToken: (() => Promise<string | null>) | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: backendConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach access token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (this.getAccessToken) {
          const token = await this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  setTokenProvider(getAccessToken: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
  }

  async listPrinters(): Promise<Printer[]> {
    const response: AxiosResponse<PrinterListResponse> = await this.axiosInstance.get(
      '/api/printers'
    );
    return response.data.printers;
  }

  async listPrintJobs(printerId: string): Promise<PrintJob[]> {
    const response: AxiosResponse<PrintJobListResponse> = await this.axiosInstance.get(
      `/api/printers/${printerId}/jobs`
    );
    return response.data.jobs;
  }

  async createPrintJob(jobRequest: PrintJobRequest): Promise<any> {
    const response: AxiosResponse<CreateJobResponse> = await this.axiosInstance.post(
      '/api/print-jobs',
      jobRequest
    );
    return response.data.printJob;
  }

  async createAndUploadPrintJob(
    jobRequest: PrintJobRequest,
    file: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('displayName', jobRequest.displayName);
    formData.append('printerId', jobRequest.printerId);
    
    if (jobRequest.configuration) {
      formData.append('configuration', JSON.stringify(jobRequest.configuration));
    }

    const response: AxiosResponse<CreateJobResponse> = await this.axiosInstance.post(
      '/api/print-jobs/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.printJob;
  }

  async uploadDocument(jobId: string, uploadUrl: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('uploadUrl', uploadUrl);

    await this.axiosInstance.put(`/api/print-jobs/${jobId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getJobStatus(printerId: string, jobId: string): Promise<PrintJob> {
    const response: AxiosResponse<PrintJobResponse> = await this.axiosInstance.get(
      `/api/print-jobs/${printerId}/${jobId}`
    );
    return response.data.job;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;