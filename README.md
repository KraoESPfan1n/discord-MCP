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

This project includes comprehensive documentation organized in the `docs/` folder. Each document serves a specific purpose in helping you understand, set up, and use the Discord MCP Server effectively.

### 📚 Documentation Overview

| Document | Purpose | Audience | Key Topics |
|----------|---------|----------|------------|
| **[Components v2 Guide](./docs/COMPONENTS_V2_GUIDE.md)** | Complete Components v2 implementation guide | Developers, Bot Creators | Containers, Separators, Text Elements, Buttons, Modals, API Examples |
| **[Security Setup](./docs/SETUP_SECRETS.md)** | Step-by-step secret generation and configuration | All Users | Secret generation, .env configuration, security best practices |
| **[Deployment Guide](./docs/DEPLOYMENT_SECURE.md)** | Production deployment with enterprise security | DevOps, System Admins | Nginx setup, SSL/TLS, PM2, monitoring, backup strategies |
| **[Security Summary](./docs/SECURITY_SUMMARY.md)** | Comprehensive security analysis and confidence level | Security Teams, Admins | Security layers, attack mitigation, monitoring, incident response |
| **[Setup Guide](./docs/SETUP_GUIDE.md)** | Quick start and basic configuration | New Users | Installation, Discord bot setup, basic usage examples |
| **[Test Report](./docs/TEST_REPORT.md)** | Detailed test results and verification | QA, Developers | Test coverage, performance metrics, security verification |
| **[Test Results](./docs/TEST_RESULTS.md)** | Comprehensive test execution summary | QA, Developers | Test execution details, issues fixed, recommendations |
| **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** | Project completion status and achievements | Project Managers, Stakeholders | Feature delivery, technical implementation, next steps |
| **[Cleanup Summary](./docs/CLEANUP_SUMMARY.md)** | Configuration cleanup and optimization | Developers, Maintainers | Removed configurations, optimization results, impact analysis |

### 🎯 Quick Documentation Navigation

**For New Users:**
1. Start with [Setup Guide](./docs/SETUP_GUIDE.md) for basic installation
2. Follow [Security Setup](./docs/SETUP_SECRETS.md) for proper configuration
3. Check [Test Results](./docs/TEST_RESULTS.md) to verify everything works

**For Developers:**
1. Read [Components v2 Guide](./docs/COMPONENTS_V2_GUIDE.md) for advanced features
2. Review [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) for technical details
3. Check [Test Report](./docs/TEST_REPORT.md) for comprehensive testing info

**For Production Deployment:**
1. Follow [Deployment Guide](./docs/DEPLOYMENT_SECURE.md) for secure setup
2. Review [Security Summary](./docs/SECURITY_SUMMARY.md) for security confidence
3. Use [Cleanup Summary](./docs/CLEANUP_SUMMARY.md) for optimization tips

**For Security Teams:**
1. Start with [Security Summary](./docs/SECURITY_SUMMARY.md) for security overview
2. Review [Deployment Guide](./docs/DEPLOYMENT_SECURE.md) for production security
3. Check [Test Report](./docs/TEST_REPORT.md) for security verification results

### 📋 Documentation Details

#### 🔧 **Components v2 Guide** (`docs/COMPONENTS_V2_GUIDE.md`)
- **What it covers:** Complete implementation of Discord's Components v2 system
- **Key features:** Containers, Separators, Text Elements, Image Elements, Buttons, Select Menus, Modals
- **API endpoints:** 8 Components v2 endpoints with examples
- **Use cases:** Interactive Discord messages, forms, advanced UI components
- **Target audience:** Developers building Discord bots with modern UI

#### 🔐 **Security Setup** (`docs/SETUP_SECRETS.md`)
- **What it covers:** Step-by-step secret generation and configuration
- **Key topics:** WEBHOOK_SECRET, API_KEY, ENCRYPTION_KEY generation
- **Security practices:** Best practices for secret management
- **Troubleshooting:** Common issues and solutions
- **Target audience:** All users setting up the server

#### 🚀 **Deployment Guide** (`docs/DEPLOYMENT_SECURE.md`)
- **What it covers:** Enterprise-grade production deployment
- **Key topics:** Nginx reverse proxy, SSL/TLS, PM2, monitoring, backup
- **Security features:** Firewall, Fail2Ban, security headers
- **Monitoring:** Health checks, log rotation, automated monitoring
- **Target audience:** DevOps engineers, system administrators

#### 🛡️ **Security Summary** (`docs/SECURITY_SUMMARY.md`)
- **What it covers:** Comprehensive security analysis and confidence assessment
- **Security layers:** 5 layers of protection with detailed explanations
- **Attack mitigation:** How various attack vectors are prevented
- **Confidence level:** 95% security confidence with detailed breakdown
- **Target audience:** Security teams, compliance officers

#### ⚙️ **Setup Guide** (`docs/SETUP_GUIDE.md`)
- **What it covers:** Quick start and basic configuration
- **Key topics:** Installation, Discord bot setup, basic API usage
- **Examples:** Real-world usage examples with curl commands
- **Troubleshooting:** Common issues and solutions
- **Target audience:** New users, developers getting started

#### 🧪 **Test Report** (`docs/TEST_REPORT.md`)
- **What it covers:** Detailed test results and verification
- **Test coverage:** 100% coverage across all major components
- **Performance metrics:** Response times, memory usage, error handling
- **Security verification:** All security features tested and verified
- **Target audience:** QA teams, developers, project managers

#### 📊 **Test Results** (`docs/TEST_RESULTS.md`)
- **What it covers:** Comprehensive test execution summary
- **Test execution:** 8/8 tests passed with detailed results
- **Issues fixed:** Problems encountered and resolved during testing
- **Recommendations:** Next steps for production and development
- **Target audience:** QA teams, developers, stakeholders

#### 🎯 **Implementation Summary** (`docs/IMPLEMENTATION_SUMMARY.md`)
- **What it covers:** Project completion status and achievements
- **Feature delivery:** Complete Components v2 implementation
- **Technical details:** Architecture, code changes, key features
- **Next steps:** Production deployment and development guidance
- **Target audience:** Project managers, stakeholders, technical leads

#### 🧹 **Cleanup Summary** (`docs/CLEANUP_SUMMARY.md`)
- **What it covers:** Configuration cleanup and optimization
- **Removed items:** Unnecessary environment variables and configurations
- **Impact analysis:** No functionality lost, cleaner configuration
- **Optimization results:** Easier setup and better maintainability
- **Target audience:** Developers, maintainers, system administrators

### 🔍 **Finding What You Need**

**Need to set up the server?** → Start with [Setup Guide](./docs/SETUP_GUIDE.md)
**Want to use Components v2?** → Read [Components v2 Guide](./docs/COMPONENTS_V2_GUIDE.md)
**Deploying to production?** → Follow [Deployment Guide](./docs/DEPLOYMENT_SECURE.md)
**Security concerns?** → Check [Security Summary](./docs/SECURITY_SUMMARY.md)
**Having issues?** → Review [Test Results](./docs/TEST_RESULTS.md) and [Test Report](./docs/TEST_REPORT.md)
**Want to understand the project?** → Read [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)

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
