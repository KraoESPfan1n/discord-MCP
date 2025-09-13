import { Router, Request, Response } from 'express';
import { DiscordService } from '../services/discord.service';
import { verifyWebhookSignature, RateLimiter } from '../utils/security';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/security';
import { Colors, PermissionFlagsBits } from 'discord.js';

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

// POST /roles/create
router.post('/create', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_ROLE_MANAGEMENT) {
      return res.status(403).json({ error: 'Role management is disabled' });
    }

    const { guildId, name, color, permissions, mentionable, hoist } = req.body;

    if (!guildId || !name) {
      return res.status(400).json({ error: 'guildId and name are required' });
    }

    // Parse color if provided
    let roleColor: number = Colors.Blurple;
    if (color) {
      if (typeof color === 'string') {
        // Handle hex color
        if (color.startsWith('#')) {
          roleColor = parseInt(color.slice(1), 16);
        } else {
          // Handle color names
          roleColor = (Colors[color as keyof typeof Colors] as number) || Colors.Blurple;
        }
      } else if (typeof color === 'number') {
        roleColor = color;
      }
    }

    // Parse permissions if provided
    let rolePermissions = PermissionFlagsBits.ViewChannel;
    if (permissions) {
      if (typeof permissions === 'string') {
        rolePermissions = BigInt(permissions);
      } else if (typeof permissions === 'number') {
        rolePermissions = BigInt(permissions);
      }
    }

    const discordService = new DiscordService();
    const role = await discordService.createRole(guildId, {
      name: sanitizeInput(name),
      color: roleColor,
      permissions: rolePermissions,
      mentionable: mentionable || false,
      hoist: hoist || false
    });

    logger.info(`Role created: ${role.name} in guild ${guildId}`);
    return res.json({ 
      success: true, 
      role: {
        id: role.id,
        name: role.name,
        color: role.color,
        permissions: role.permissions.bitfield.toString(),
        mentionable: role.mentionable,
        hoist: role.hoist,
        guildId: role.guild.id
      }
    });

  } catch (error) {
    logger.error('Role creation error:', error);
    return res.status(500).json({ error: 'Failed to create role' });
  }
});

// DELETE /roles/:roleId
router.delete('/:roleId', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_ROLE_MANAGEMENT) {
      return res.status(403).json({ error: 'Role management is disabled' });
    }

    const { roleId } = req.params;
    const { guildId } = req.body;

    if (!roleId || !guildId) {
      return res.status(400).json({ error: 'roleId and guildId are required' });
    }

    const discordService = new DiscordService();
    await discordService.deleteRole(guildId, roleId);

    logger.info(`Role deleted: ${roleId} from guild ${guildId}`);
    return res.json({ success: true, message: 'Role deleted successfully' });

  } catch (error) {
    logger.error('Role deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
});

// GET /roles/guild/:guildId
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
        roles: guildInfo.roles
      }
    });

  } catch (error) {
    logger.error('Guild roles fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch guild roles' });
  }
});

// POST /roles/bulk-create
router.post('/bulk-create', rateLimitMiddleware, verifySignature, async (req: Request, res: Response) => {
  try {
    if (!env.ENABLE_ROLE_MANAGEMENT) {
      return res.status(403).json({ error: 'Role management is disabled' });
    }

    const { guildId, roles } = req.body;

    if (!guildId || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'guildId and roles array are required' });
    }

    if (roles.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 roles can be created at once' });
    }

    const discordService = new DiscordService();
    const createdRoles = [];

    for (const roleData of roles) {
      try {
        const { name, color, permissions, mentionable, hoist } = roleData;

        if (!name) {
          logger.warn('Skipping role creation: name is required');
          continue;
        }

        let roleColor: number = Colors.Blurple;
        if (color) {
          if (typeof color === 'string' && color.startsWith('#')) {
            roleColor = parseInt(color.slice(1), 16);
          } else if (typeof color === 'number') {
            roleColor = color;
          }
        }

        let rolePermissions = PermissionFlagsBits.ViewChannel;
        if (permissions) {
          rolePermissions = BigInt(permissions);
        }

        const role = await discordService.createRole(guildId, {
          name: sanitizeInput(name),
          color: roleColor,
          permissions: rolePermissions,
          mentionable: mentionable || false,
          hoist: hoist || false
        });

        createdRoles.push({
          id: role.id,
          name: role.name,
          color: role.color,
          permissions: role.permissions.bitfield.toString(),
          mentionable: role.mentionable,
          hoist: role.hoist
        });

        logger.info(`Bulk role created: ${role.name} in guild ${guildId}`);
      } catch (error) {
        logger.error(`Failed to create role ${roleData.name}:`, error);
      }
    }

    return res.json({ 
      success: true, 
      message: `Created ${createdRoles.length} roles`,
      roles: createdRoles
    });

  } catch (error) {
    logger.error('Bulk role creation error:', error);
    return res.status(500).json({ error: 'Failed to create roles' });
  }
});

export default router;
