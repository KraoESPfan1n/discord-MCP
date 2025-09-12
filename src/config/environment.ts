import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Discord Configuration
  DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'Discord client secret is required'),
  
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  HOST: z.string().default('0.0.0.0'),
  
  // Security Configuration
  WEBHOOK_SECRET: z.string().min(32, 'Webhook secret must be at least 32 characters'),
  API_KEY: z.string().min(16, 'API key must be at least 16 characters'),
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/discord-mcp.log'),
  
  // Discord Server Defaults
  DEFAULT_GUILD_ID: z.string().optional(),
  ADMIN_ROLE_ID: z.string().optional(),
  MODERATOR_ROLE_ID: z.string().optional(),
  
  // Webhook Configuration
  WEBHOOK_TIMEOUT: z.string().transform(Number).default('30000'),
  MAX_WEBHOOK_PAYLOAD_SIZE: z.string().transform(Number).default('1048576'),
  
  // Feature Flags
  ENABLE_CHANNEL_MANAGEMENT: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ROLE_MANAGEMENT: z.string().transform(val => val === 'true').default('true'),
  ENABLE_WEBHOOK_SYSTEM: z.string().transform(val => val === 'true').default('true'),
  ENABLE_SERVER_CONFIG: z.string().transform(val => val === 'true').default('true'),
});

// Validate and parse environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Type-safe environment configuration
export type Environment = typeof env;
