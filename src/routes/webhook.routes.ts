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
    return res.json({ success: true, message: 'Webhook sent successfully' });

  } catch (error) {
    logger.error('Webhook send error:', error);
    return res.status(500).json({ error: 'Failed to send webhook' });
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
    return res.json({ 
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
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// POST /webhook/send-v2
router.post('/send-v2', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    const { webhookUrl, messageData } = req.body;

    if (!webhookUrl || !messageData) {
      return res.status(400).json({ error: 'webhookUrl and messageData are required' });
    }

    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(400).json({ error: 'Invalid webhook URL format' });
    }

    // Sanitize message content
    const sanitizedMessageData = {
      ...messageData,
      content: messageData.content ? sanitizeInput(messageData.content) : undefined,
      username: messageData.username ? sanitizeInput(messageData.username) : undefined
    };

    // Validate payload size
    const payloadSize = JSON.stringify(sanitizedMessageData).length;
    if (payloadSize > env.MAX_WEBHOOK_PAYLOAD_SIZE) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const discordService = new DiscordService();
    
    // Build Components v2 payload
    const webhookPayload: any = {
      content: sanitizedMessageData.content,
      username: sanitizedMessageData.username,
      avatar_url: sanitizedMessageData.avatar_url,
      embeds: sanitizedMessageData.embeds || []
    };

    // Add Components v2 containers if provided
    if (sanitizedMessageData.containers && sanitizedMessageData.containers.length > 0) {
      webhookPayload.components = sanitizedMessageData.containers.map((container: any) => 
        discordService.buildContainer(container).toJSON()
      );
    }

    // Add traditional components if provided
    if (sanitizedMessageData.components && sanitizedMessageData.components.length > 0) {
      if (!webhookPayload.components) webhookPayload.components = [];
      webhookPayload.components.push(...sanitizedMessageData.components);
    }

    // Add separators as embeds if provided
    if (sanitizedMessageData.separators && sanitizedMessageData.separators.length > 0) {
      if (!webhookPayload.embeds) webhookPayload.embeds = [];
      webhookPayload.embeds.push(...sanitizedMessageData.separators.map((sep: any) => 
        discordService.buildSeparator(sep).toJSON()
      ));
    }

    // Send webhook with Components v2 support
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    logger.info(`Components v2 webhook message sent to ${webhookUrl}`);
    return res.json({ success: true, message: 'Components v2 webhook sent successfully' });

  } catch (error) {
    logger.error('Components v2 webhook send error:', error);
    return res.status(500).json({ error: 'Failed to send Components v2 webhook' });
  }
});

// GET /webhook/test
router.get('/test', rateLimitMiddleware, (req: Request, res: Response) => {
  return res.json({ 
    success: true, 
    message: 'Webhook system is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /webhook/test-v2
router.get('/test-v2', rateLimitMiddleware, (req: Request, res: Response) => {
  return res.json({ 
    success: true, 
    message: 'Components v2 webhook system is operational',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Containers',
      'Separators', 
      'Enhanced Text Elements',
      'Image Elements',
      'Advanced Buttons',
      'Select Menus',
      'Modals'
    ]
  });
});

export default router;
