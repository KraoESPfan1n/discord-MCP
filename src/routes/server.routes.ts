import { Router, Request, Response } from 'express';
import { DiscordService } from '../services/discord.service';
import { verifyWebhookSignature, RateLimiter } from '../utils/security';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();
const rateLimiter = new RateLimiter();

// Middleware for webhook signature verification
const verifySignature = (req: Request, res: Response, next: any) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  if (!verifyWebhookSignature(payload, signature, env.WEBHOOK_SECRET)) {
    logger.warn('Invalid webhook signature received');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  return next();
};

// Middleware for rate limiting
const rateLimitMiddleware = (req: Request, res: Response, next: any) => {
  const clientId = req.ip || 'unknown';
  
  if (!rateLimiter.isAllowed(clientId)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }

  res.set('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(clientId).toString());
  return next();
};

// GET /server/info/:guildId
router.get('/info/:guildId', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_SERVER_CONFIG) {
      return res.status(403).json({ error: 'Server configuration is disabled' });
    }

    const { guildId } = req.params;

    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }

    const discordService = new DiscordService();
    const guildInfo = await discordService.getGuildInfo(guildId);

    return res.json({ 
      success: true, 
      guild: guildInfo
    });

  } catch (error) {
    logger.error('Guild info fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch guild info' });
  }
});

// POST /server/setup
router.post('/setup', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_SERVER_CONFIG) {
      return res.status(403).json({ error: 'Server configuration is disabled' });
    }

    const { guildId, config } = req.body;

    if (!guildId || !config) {
      return res.status(400).json({ error: 'guildId and config are required' });
    }

    const discordService = new DiscordService();
    const results = [];

    // Create default roles if specified
    if (config.roles && Array.isArray(config.roles)) {
      for (const roleConfig of config.roles) {
        try {
          const role = await discordService.createRole(guildId, roleConfig);
          results.push({ type: 'role', success: true, data: { id: role.id, name: role.name } });
          logger.info(`Setup: Created role ${role.name}`);
        } catch (error) {
          results.push({ type: 'role', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          logger.error(`Setup: Failed to create role ${roleConfig.name}:`, error);
        }
      }
    }

    // Create default categories if specified
    if (config.categories && Array.isArray(config.categories)) {
      for (const categoryConfig of config.categories) {
        try {
          const category = await discordService.createCategory(guildId, categoryConfig);
          results.push({ type: 'category', success: true, data: { id: category.id, name: category.name } });
          logger.info(`Setup: Created category ${category.name}`);
        } catch (error) {
          results.push({ type: 'category', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          logger.error(`Setup: Failed to create category ${categoryConfig.name}:`, error);
        }
      }
    }

    // Create default channels if specified
    if (config.channels && Array.isArray(config.channels)) {
      for (const channelConfig of config.channels) {
        try {
          const channel = await discordService.createChannel(guildId, channelConfig);
          results.push({ type: 'channel', success: true, data: { id: channel.id, name: channel.name } });
          logger.info(`Setup: Created channel ${channel.name}`);
        } catch (error) {
          results.push({ type: 'channel', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          logger.error(`Setup: Failed to create channel ${channelConfig.name}:`, error);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return res.json({ 
      success: true, 
      message: `Server setup completed: ${successCount}/${totalCount} items created`,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });

  } catch (error) {
    logger.error('Server setup error:', error);
    return res.status(500).json({ error: 'Failed to setup server' });
  }
});

// GET /server/status
router.get('/status', rateLimitMiddleware, (req: Request, res: Response) => {
  try {
    const discordService = new DiscordService();
    const isConnected = discordService.isConnected();

    return res.json({
      success: true,
      status: {
        discord: isConnected ? 'connected' : 'disconnected',
        features: {
          channelManagement: env.ENABLE_CHANNEL_MANAGEMENT,
          roleManagement: env.ENABLE_ROLE_MANAGEMENT,
          webhookSystem: env.ENABLE_WEBHOOK_SYSTEM,
          serverConfig: env.ENABLE_SERVER_CONFIG
        },
        server: {
          port: env.PORT,
          host: env.HOST,
          environment: env.NODE_ENV
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to get server status' });
  }
});

// POST /server/config
router.post('/config', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_SERVER_CONFIG) {
      return res.status(403).json({ error: 'Server configuration is disabled' });
    }

    const { guildId, action, data } = req.body;

    if (!guildId || !action) {
      return res.status(400).json({ error: 'guildId and action are required' });
    }

    const discordService = new DiscordService();
    let result;

    switch (action) {
      case 'get_info':
        result = await discordService.getGuildInfo(guildId);
        break;
      
      case 'get_channels':
        const guildInfo = await discordService.getGuildInfo(guildId);
        result = { channels: guildInfo.channels };
        break;
      
      case 'get_roles':
        const guildRoles = await discordService.getGuildInfo(guildId);
        result = { roles: guildRoles.roles };
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid action specified' });
    }

    return res.json({ 
      success: true, 
      action,
      data: result
    });

  } catch (error) {
    logger.error('Server config error:', error);
    return res.status(500).json({ error: 'Failed to execute server config action' });
  }
});

export default router;
