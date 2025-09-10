export interface AppConfig {
  port: number;
  nodeEnv: string;
  azure: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    audience: string;
    authorityUrl: string;
  };
  cors: {
    origin: string[];
  };
  graph: {
    baseUrl: string;
    scopes: string[];
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

export const config: AppConfig = {
  port: parseInt(getEnvVar('PORT', '3001'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  azure: {
    clientId: getEnvVar('AZURE_CLIENT_ID'),
    clientSecret: getEnvVar('AZURE_CLIENT_SECRET'),
    tenantId: getEnvVar('AZURE_TENANT_ID'),
    audience: getEnvVar('AZURE_AUDIENCE'),
    authorityUrl: `https://login.microsoftonline.com/${getEnvVar('AZURE_TENANT_ID')}`,
  },
  cors: {
    origin: getEnvVar('CORS_ORIGINS', 'http://localhost:3000').split(','),
  },
  graph: {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    scopes: ['https://graph.microsoft.com/Print.ReadWrite.All'],
  },
};