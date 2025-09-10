import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';

export function LoginComponent() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error('Login failed:', e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error('Logout failed:', e);
    });
  };

  if (isAuthenticated) {
    return (
      <div className="auth-container">
        <button onClick={handleLogout} className="auth-button logout">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="login-form">
        <h2>Azure Universal Print Demo</h2>
        <p>Please sign in to access the Universal Print services.</p>
        <button onClick={handleLogin} className="auth-button login">
          Sign In with Microsoft
        </button>
      </div>
    </div>
  );
}