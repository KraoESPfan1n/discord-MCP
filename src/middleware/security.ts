import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

/**
 * Advanced rate limiting with different limits for different endpoints
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req) => env.NODE_ENV === 'development' && req.ip === '127.0.0.1',
    // Custom key generator to include user agent
    keyGenerator: (req) => `${req.ip}-${req.get('User-Agent') || 'unknown'}`,
  });
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (allowedIPs.includes(clientIP) || allowedIPs.includes('*')) {
      next();
    } else {
      logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
      res.status(403).json({ error: 'Access denied from this IP address' });
    }
  };
};

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      logger.warn(`Request too large: ${contentLength} bytes from ${req.ip}`);
      res.status(413).json({ error: 'Request entity too large' });
      return;
    }
    
    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add custom security header
  res.setHeader('X-Discord-MCP-Version', '1.0.0');
  
  next();
};

/**
 * Request logging middleware with sensitive data filtering
 */
export const secureLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Filter sensitive data from logs
  const sanitizedBody = { ...req.body };
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth'];
  
  Object.keys(sanitizedBody).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitizedBody[key] = '[REDACTED]';
    }
  });
  
  const logData = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: sanitizedBody,
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'x-webhook-signature': req.get('X-Webhook-Signature') ? '[PRESENT]' : '[MISSING]'
    }
  };
  
  logger.info('Incoming request', logData);
  
  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
};

/**
 * API key validation middleware
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key') || req.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    logger.warn(`API request without key from ${req.ip}`);
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (apiKey !== env.API_KEY) {
    logger.warn(`Invalid API key from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  return next();
};

/**
 * Request frequency limiting per endpoint
 */
export const endpointRateLimit = (endpoint: string, windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => `${req.ip}-${endpoint}`,
    message: {
      error: `Too many requests to ${endpoint}`,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
