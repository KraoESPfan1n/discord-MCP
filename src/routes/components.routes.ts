import { Router, Request, Response } from 'express';
import { DiscordService } from '../services/discord.service';
import { verifyWebhookSignature, RateLimiter } from '../utils/security';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';

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

// POST /components/v2/message
router.post('/v2/message', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { channelId, messageData } = req.body;

    if (!channelId || !messageData) {
      return res.status(400).json({ error: 'channelId and messageData are required' });
    }

    // Sanitize message content
    const sanitizedMessageData = {
      ...messageData,
      content: messageData.content ? sanitizeInput(messageData.content) : undefined
    };

    const discordService = new DiscordService();
    const message = await discordService.createComponentsV2Message(channelId, sanitizedMessageData);

    logger.info(`Components v2 message sent to channel ${channelId}`);
    return res.json({ 
      success: true, 
      message: {
        id: message.id,
        channelId: message.channelId,
        content: message.content,
        timestamp: message.createdTimestamp
      }
    });

  } catch (error) {
    logger.error('Components v2 message creation error:', error);
    return res.status(500).json({ error: 'Failed to send Components v2 message' });
  }
});

// POST /components/v2/container
router.post('/v2/container', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { containerData } = req.body;

    if (!containerData) {
      return res.status(400).json({ error: 'containerData is required' });
    }

    const discordService = new DiscordService();
    const container = discordService.buildContainer(containerData);

    return res.json({ 
      success: true, 
      container: container.toJSON()
    });

  } catch (error) {
    logger.error('Container creation error:', error);
    return res.status(500).json({ error: 'Failed to create container' });
  }
});

// POST /components/v2/separator
router.post('/v2/separator', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { separatorData } = req.body;

    if (!separatorData) {
      return res.status(400).json({ error: 'separatorData is required' });
    }

    const discordService = new DiscordService();
    const separator = discordService.buildSeparator(separatorData);

    return res.json({ 
      success: true, 
      separator: separator.toJSON()
    });

  } catch (error) {
    logger.error('Separator creation error:', error);
    return res.status(500).json({ error: 'Failed to create separator' });
  }
});

// POST /components/v2/text
router.post('/v2/text', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { textData } = req.body;

    if (!textData) {
      return res.status(400).json({ error: 'textData is required' });
    }

    // Sanitize text content
    const sanitizedTextData = {
      ...textData,
      content: sanitizeInput(textData.content)
    };

    const discordService = new DiscordService();
    const text = discordService.buildText(sanitizedTextData);

    return res.json({ 
      success: true, 
      text: text.toJSON()
    });

  } catch (error) {
    logger.error('Text creation error:', error);
    return res.status(500).json({ error: 'Failed to create text element' });
  }
});

// POST /components/v2/image
router.post('/v2/image', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'imageData is required' });
    }

    const discordService = new DiscordService();
    const image = discordService.buildImage(imageData);

    return res.json({ 
      success: true, 
      image: image.toJSON()
    });

  } catch (error) {
    logger.error('Image creation error:', error);
    return res.status(500).json({ error: 'Failed to create image element' });
  }
});

// POST /components/v2/button
router.post('/v2/button', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { buttonData } = req.body;

    if (!buttonData) {
      return res.status(400).json({ error: 'buttonData is required' });
    }

    // Sanitize button data
    const sanitizedButtonData = {
      ...buttonData,
      label: sanitizeInput(buttonData.label),
      customId: buttonData.customId ? sanitizeInput(buttonData.customId) : undefined
    };

    const discordService = new DiscordService();
    const button = discordService.buildButton(sanitizedButtonData);

    return res.json({ 
      success: true, 
      button: button.toJSON()
    });

  } catch (error) {
    logger.error('Button creation error:', error);
    return res.status(500).json({ error: 'Failed to create button' });
  }
});

// POST /components/v2/select
router.post('/v2/select', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { selectData } = req.body;

    if (!selectData) {
      return res.status(400).json({ error: 'selectData is required' });
    }

    // Sanitize select data
    const sanitizedSelectData = {
      ...selectData,
      customId: sanitizeInput(selectData.customId),
      placeholder: selectData.placeholder ? sanitizeInput(selectData.placeholder) : undefined,
      options: selectData.options ? selectData.options.map((option: any) => ({
        ...option,
        label: sanitizeInput(option.label),
        description: option.description ? sanitizeInput(option.description) : undefined
      })) : undefined
    };

    const discordService = new DiscordService();
    const select = discordService.buildSelectMenu(sanitizedSelectData);

    return res.json({ 
      success: true, 
      select: select.toJSON()
    });

  } catch (error) {
    logger.error('Select menu creation error:', error);
    return res.status(500).json({ error: 'Failed to create select menu' });
  }
});

// POST /components/v2/modal
router.post('/v2/modal', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_COMPONENTS_V2) {
      return res.status(403).json({ error: 'Components v2 is disabled' });
    }

    const { modalData } = req.body;

    if (!modalData) {
      return res.status(400).json({ error: 'modalData is required' });
    }

    // Sanitize modal data
    const sanitizedModalData = {
      ...modalData,
      title: sanitizeInput(modalData.title),
      customId: sanitizeInput(modalData.customId),
      components: modalData.components.map((component: any) => ({
        ...component,
        customId: sanitizeInput(component.customId),
        label: sanitizeInput(component.label),
        placeholder: component.placeholder ? sanitizeInput(component.placeholder) : undefined
      }))
    };

    const discordService = new DiscordService();
    const modal = await discordService.createModal(sanitizedModalData);

    return res.json({ 
      success: true, 
      modal: modal.toJSON()
    });

  } catch (error) {
    logger.error('Modal creation error:', error);
    return res.status(500).json({ error: 'Failed to create modal' });
  }
});

// GET /components/v2/examples
router.get('/v2/examples', rateLimitMiddleware, (req: Request, res: Response) => {
  return res.json({
    success: true,
    examples: {
      container: {
        type: 'container',
        style: 'primary',
        layout: 'vertical',
        children: [
          {
            type: 'text',
            content: 'Welcome to Components v2!',
            style: 'heading',
            color: '#ffffff'
          },
          {
            type: 'button',
            label: 'Click me!',
            style: 'primary',
            customId: 'example_button'
          }
        ]
      },
      separator: {
        type: 'separator',
        style: 'solid',
        color: '#7289da'
      },
      text: {
        type: 'text',
        content: 'This is a text element',
        style: 'body',
        color: '#ffffff',
        weight: 'normal'
      },
      image: {
        type: 'image',
        url: 'https://example.com/image.png',
        alt: 'Example image',
        width: 300,
        height: 200
      },
      button: {
        type: 'button',
        label: 'Example Button',
        style: 'primary',
        customId: 'example_button',
        emoji: '👍'
      },
      select: {
        type: 'select',
        customId: 'example_select',
        placeholder: 'Choose an option...',
        minValues: 1,
        maxValues: 1,
        options: [
          {
            label: 'Option 1',
            value: 'option_1',
            description: 'First option',
            emoji: '1️⃣'
          },
          {
            label: 'Option 2',
            value: 'option_2',
            description: 'Second option',
            emoji: '2️⃣'
          }
        ]
      },
      modal: {
        title: 'Example Modal',
        customId: 'example_modal',
        components: [
          {
            type: 'text_input',
            customId: 'name_input',
            label: 'Your Name',
            style: 'short',
            required: true,
            placeholder: 'Enter your name...'
          },
          {
            type: 'text_input',
            customId: 'description_input',
            label: 'Description',
            style: 'paragraph',
            required: false,
            placeholder: 'Enter a description...'
          }
        ]
      }
    }
  });
});

export default router;
