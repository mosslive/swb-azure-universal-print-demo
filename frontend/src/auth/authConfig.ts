import { Configuration, PopupRequest } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'your-tenant-id'}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

// Add scopes here for ID token to be used at Microsoft Graph API endpoints.
export const loginRequest: PopupRequest = {
  scopes: [import.meta.env.VITE_AZURE_SCOPE || 'api://your-custom-api/access_as_user'],
  prompt: 'select_account',
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

export const backendConfig = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
};