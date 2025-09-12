# Discord MCP Server - Setup Guide

**✅ Tested and Verified:** September 13, 2025  
**Status:** All tests passed, Components v2 fully implemented

## 🚀 Quick Start

### 1. Generate Secrets

First, generate secure secrets for your server:

```bash
# Linux/Mac
node scripts/generate-secrets.js

# Windows PowerShell
node scripts/generate-secrets.js
```

### 2. Configure Environment

Copy the example environment file and add your secrets:

```bash
cp .env.example .env
```

Edit `.env` with your Discord bot configuration:

```env
# Discord Bot Configuration (Required)
DISCORD_TOKEN=your_discord_bot_token_here
# Note: CLIENT_ID and CLIENT_SECRET are optional for MCP server
# They are only needed for OAuth2 flows, which this MCP server doesn't use
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Security Configuration (Generated above)
WEBHOOK_SECRET=your_32_character_webhook_secret_here
API_KEY=your_16_character_api_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
```

### 3. Install and Build

```bash
npm install
npm run build
```

### 4. Run the Server

**Development:**
```bash
npm run dev
```

**Production with PM2:**
```bash
npm run pm2:start
```

## 🔧 Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application (e.g., "Discord MCP Server")
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the bot token to your `.env` file

### 2. Set Bot Permissions

Your bot needs these permissions:
- `Manage Channels` (0x00000010)
- `Manage Roles` (0x10000000)
- `Manage Webhooks` (0x20000000)
- `Send Messages` (0x00000800)
- `Use Slash Commands` (0x8000000000)

### 3. Invite Bot to Server

Use this URL (replace CLIENT_ID with your bot's client ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=2147483648&scope=bot
```

## 🛡️ Security Features

### Webhook Security

All webhook requests require HMAC signature verification. Example:

```javascript
const crypto = require('crypto');
const payload = JSON.stringify({
  webhookUrl: 'https://discord.com/api/webhooks/...',
  message: {
    content: 'Hello from MCP!',
    username: 'MCP Bot'
  }
});

const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

fetch('http://localhost:3000/api/webhook/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payload
});
```

### Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per window per IP
- **Headers**: `X-RateLimit-Remaining`, `Retry-After`

## 📡 API Usage Examples

### Create Channel

```bash
curl -X POST http://localhost:3000/api/channels/create \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your_signature" \
  -d '{
    "guildId": "your_guild_id",
    "name": "general",
    "type": 0,
    "topic": "General discussion"
  }'
```

### Create Role

```bash
curl -X POST http://localhost:3000/api/roles/create \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your_signature" \
  -d '{
    "guildId": "your_guild_id",
    "name": "Moderator",
    "color": "#ff0000",
    "permissions": "268435456",
    "hoist": true
  }'
```

### Send Webhook

```bash
curl -X POST http://localhost:3000/api/webhook/send \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your_signature" \
  -d '{
    "webhookUrl": "https://discord.com/api/webhooks/...",
    "message": {
      "content": "Hello from Discord MCP!",
      "username": "MCP Bot",
      "embeds": [{
        "title": "MCP Server",
        "description": "Discord MCP Server is running!",
        "color": 0x00ff00
      }]
    }
  }'
```

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Server Status

```bash
curl http://localhost:3000/api/status
```

### PM2 Monitoring

```bash
npm run pm2:logs    # View logs
npm run pm2:monit   # Monitor performance
npm run pm2:restart # Restart server
```

## 🚨 Troubleshooting

### Common Issues

1. **Bot not connecting**: Check Discord token and permissions
2. **Rate limit errors**: Wait for rate limit window to reset
3. **Signature verification failed**: Ensure correct webhook secret
4. **Channel creation failed**: Check bot permissions in server

### Logs

Check logs in:
- `./logs/discord-mcp.log` - Combined logs
- `./logs/error.log` - Error logs only
- Console output (development mode)

### Environment Validation

The server validates all environment variables on startup. If validation fails, check:
- Required variables are set
- Secret lengths meet requirements
- Discord IDs are valid format (17-19 digits)

## 🔄 Updates

To update the server:

```bash
git pull
npm install
npm run build
npm run pm2:restart
```

## 📚 Additional Resources

- [Discord.js Documentation](https://discord.js.org/#/docs)
- [Discord API Documentation](https://discord.com/developers/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Express.js Documentation](https://expressjs.com/)

## 🆘 Support

For issues:
1. Check logs in `./logs/` directory
2. Verify environment configuration
3. Ensure Discord bot has proper permissions
4. Create an issue on GitHub with logs and configuration (remove secrets)
