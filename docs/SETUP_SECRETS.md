# 🔐 Setting Up Secrets for Discord MCP Server

This guide will help you generate the required secrets for your Discord MCP Server.

## 📋 Required Secrets

You need to generate the following secrets for your `.env` file:

- `WEBHOOK_SECRET` - 64-character webhook signature secret
- `API_KEY` - 32-character API key for authentication
- `ENCRYPTION_KEY` - 32-character encryption key for data security

## 🚀 Quick Setup

### Option 1: Use the Built-in Generator

Run the secret generator script:

```bash
node scripts/generate-secrets.js
```

This will output something like:
```
🔐 Discord MCP Server - Secret Generator
=======================================

WEBHOOK_SECRET=8fa08fb8ae49fea5ba3ff9274792d4d02f4a945c360f896ad3408a487936a7d9
API_KEY=2c97f6ee2f3cd7756e2937fd9abb2626
ENCRYPTION_KEY=a24bbad8d8f74f7a40df5fa23bc57c38

📝 Copy these values to your .env file
⚠️  Keep these secrets secure and never commit them to version control!
```

### Option 2: Manual Generation

You can also generate secrets manually using various methods:

#### Using Node.js
```bash
node -e "console.log('WEBHOOK_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('API_KEY=' + require('crypto').randomBytes(16).toString('hex')); console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'));"
```

#### Using OpenSSL
```bash
# Webhook Secret (64 characters)
openssl rand -hex 32

# API Key (32 characters)
openssl rand -hex 16

# Encryption Key (32 characters)
openssl rand -hex 16
```

#### Using Online Generators
- Use a secure password generator
- Ensure WEBHOOK_SECRET is 64 characters
- Ensure API_KEY is 32 characters
- Ensure ENCRYPTION_KEY is 32 characters

## 📝 Setting Up Your .env File

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit your .env file:**
   ```bash
   nano .env
   # or
   code .env
   ```

3. **Replace the placeholder values:**
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_actual_discord_bot_token_here
   DISCORD_CLIENT_ID=your_actual_discord_client_id_here
   DISCORD_CLIENT_SECRET=your_actual_discord_client_secret_here

   # Security Configuration (Generated)
   WEBHOOK_SECRET=your_generated_webhook_secret_here
   API_KEY=your_generated_api_key_here
   ENCRYPTION_KEY=your_generated_encryption_key_here
   ```

## 🔒 Security Best Practices

### ✅ Do:
- Generate unique secrets for each environment
- Use strong, random secrets
- Store secrets securely
- Rotate secrets regularly
- Use environment-specific configurations

### ❌ Don't:
- Use the same secrets across environments
- Use weak or predictable secrets
- Commit secrets to version control
- Share secrets in plain text
- Use default or example values in production

## 🚨 Important Notes

1. **Never commit your .env file** - It's already in .gitignore
2. **Keep secrets secure** - Anyone with these secrets can access your server
3. **Use different secrets** for development, staging, and production
4. **Rotate secrets regularly** - Especially if compromised
5. **Backup secrets securely** - Store them in a secure password manager

## 🔧 Environment-Specific Setup

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
# Use generated secrets
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
# Use strong, unique secrets
# Consider using a secrets management service
```

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid webhook signature"**
   - Check that WEBHOOK_SECRET is exactly 64 characters
   - Ensure the secret matches what's used in your webhook requests

2. **"Invalid API key"**
   - Check that API_KEY is exactly 32 characters
   - Ensure the key matches what's sent in the X-API-Key header

3. **"Invalid encryption key"**
   - Check that ENCRYPTION_KEY is exactly 32 characters
   - Ensure the key is properly formatted

### Verification

Test your setup by running:
```bash
npm run build
npm start
```

The server should start without security validation errors.

## 📚 Additional Resources

- [Discord Bot Setup Guide](https://discord.com/developers/docs/getting-started)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Remember:** Security is crucial for your Discord MCP Server. Take time to generate strong, unique secrets and keep them secure! 🔐
