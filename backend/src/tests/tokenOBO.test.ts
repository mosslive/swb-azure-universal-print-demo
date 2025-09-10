import MsalClient from '../services/msalClient';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';

// Mock dependencies
jest.mock('@azure/msal-node');
jest.mock('../config', () => ({
  config: {
    azure: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorityUrl: 'https://login.microsoftonline.com/test-tenant',
    },
    graph: {
      scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
    },
  },
}));
jest.mock('../utils/logger');

const MockedConfidentialClientApplication = ConfidentialClientApplication as jest.MockedClass<
  typeof ConfidentialClientApplication
>;

describe('MsalClient', () => {
  let mockClientApp: jest.Mocked<ConfidentialClientApplication>;
  const mockUserToken = 'user-access-token';
  const mockOboToken = 'obo-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClientApp = {
      acquireTokenOnBehalfOf: jest.fn(),
    } as any;
    
    MockedConfidentialClientApplication.mockImplementation(() => mockClientApp);
  });

  afterEach(() => {
    // Reset singleton instance for clean test isolation
    (MsalClient as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MsalClient.getInstance();
      const instance2 = MsalClient.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(MockedConfidentialClientApplication).toHaveBeenCalledTimes(1);
    });

    it('should initialize with correct configuration', () => {
      MsalClient.getInstance();
      
      expect(MockedConfidentialClientApplication).toHaveBeenCalledWith({
        auth: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          authority: 'https://login.microsoftonline.com/test-tenant',
        },
      });
    });
  });

  describe('acquireTokenOnBehalfOf', () => {
    it('should successfully acquire OBO token', async () => {
      const mockResponse: AuthenticationResult = {
        accessToken: mockOboToken,
        account: null,
        scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
        tokenType: 'Bearer',
        expiresOn: new Date(),
        extExpiresOn: new Date(),
        authority: 'https://login.microsoftonline.com/test-tenant',
        uniqueId: 'unique-id',
        tenantId: 'test-tenant',
        idToken: '',
        idTokenClaims: {},
        fromCache: false,
        correlationId: 'correlation-id',
      };

      mockClientApp.acquireTokenOnBehalfOf.mockResolvedValue(mockResponse);

      const msalClient = MsalClient.getInstance();
      const result = await msalClient.acquireTokenOnBehalfOf(mockUserToken);

      expect(mockClientApp.acquireTokenOnBehalfOf).toHaveBeenCalledWith({
        oboAssertion: mockUserToken,
        scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
      });
      expect(result).toBe(mockOboToken);
    });

    it('should handle case when no access token is returned', async () => {
      const mockResponse: AuthenticationResult = {
        accessToken: null as any,
        account: null,
        scopes: [],
        tokenType: 'Bearer',
        expiresOn: new Date(),
        extExpiresOn: new Date(),
        authority: 'https://login.microsoftonline.com/test-tenant',
        uniqueId: 'unique-id',
        tenantId: 'test-tenant',
        idToken: '',
        idTokenClaims: {},
        fromCache: false,
        correlationId: 'correlation-id',
      };

      mockClientApp.acquireTokenOnBehalfOf.mockResolvedValue(mockResponse);

      const msalClient = MsalClient.getInstance();
      
      await expect(msalClient.acquireTokenOnBehalfOf(mockUserToken)).rejects.toThrow(
        'Failed to acquire OBO token - no access token received'
      );
    });

    it('should handle case when null response is returned', async () => {
      mockClientApp.acquireTokenOnBehalfOf.mockResolvedValue(null);

      const msalClient = MsalClient.getInstance();
      
      await expect(msalClient.acquireTokenOnBehalfOf(mockUserToken)).rejects.toThrow(
        'Failed to acquire OBO token - no access token received'
      );
    });

    it('should handle MSAL errors', async () => {
      const msalError = new Error('MSAL authentication failed');
      mockClientApp.acquireTokenOnBehalfOf.mockRejectedValue(msalError);

      const msalClient = MsalClient.getInstance();
      
      await expect(msalClient.acquireTokenOnBehalfOf(mockUserToken)).rejects.toThrow(msalError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockClientApp.acquireTokenOnBehalfOf.mockRejectedValue(networkError);

      const msalClient = MsalClient.getInstance();
      
      await expect(msalClient.acquireTokenOnBehalfOf(mockUserToken)).rejects.toThrow(networkError);
    });
  });

  describe('error scenarios', () => {
    it('should handle configuration errors', () => {
      // Mock config to throw error for missing env var
      jest.doMock('../config', () => ({
        config: {
          azure: {
            clientId: undefined,
            clientSecret: 'test-secret',
            authorityUrl: 'https://login.microsoftonline.com/test-tenant',
          },
          graph: {
            scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
          },
        },
      }));

      expect(() => {
        new (require('../services/msalClient').default)();
      }).not.toThrow(); // Constructor should not throw, but MSAL will handle invalid config
    });
  });
});