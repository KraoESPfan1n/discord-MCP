import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DiscordService } from './services/discord.service';
import { env } from './config/environment';
import { logger } from './utils/logger';
import { 
  createRateLimit, 
  ipWhitelist, 
  validateRequestSize, 
  securityHeaders, 
  secureLogging,
  validateApiKey,
  endpointRateLimit
} from './middleware/security';
import { 
  validateSecurityRequirements, 
  getSecurityConfig, 
  securityHeaders as configSecurityHeaders,
  adminIPWhitelist,
  endpointRateLimits
} from './config/security.config';
import { maskSensitiveData } from './utils/encryption';

// Import routes
import webhookRoutes from './routes/webhook.routes';
import channelRoutes from './routes/channel.routes';
import roleRoutes from './routes/role.routes';
import serverRoutes from './routes/server.routes';

// Validate security requirements before starting
const securityValidation = validateSecurityRequirements();
if (!securityValidation.valid) {
  logger.error('❌ Security validation failed:');
  securityValidation.errors.forEach(error => logger.error(`  - ${error}`));
  process.exit(1);
}

const securityConfig = getSecurityConfig();
logger.info(`🔒 Security level: ${env.NODE_ENV}`, { config: maskSensitiveData(securityConfig) });

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// Custom security headers
app.use(securityHeaders);

// CORS configuration with security restrictions
if (securityConfig.enableCORS) {
  app.use(cors({
    origin: securityConfig.allowedOrigins.length > 0 ? securityConfig.allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature', 'X-API-Key'],
    maxAge: 86400 // 24 hours
  }));
} else {
  logger.warn('⚠️  CORS is disabled - only same-origin requests allowed');
}

// Request size validation
app.use(validateRequestSize(securityConfig.requestSizeLimit));

// Enhanced rate limiting
const globalLimiter = createRateLimit(
  securityConfig.rateLimitWindow,
  securityConfig.rateLimitMax,
  'Too many requests from this IP, please try again later.'
);
app.use(globalLimiter);

// Secure logging middleware
app.use(secureLogging);

// Body parsing middleware
app.use(express.json({ 
  limit: env.MAX_WEBHOOK_PAYLOAD_SIZE,
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (with rate limiting)
app.get('/health', 
  endpointRateLimit('/health', endpointRateLimits['/health'].windowMs, endpointRateLimits['/health'].max),
  (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      security: {
        level: env.NODE_ENV,
        rateLimiting: true,
        cors: securityConfig.enableCORS,
        apiKeyRequired: securityConfig.requireApiKey
      }
    });
  }
);

// API status endpoint (with rate limiting and API key validation)
app.get('/api/status', 
  endpointRateLimit('/api/status', endpointRateLimits['/api/status'].windowMs, endpointRateLimits['/api/status'].max),
  securityConfig.requireApiKey ? validateApiKey : (req, res, next) => next(),
  (req, res) => {
    res.json({
      success: true,
      message: 'Discord MCP Server is running',
      features: {
        webhooks: env.ENABLE_WEBHOOK_SYSTEM,
        channels: env.ENABLE_CHANNEL_MANAGEMENT,
        roles: env.ENABLE_ROLE_MANAGEMENT,
        serverConfig: env.ENABLE_SERVER_CONFIG
      },
      security: {
        level: env.NODE_ENV,
        rateLimiting: true,
        cors: securityConfig.enableCORS,
        apiKeyRequired: securityConfig.requireApiKey
      },
      timestamp: new Date().toISOString()
    });
  }
);

// Admin endpoints with IP whitelist
app.use('/api/admin', ipWhitelist(adminIPWhitelist));

// API routes with enhanced security
app.use('/api/webhook', 
  endpointRateLimit('/api/webhook/send', endpointRateLimits['/api/webhook/send'].windowMs, endpointRateLimits['/api/webhook/send'].max),
  webhookRoutes
);

app.use('/api/channels', 
  endpointRateLimit('/api/channels/create', endpointRateLimits['/api/channels/create'].windowMs, endpointRateLimits['/api/channels/create'].max),
  channelRoutes
);

app.use('/api/roles', 
  endpointRateLimit('/api/roles/create', endpointRateLimits['/api/roles/create'].windowMs, endpointRateLimits['/api/roles/create'].max),
  roleRoutes
);

app.use('/api/server', 
  endpointRateLimit('/api/server/setup', endpointRateLimits['/api/server/setup'].windowMs, endpointRateLimits['/api/server/setup'].max),
  serverRoutes
);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Discord MCP Server',
    version: '1.0.0',
    documentation: '/api/status',
    endpoints: {
      health: '/health',
      status: '/api/status',
      webhooks: '/api/webhook',
      channels: '/api/channels',
      roles: '/api/roles',
      server: '/api/server'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close Discord connection
    await discordService.logout();
    
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Initialize Discord service
const discordService = new DiscordService();

// Start server
const server = app.listen(env.PORT, env.HOST, async () => {
  logger.info(`Discord MCP Server listening on ${env.HOST}:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Features enabled:`, {
    webhooks: env.ENABLE_WEBHOOK_SYSTEM,
    channels: env.ENABLE_CHANNEL_MANAGEMENT,
    roles: env.ENABLE_ROLE_MANAGEMENT,
    serverConfig: env.ENABLE_SERVER_CONFIG
  });

  try {
    // Connect to Discord
    await discordService.login();
    logger.info('Discord bot connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Discord:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
