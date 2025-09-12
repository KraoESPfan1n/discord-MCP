# Discord MCP Server

A comprehensive Discord Model Context Protocol (MCP) server with webhook support, channel management, role management, and server configuration capabilities.

## Features

- ✅ **Discord.js v14 Integration** - Latest Discord.js with Components v2 support
- ✅ **Secure Webhook System** - HMAC signature verification and rate limiting
- ✅ **Channel Management** - Create, delete channels and categories
- ✅ **Role Management** - Create, delete roles with permissions
- ✅ **Server Configuration** - Automated server setup and management
- ✅ **PM2 Support** - Production-ready process management
- ✅ **Security Features** - Helmet, CORS, rate limiting, input sanitization
- ✅ **Comprehensive Logging** - Winston-based logging with file rotation
- ✅ **Environment Validation** - Zod-based configuration validation
- ✅ **Graceful Shutdown** - Proper cleanup on termination

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your Discord bot token and configuration:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
WEBHOOK_SECRET=your_32_character_webhook_secret_here
API_KEY=your_16_character_api_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 3. Development

Run in development mode with automatic reload:

```bash
npm run dev
```

### 4. Production

Build and start the server:

```bash
npm run build
npm start
```

### 5. PM2 Deployment

Start with PM2:

```bash
npm run pm2:start
```

Other PM2 commands:

```bash
npm run pm2:stop      # Stop the server
npm run pm2:restart   # Restart the server
npm run pm2:logs      # View logs
npm run pm2:monit     # Monitor performance
```

## API Endpoints

### Health & Status

- `GET /health` - Health check endpoint
- `GET /api/status` - Server status and feature flags

### Webhooks

- `POST /api/webhook/send` - Send webhook message
- `POST /api/webhook/create` - Create webhook
- `GET /api/webhook/test` - Test webhook system

### Channels

- `POST /api/channels/create` - Create channel
- `POST /api/channels/category/create` - Create category
- `DELETE /api/channels/:channelId` - Delete channel
- `GET /api/channels/guild/:guildId` - Get guild channels
- `GET /api/channels/:channelId` - Get channel info

### Roles

- `POST /api/roles/create` - Create role
- `POST /api/roles/bulk-create` - Create multiple roles
- `DELETE /api/roles/:roleId` - Delete role
- `GET /api/roles/guild/:guildId` - Get guild roles

### Server Management

- `GET /api/server/info/:guildId` - Get guild information
- `POST /api/server/setup` - Automated server setup
- `POST /api/server/config` - Server configuration actions
- `GET /api/server/status` - Server status

## Security Features

### Webhook Security

All webhook requests require HMAC signature verification:

```javascript
const crypto = require('crypto');
const payload = JSON.stringify(data);
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

fetch('/api/webhook/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payload
});
```

### Rate Limiting

- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 per window
- **Headers**: Includes remaining requests and retry-after

### Input Validation

- Discord ID validation (17-19 digit format)
- Webhook URL validation
- Input sanitization (HTML/script injection prevention)
- Payload size limits

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | ✅ | Discord application client secret |
| `WEBHOOK_SECRET` | ✅ | 32+ character webhook signing secret |
| `API_KEY` | ✅ | 16+ character API key |
| `ENCRYPTION_KEY` | ✅ | Exactly 32 character encryption key |
| `PORT` | ❌ | Server port (default: 3000) |
| `HOST` | ❌ | Server host (default: 0.0.0.0) |
| `NODE_ENV` | ❌ | Environment (development/production) |

## Feature Flags

Enable/disable features via environment variables:

```env
ENABLE_CHANNEL_MANAGEMENT=true
ENABLE_ROLE_MANAGEMENT=true
ENABLE_WEBHOOK_SYSTEM=true
ENABLE_SERVER_CONFIG=true
```

## Logging

Logs are written to:
- `./logs/discord-mcp.log` - Combined logs
- `./logs/error.log` - Error logs only
- Console output (development only)

Log levels: `error`, `warn`, `info`, `debug`

## Discord Bot Permissions

Your Discord bot needs the following permissions:

- **Manage Channels** - Create/delete channels and categories
- **Manage Roles** - Create/delete roles
- **Manage Webhooks** - Create webhooks
- **Send Messages** - Send webhook messages
- **Use Slash Commands** - For future command support

## Error Handling

The server includes comprehensive error handling:

- Graceful Discord connection management
- Automatic reconnection on connection loss
- Proper HTTP status codes and error messages
- Detailed logging for debugging
- Graceful shutdown on termination signals

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the logs in `./logs/` directory
- Verify your environment configuration
- Ensure Discord bot has proper permissions
