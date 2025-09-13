import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DiscordService } from './services/discord.service';
import { env } from './config/environment';
import { logger } from './utils/logger';
import { securityHeaders, validateRequestSize, createRateLimit, secureLogging, endpointRateLimit } from './middleware/security';
import { getSecurityConfig, validateSecurityRequirements, endpointRateLimits } from './config/security.config';
import { maskSensitiveData } from './utils/encryption';

// Import routes
import webhookRoutes from './routes/webhook.routes';
import channelRoutes from './routes/channel.routes';
import roleRoutes from './routes/role.routes';
import serverRoutes from './routes/server.routes';
import componentsRoutes from './routes/components.routes';

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
const globalLimiter = createRateLimit(securityConfig.rateLimitWindow, securityConfig.rateLimitMax, 'Too many requests from this IP, please try again later.');
app.use(globalLimiter);

// Secure logging middleware
app.use(secureLogging);

// Body parsing middleware
app.use(express.json({
  limit: env.MAX_WEBHOOK_PAYLOAD_SIZE,
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (with rate limiting)
app.get('/health', endpointRateLimit('/health', endpointRateLimits['/health'].windowMs, endpointRateLimits['/health'].max), (req, res) => {
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
});

// API status endpoint
app.get('/api/status', endpointRateLimit('/api/status', endpointRateLimits['/api/status'].windowMs, endpointRateLimits['/api/status'].max), (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      discord: 'connected',
      webhook: env.ENABLE_WEBHOOK_SYSTEM ? 'enabled' : 'disabled',
      channels: env.ENABLE_CHANNEL_MANAGEMENT ? 'enabled' : 'disabled',
      roles: env.ENABLE_ROLE_MANAGEMENT ? 'enabled' : 'disabled',
      componentsV2: env.ENABLE_COMPONENTS_V2 ? 'enabled' : 'disabled'
    },
    security: {
      level: env.NODE_ENV,
      rateLimiting: true,
      cors: securityConfig.enableCORS
    }
  });
});

// Mount API routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/components', componentsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Initialize Discord service
const discordService = new DiscordService();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Disconnect from Discord
    await discordService.logout();
    logger.info('✅ Discord service disconnected');
    
    // Close server
    server.close(() => {
      logger.info('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(env.PORT, env.HOST, async () => {
  logger.info(`🚀 Discord MCP Server started on ${env.HOST}:${env.PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔒 Security level: ${env.NODE_ENV}`);
  logger.info(`📝 Log level: ${env.LOG_LEVEL}`);
  
  // Connect to Discord (optional for testing)
  try {
    await discordService.login();
    logger.info('✅ Connected to Discord');
  } catch (error) {
    logger.warn('⚠️  Failed to connect to Discord (server will continue without Discord functionality):', error instanceof Error ? error.message : String(error));
    // Don't exit the process - allow server to run without Discord for testing
  }
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
