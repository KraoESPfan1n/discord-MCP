import { env } from './environment';

/**
 * Security configuration and validation
 */

// Security levels
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

// Current security level based on environment
export const getSecurityLevel = (): SecurityLevel => {
  switch (env.NODE_ENV) {
    case 'development':
      return SecurityLevel.MEDIUM;
    case 'test':
      return SecurityLevel.LOW;
    case 'production':
      return SecurityLevel.MAXIMUM;
    default:
      return SecurityLevel.HIGH;
  }
};

// Security configuration based on level
export const securityConfig = {
  [SecurityLevel.LOW]: {
    rateLimitWindow: 60000, // 1 minute
    rateLimitMax: 1000,
    requestSizeLimit: 10485760, // 10MB
    tokenExpiration: 1440, // 24 hours
    requireApiKey: false,
    requireWebhookSignature: false,
    logSensitiveData: true,
    enableCORS: true,
    allowedOrigins: ['*']
  },
  [SecurityLevel.MEDIUM]: {
    rateLimitWindow: 300000, // 5 minutes
    rateLimitMax: 500,
    requestSizeLimit: 5242880, // 5MB
    tokenExpiration: 720, // 12 hours
    requireApiKey: true,
    requireWebhookSignature: true,
    logSensitiveData: false,
    enableCORS: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:8080']
  },
  [SecurityLevel.HIGH]: {
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMax: 100,
    requestSizeLimit: 2097152, // 2MB
    tokenExpiration: 360, // 6 hours
    requireApiKey: true,
    requireWebhookSignature: true,
    logSensitiveData: false,
    enableCORS: true,
    allowedOrigins: ['https://yourdomain.com']
  },
  [SecurityLevel.MAXIMUM]: {
    rateLimitWindow: 1800000, // 30 minutes
    rateLimitMax: 50,
    requestSizeLimit: 1048576, // 1MB
    tokenExpiration: 180, // 3 hours
    requireApiKey: true,
    requireWebhookSignature: true,
    logSensitiveData: false,
    enableCORS: false,
    allowedOrigins: []
  }
};

// Get current security configuration
export const getSecurityConfig = () => {
  const level = getSecurityLevel();
  return securityConfig[level];
};

// Validate security requirements
export const validateSecurityRequirements = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getSecurityConfig();
  
  // Check if API key is required and provided
  if (config.requireApiKey && (!env.API_KEY || env.API_KEY.length < 16)) {
    errors.push('API key is required and must be at least 16 characters');
  }
  
  // Check if webhook secret is required and provided
  if (config.requireWebhookSignature && (!env.WEBHOOK_SECRET || env.WEBHOOK_SECRET.length < 32)) {
    errors.push('Webhook secret is required and must be at least 32 characters');
  }
  
  // Check encryption key
  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 32) {
    errors.push('Encryption key is required and must be exactly 32 characters');
  }
  
  // Check Discord credentials
  if (!env.DISCORD_TOKEN) {
    errors.push('Discord token is required');
  }
  
  // Note: DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are optional for MCP server
  // They are only needed for OAuth2 flows, which this MCP server doesn't use
  
  // Production-specific checks
  if (env.NODE_ENV === 'production') {
    if (env.HOST === '0.0.0.0') {
      errors.push('In production, avoid binding to 0.0.0.0 for security');
    }
    
    if (env.LOG_LEVEL === 'debug') {
      errors.push('Debug logging should be disabled in production');
    }
    
    if (config.allowedOrigins.length === 0) {
      errors.push('CORS origins must be specified in production');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Strict-Transport-Security': env.NODE_ENV === 'production' ? 'max-age=31536000; includeSubDomains' : undefined,
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';"
};

// IP whitelist for admin endpoints
export const adminIPWhitelist = [
  '127.0.0.1',
  '::1',
  // Add your trusted IP addresses here
  // '192.168.1.100',
  // '10.0.0.50'
];

// Endpoint-specific rate limits
export const endpointRateLimits = {
  '/api/webhook/send': { windowMs: 60000, max: 10 }, // 10 requests per minute
  '/api/channels/create': { windowMs: 300000, max: 5 }, // 5 requests per 5 minutes
  '/api/roles/create': { windowMs: 300000, max: 5 }, // 5 requests per 5 minutes
  '/api/server/setup': { windowMs: 3600000, max: 1 }, // 1 request per hour
  '/health': { windowMs: 60000, max: 100 }, // 100 health checks per minute
  '/api/status': { windowMs: 60000, max: 50 } // 50 status checks per minute
};
