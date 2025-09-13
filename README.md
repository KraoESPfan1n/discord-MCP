# Discord MCP Server

A powerful Discord MCP (Model Context Protocol) server with Components v2 support, built with TypeScript and Express.

## 🚀 Features

- **Discord API Integration** - Full Discord.js integration with modern features
- **Components v2 Support** - Latest Discord Components v2 implementation
- **Webhook System** - Secure webhook handling with signature verification
- **Channel Management** - Create, manage, and delete Discord channels
- **Role Management** - Handle Discord roles and permissions
- **Security First** - Comprehensive security with rate limiting, CORS, and validation
- **TypeScript** - Fully typed codebase for better development experience
- **Production Ready** - Built for production with proper error handling and logging

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Discord Bot Token (for Discord functionality)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd discord-MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Generate secrets:**
   ```bash
   node scripts/generate-secrets.js
   ```

5. **Configure your .env file:**
   - Add your Discord bot token
   - Update the generated secrets
   - Configure other settings as needed

## 🔐 Security Setup

**Important:** This project requires you to generate your own secrets for security. See [SETUP_SECRETS.md](./SETUP_SECRETS.md) for detailed instructions.

### Quick Secret Generation:
```bash
node scripts/generate-secrets.js
```

## 🚀 Quick Start

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
node run-tests.js
```

## 📚 API Documentation

### Health Check
```http
GET /health
```

### API Status
```http
GET /api/status
```

### Webhook Endpoints
```http
POST /api/webhook/send
POST /api/webhook/send-v2
```

### Channel Management
```http
POST /api/channels/create
POST /api/channels/category/create
DELETE /api/channels/:channelId
GET /api/channels/:channelId
GET /api/channels/guild/:guildId
```

### Role Management
```http
POST /api/roles/create
DELETE /api/roles/:roleId
GET /api/roles/guild/:guildId
```

### Components v2
```http
POST /api/components/v2/message
POST /api/components/v2/container
POST /api/components/v2/separator
POST /api/components/v2/text
POST /api/components/v2/image
POST /api/components/v2/button
POST /api/components/v2/select
POST /api/components/v2/modal
GET /api/components/v2/examples
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Discord bot token | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment | No | production |
| `HOST` | Server host | No | 0.0.0.0 |
| `WEBHOOK_SECRET` | Webhook signature secret | Yes | - |
| `API_KEY` | API authentication key | Yes | - |
| `ENCRYPTION_KEY` | Data encryption key | Yes | - |

See `.env.example` for all available options.

### Feature Flags

Control which features are enabled:

- `ENABLE_CHANNEL_MANAGEMENT` - Channel management features
- `ENABLE_ROLE_MANAGEMENT` - Role management features
- `ENABLE_WEBHOOK_SYSTEM` - Webhook functionality
- `ENABLE_SERVER_CONFIG` - Server configuration features
- `ENABLE_COMPONENTS_V2` - Discord Components v2 support

## 🧪 Testing

The project includes comprehensive tests:

```bash
# Run all tests
node run-tests.js

# Run specific test categories
npm test
```

### Test Coverage
- ✅ Server startup and health checks
- ✅ API endpoint functionality
- ✅ Security headers and CORS
- ✅ Rate limiting
- ✅ Error handling
- ✅ Components v2 features

## 📖 Documentation

- [Components v2 Guide](./COMPONENTS_V2_GUIDE.md) - Complete Components v2 documentation
- [Security Setup](./SETUP_SECRETS.md) - How to generate and configure secrets
- [Deployment Guide](./DEPLOYMENT_SECURE.md) - Production deployment instructions
- [Test Results](./TEST_RESULTS.md) - Comprehensive test results

## 🏗️ Development

### Project Structure
```
discord-MCP/
├── src/                    # TypeScript source code
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── dist/                  # Compiled JavaScript
├── logs/                  # Application logs
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

### Available Scripts

```bash
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run dev        # Start development server with hot reload
npm run test       # Run tests
npm run lint       # Run ESLint
npm run clean      # Clean build directory
```

## 🔒 Security

This project implements comprehensive security measures:

- **Rate Limiting** - Prevents abuse and DoS attacks
- **CORS Protection** - Configurable cross-origin resource sharing
- **Request Validation** - Input sanitization and validation
- **Security Headers** - Standard security headers
- **Webhook Signatures** - HMAC signature verification
- **API Key Authentication** - Secure API access
- **Data Encryption** - Sensitive data encryption

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker
```bash
docker build -t discord-mcp .
docker run -p 3000:3000 --env-file .env discord-mcp
```

### Manual Deployment
```bash
npm run build
npm start
```

See [DEPLOYMENT_SECURE.md](./DEPLOYMENT_SECURE.md) for detailed production deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs/ folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Discord**: Join our Discord server for support

## 🎯 Roadmap

- [ ] Database integration
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Web dashboard
- [ ] Multi-guild support
- [ ] Advanced Components v2 features

---

**Built with ❤️ for the Discord community**
