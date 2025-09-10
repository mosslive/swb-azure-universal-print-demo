import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { config } from '../config';
import logger from '../utils/logger';

class MsalClient {
  private static instance: MsalClient;
  private clientApp: ConfidentialClientApplication;

  private constructor() {
    const msalConfig: Configuration = {
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: config.azure.authorityUrl,
      },
    };

    this.clientApp = new ConfidentialClientApplication(msalConfig);
    logger.info('MSAL client initialized');
  }

  public static getInstance(): MsalClient {
    if (!MsalClient.instance) {
      MsalClient.instance = new MsalClient();
    }
    return MsalClient.instance;
  }

  public async acquireTokenOnBehalfOf(userToken: string): Promise<string> {
    try {
      const oboRequest = {
        oboAssertion: userToken,
        scopes: config.graph.scopes,
      };

      logger.debug('Attempting OBO token acquisition', { scopes: config.graph.scopes });

      const response = await this.clientApp.acquireTokenOnBehalfOf(oboRequest);
      
      if (!response || !response.accessToken) {
        throw new Error('Failed to acquire OBO token - no access token received');
      }

      logger.info('Successfully acquired OBO token');
      return response.accessToken;
    } catch (error) {
      logger.error('Failed to acquire OBO token', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}

export default MsalClient;