import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { config } from '../config';
import logger from '../utils/logger';

interface JwtPayload {
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  upn?: string;
  email?: string;
  groups?: string[];
  scp?: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

const client = jwksClient({
  jwksUri: `${config.azure.authorityUrl}/discovery/v2.0/keys`,
  requestHeaders: {},
  timeout: 30000,
});

function getKey(header: jwt.JwtHeader, callback: (err: any, key?: string) => void): void {
  if (!header.kid) {
    return callback(new Error('No kid found in token header'));
  }
  
  client.getSigningKey(header.kid, (err: any, key: any) => {
    if (err) {
      logger.error('Error getting signing key', { error: err.message });
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function validateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header');
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  req.token = token;

  jwt.verify(
    token,
    getKey,
    {
      audience: config.azure.audience,
      issuer: `${config.azure.authorityUrl}/v2.0`,
      algorithms: ['RS256'],
    },
    (err: any, decoded: any) => {
      if (err) {
        logger.error('Token validation failed', { error: err.message });
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      req.user = decoded as JwtPayload;
      logger.debug('Token validated successfully', { 
        sub: req.user.sub, 
        upn: req.user.upn || req.user.email 
      });
      
      next();
    }
  );
}

export function requireScope(requiredScope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const scopes = req.user.scp?.split(' ') || [];
    
    if (!scopes.includes(requiredScope)) {
      logger.warn('Insufficient scope', { 
        required: requiredScope, 
        actual: scopes,
        user: req.user.sub 
      });
      res.status(403).json({ error: 'Insufficient scope' });
      return;
    }

    next();
  };
}