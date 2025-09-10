declare module 'jwks-client' {
  interface JwksClient {
    getSigningKey(kid: string, callback: (err: any, key?: any) => void): void;
  }

  interface JwksClientOptions {
    jwksUri: string;
    requestHeaders?: Record<string, string>;
    timeout?: number;
  }

  function jwksClient(options: JwksClientOptions): JwksClient;
  export = jwksClient;
}