import { createContext, useContext, ReactNode } from 'react';
import { MsalProvider, useIsAuthenticated, useAccount, useMsal } from '@azure/msal-react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig } from './authConfig';

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

interface AuthContextType {
  isAuthenticated: boolean;
  account: AccountInfo | null;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProviderContent({ children }: AuthProviderProps) {
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount();
  const { instance } = useMsal();

  const getAccessToken = async (): Promise<string | null> => {
    if (!account) {
      return null;
    }

    try {
      const silentRequest = {
        scopes: [import.meta.env.VITE_AZURE_SCOPE || 'api://your-custom-api/access_as_user'],
        account: account,
      };

      const response = await instance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed, falling back to popup', error);
      
      try {
        const response = await instance.acquireTokenPopup({
          scopes: [import.meta.env.VITE_AZURE_SCOPE || 'api://your-custom-api/access_as_user'],
          account: account,
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Token acquisition failed:', popupError);
        return null;
      }
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    account,
    getAccessToken,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderContent>{children}</AuthProviderContent>
    </MsalProvider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}