import GraphPrintService, { PrintJobRequest } from '../services/graphPrintService';
import MsalClient from '../services/msalClient';
import axios from 'axios';

// Mock dependencies
jest.mock('../services/msalClient');
jest.mock('axios');
jest.mock('../utils/logger');
jest.mock('../config', () => ({
  config: {
    graph: {
      baseUrl: 'https://graph.microsoft.com/v1.0',
      scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
    },
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GraphPrintService', () => {
  let graphPrintService: GraphPrintService;
  let mockMsalInstance: jest.Mocked<MsalClient>;

  const mockToken = 'mock-user-token';
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock MSAL client instance
    mockMsalInstance = {
      acquireTokenOnBehalfOf: jest.fn().mockResolvedValue(mockAccessToken),
    } as any;
    
    // Mock the getInstance static method
    jest.spyOn(MsalClient, 'getInstance').mockReturnValue(mockMsalInstance);

    // Mock axios.create
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance as any);
    mockedAxios.put = jest.fn();

    graphPrintService = new GraphPrintService();
  });

  describe('listPrinters', () => {
    it('should successfully retrieve printers', async () => {
      const mockPrinters = [
        {
          id: 'printer-1',
          name: 'Office Printer 1',
          manufacturer: 'HP',
          model: 'LaserJet Pro',
          isShared: true,
        },
        {
          id: 'printer-2',
          name: 'Office Printer 2',
          manufacturer: 'Canon',
          model: 'PIXMA',
          isShared: false,
        },
      ];

      const axiosInstance = (graphPrintService as any).axiosInstance;
      axiosInstance.get.mockResolvedValue({ data: { value: mockPrinters } });

      const result = await graphPrintService.listPrinters(mockToken);

      expect(mockMsalInstance.acquireTokenOnBehalfOf).toHaveBeenCalledWith(mockToken);
      expect(axiosInstance.get).toHaveBeenCalledWith('/print/printers', {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockPrinters);
    });

    it('should handle errors when retrieving printers', async () => {
      const axiosInstance = (graphPrintService as any).axiosInstance;
      axiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(graphPrintService.listPrinters(mockToken)).rejects.toThrow(
        'Failed to retrieve printers from Microsoft Graph'
      );
    });
  });

  describe('createPrintJob', () => {
    it('should successfully create a print job', async () => {
      const jobRequest: PrintJobRequest = {
        displayName: 'Test Print Job',
        printerId: 'printer-1',
        configuration: {
          copies: 1,
          colorMode: 'color',
        },
      };

      const mockPrintJob = {
        id: 'job-1',
        status: { state: 'processing' },
        uploadUrl: 'https://upload.example.com/job-1',
      };

      const axiosInstance = (graphPrintService as any).axiosInstance;
      axiosInstance.post.mockResolvedValue({ data: mockPrintJob });

      const result = await graphPrintService.createPrintJob(mockToken, jobRequest);

      expect(mockMsalInstance.acquireTokenOnBehalfOf).toHaveBeenCalledWith(mockToken);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/print/printers/${jobRequest.printerId}/jobs`,
        {
          displayName: jobRequest.displayName,
          configuration: jobRequest.configuration,
        },
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockPrintJob);
    });

    it('should handle errors when creating print job', async () => {
      const jobRequest: PrintJobRequest = {
        displayName: 'Test Print Job',
        printerId: 'printer-1',
      };

      const axiosInstance = (graphPrintService as any).axiosInstance;
      axiosInstance.post.mockRejectedValue(new Error('Printer not found'));

      await expect(graphPrintService.createPrintJob(mockToken, jobRequest)).rejects.toThrow(
        'Failed to create print job'
      );
    });
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document', async () => {
      const uploadUrl = 'https://upload.example.com/job-1';
      const fileBuffer = Buffer.from('test file content');
      const contentType = 'application/pdf';

      mockedAxios.put.mockResolvedValue({});

      await graphPrintService.uploadDocument(mockToken, uploadUrl, fileBuffer, contentType);

      expect(mockedAxios.put).toHaveBeenCalledWith(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
        },
        timeout: 60000,
      });
    });

    it('should handle errors when uploading document', async () => {
      const uploadUrl = 'https://upload.example.com/job-1';
      const fileBuffer = Buffer.from('test file content');

      mockedAxios.put.mockRejectedValue(new Error('Upload failed'));

      await expect(
        graphPrintService.uploadDocument(mockToken, uploadUrl, fileBuffer)
      ).rejects.toThrow('Failed to upload document to print job');
    });
  });

  describe('getJobStatus', () => {
    it('should successfully retrieve job status', async () => {
      const printerId = 'printer-1';
      const jobId = 'job-1';
      const mockJobStatus = {
        id: jobId,
        displayName: 'Test Job',
        status: { state: 'completed' },
        createdDateTime: '2024-01-01T00:00:00Z',
        createdBy: { userPrincipalName: 'user@example.com' },
      };

      const axiosInstance = (graphPrintService as any).axiosInstance;
      axiosInstance.get.mockResolvedValue({ data: mockJobStatus });

      const result = await graphPrintService.getJobStatus(mockToken, printerId, jobId);

      expect(axiosInstance.get).toHaveBeenCalledWith(
        `/print/printers/${printerId}/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockJobStatus);
    });
  });
});