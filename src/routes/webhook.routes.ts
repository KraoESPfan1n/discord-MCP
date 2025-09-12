import { Router, Request, Response } from 'express';
import { DiscordService } from '../services/discord.service';
import { verifyWebhookSignature, RateLimiter } from '../utils/security';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { isValidWebhookUrl, sanitizeInput } from '../utils/security';

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

  next();
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
  next();
};

// POST /webhook/send
router.post('/send', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    const { webhookUrl, message } = req.body;

    if (!webhookUrl || !message) {
      return res.status(400).json({ error: 'webhookUrl and message are required' });
    }

    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(400).json({ error: 'Invalid webhook URL format' });
    }

    // Sanitize message content
    const sanitizedMessage = {
      ...message,
      content: message.content ? sanitizeInput(message.content) : undefined,
      username: message.username ? sanitizeInput(message.username) : undefined
    };

    // Validate payload size
    const payloadSize = JSON.stringify(sanitizedMessage).length;
    if (payloadSize > env.MAX_WEBHOOK_PAYLOAD_SIZE) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const discordService = new DiscordService();
    await discordService.sendWebhookMessage(webhookUrl, sanitizedMessage);

    logger.info(`Webhook message sent to ${webhookUrl}`);
    res.json({ success: true, message: 'Webhook sent successfully' });

  } catch (error) {
    logger.error('Webhook send error:', error);
    res.status(500).json({ error: 'Failed to send webhook' });
  }
});

// POST /webhook/create
router.post('/create', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    const { channelId, name, avatar } = req.body;

    if (!channelId || !name) {
      return res.status(400).json({ error: 'channelId and name are required' });
    }

    const discordService = new DiscordService();
    const webhook = await discordService.createWebhook(channelId, {
      name: sanitizeInput(name),
      avatar
    });

    logger.info(`Webhook created: ${webhook.name} in channel ${channelId}`);
    res.json({ 
      success: true, 
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        channelId: webhook.channelId
      }
    });

  } catch (error) {
    logger.error('Webhook creation error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// GET /webhook/test
router.get('/test', rateLimitMiddleware, (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Webhook system is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
