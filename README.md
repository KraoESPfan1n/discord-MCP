# Discord MCP Server

A comprehensive Discord Model Context Protocol (MCP) server with webhook support, channel management, role management, and server configuration capabilities.

## Features

- ✅ **Discord.js v14 Integration** - Latest Discord.js with Components v2 support
- ✅ **Components v2 Support** - Full support for Discord's new Components v2 (2025-04-22)
- ✅ **Secure Webhook System** - HMAC signature verification and rate limiting
- ✅ **Channel Management** - Create, delete channels and categories
- ✅ **Role Management** - Create, delete roles with permissions
- ✅ **Server Configuration** - Automated server setup and management
- ✅ **PM2 Support** - Production-ready process management
- ✅ **Security Features** - Helmet, CORS, rate limiting, input sanitization
- ✅ **Comprehensive Logging** - Winston-based logging with file rotation
- ✅ **Environment Validation** - Zod-based configuration validation
- ✅ **Graceful Shutdown** - Proper cleanup on termination

## ✅ Test Status

**Last Tested:** September 13, 2025  
**Status:** ✅ **ALL TESTS PASSED**  
**Components v2:** ✅ **FULLY IMPLEMENTED**  
**Build:** ✅ **SUCCESSFUL**  
**Server:** ✅ **RUNNING**

See [TEST_REPORT.md](./TEST_REPORT.md) for detailed test results.

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
# Note: CLIENT_ID and CLIENT_SECRET are optional for MCP server
# They are only needed for OAuth2 flows, which this MCP server doesn't use
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

### Components v2

- `POST /api/components/v2/message` - Send Components v2 message
- `POST /api/components/v2/container` - Create container component
- `POST /api/components/v2/separator` - Create separator component
- `POST /api/components/v2/text` - Create text element
- `POST /api/components/v2/image` - Create image element
- `POST /api/components/v2/button` - Create button component
- `POST /api/components/v2/select` - Create select menu
- `POST /api/components/v2/modal` - Create modal
- `GET /api/components/v2/examples` - Get Components v2 examples

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
| `DISCORD_CLIENT_ID` | ❌ | Discord application client ID (optional, only for OAuth2) |
| `DISCORD_CLIENT_SECRET` | ❌ | Discord application client secret (optional, only for OAuth2) |
| `WEBHOOK_SECRET` | ✅ | 32+ character webhook signing secret |
| `API_KEY` | ✅ | 16+ character API key |
| `ENCRYPTION_KEY` | ✅ | Exactly 32 character encryption key |
| `PORT` | ❌ | Server port (default: 3000) |
| `HOST` | ❌ | Server host (default: 0.0.0.0) |
| `NODE_ENV` | ❌ | Environment (development/production) |

## Components v2 Support

This MCP server fully supports Discord's Components v2 system introduced on April 22, 2025. Components v2 provides enhanced message layouts with containers, separators, and improved component organization.

### Components v2 Features

- **Containers** - Group components together with custom layouts
- **Separators** - Visual dividers between content sections
- **Enhanced Text Elements** - Styled text with headings, colors, and formatting
- **Image Elements** - Rich image display with alt text and sizing
- **Advanced Buttons** - Enhanced button styling and interactions
- **Select Menus** - Improved dropdown menus with better UX
- **Modals** - Interactive forms with text inputs

### Components v2 Example

```javascript
// Send a Components v2 message
const messageData = {
  content: "Welcome to Components v2!",
  containers: [
    {
      type: 'container',
      style: 'primary',
      layout: 'vertical',
      children: [
        {
          type: 'text',
          content: 'Main Heading',
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
    }
  ],
  separators: [
    {
      type: 'separator',
      style: 'solid',
      color: '#7289da'
    }
  ]
};

// Send via API
fetch('/api/components/v2/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: JSON.stringify({
    channelId: 'your_channel_id',
    messageData
  })
});
```

### Webhook Components v2 Support

```javascript
// Send Components v2 via webhook
const webhookData = {
  webhookUrl: 'https://discord.com/api/webhooks/...',
  messageData: {
    content: 'Components v2 Webhook!',
    containers: [/* container data */],
    separators: [/* separator data */]
  }
};

fetch('/api/webhook/send-v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: JSON.stringify(webhookData)
});
```

## Feature Flags

Enable/disable features via environment variables:

```env
ENABLE_CHANNEL_MANAGEMENT=true
ENABLE_ROLE_MANAGEMENT=true
ENABLE_WEBHOOK_SYSTEM=true
ENABLE_SERVER_CONFIG=true
ENABLE_COMPONENTS_V2=true
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
