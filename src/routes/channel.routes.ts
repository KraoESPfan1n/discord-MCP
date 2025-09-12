import { Router, Request, Response } from 'express';
import { DiscordService } from '../services/discord.service';
import { verifyWebhookSignature, RateLimiter } from '../utils/security';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { ChannelType } from 'discord.js';

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

// POST /channels/create
router.post('/create', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_CHANNEL_MANAGEMENT) {
      return res.status(403).json({ error: 'Channel management is disabled' });
    }

    const { guildId, name, type, parentId, topic, permissionOverwrites } = req.body;

    if (!guildId || !name) {
      return res.status(400).json({ error: 'guildId and name are required' });
    }

    // Validate channel type
    const validTypes = Object.values(ChannelType);
    const channelType = type && validTypes.includes(type) ? type : ChannelType.GuildText;

    const discordService = new DiscordService();
    const channelData: any = {
      name: sanitizeInput(name),
      type: channelType,
      parentId,
      permissionOverwrites
    };
    
    if (topic) {
      channelData.topic = sanitizeInput(topic);
    }
    
    const channel = await discordService.createChannel(guildId, channelData);

    logger.info(`Channel created: ${'name' in channel ? channel.name : 'Unknown'} in guild ${guildId}`);
    return res.json({ 
      success: true, 
      channel: {
        id: channel.id,
        name: 'name' in channel ? channel.name : 'Unknown',
        type: channel.type,
        guildId: 'guildId' in channel ? channel.guildId : null,
        parentId: 'parentId' in channel ? channel.parentId : null
      }
    });

  } catch (error) {
    logger.error('Channel creation error:', error);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
});

// POST /channels/category/create
router.post('/category/create', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_CHANNEL_MANAGEMENT) {
      return res.status(403).json({ error: 'Channel management is disabled' });
    }

    const { guildId, name, permissionOverwrites } = req.body;

    if (!guildId || !name) {
      return res.status(400).json({ error: 'guildId and name are required' });
    }

    const discordService = new DiscordService();
    const category = await discordService.createCategory(guildId, {
      name: sanitizeInput(name),
      permissionOverwrites
    });

    logger.info(`Category created: ${category.name} in guild ${guildId}`);
    return res.json({ 
      success: true, 
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        guildId: category.guildId
      }
    });

  } catch (error) {
    logger.error('Category creation error:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /channels/:channelId
router.delete('/:channelId', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_CHANNEL_MANAGEMENT) {
      return res.status(403).json({ error: 'Channel management is disabled' });
    }

    const { channelId } = req.params;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const discordService = new DiscordService();
    await discordService.deleteChannel(channelId);

    logger.info(`Channel deleted: ${channelId}`);
    return res.json({ success: true, message: 'Channel deleted successfully' });

  } catch (error) {
    logger.error('Channel deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// GET /channels/guild/:guildId
router.get('/guild/:guildId', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;

    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }

    const discordService = new DiscordService();
    const guildInfo = await discordService.getGuildInfo(guildId);

    return res.json({ 
      success: true, 
      guild: {
        id: guildInfo.id,
        name: guildInfo.name,
        channels: guildInfo.channels
      }
    });

  } catch (error) {
    logger.error('Guild channels fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch guild channels' });
  }
});

// GET /channels/:channelId
router.get('/:channelId', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const discordService = new DiscordService();
    const channel = await discordService.getChannel(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    return res.json({ 
      success: true, 
      channel: {
        id: channel.id,
        name: 'name' in channel ? channel.name : 'Unknown',
        type: channel.type,
        guildId: 'guildId' in channel ? channel.guildId : null
      }
    });

  } catch (error) {
    logger.error('Channel fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

export default router;
