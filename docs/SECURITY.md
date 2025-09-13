# 🔒 Security Guide - Discord MCP Server

## Overview

This Discord MCP Server implements **enterprise-grade security** with multiple layers of protection to ensure your Discord bot tokens and credentials remain secure.

## 🛡️ Security Layers

### 1. **Environment-Based Security Levels**

The server automatically adjusts security based on your environment:

| Environment | Security Level | Rate Limit | API Key Required | CORS |
|-------------|----------------|------------|------------------|------|
| `development` | Medium | 500/5min | Yes | Localhost only |
| `test` | Low | 1000/1min | No | All origins |
| `production` | Maximum | 50/30min | Yes | Specific domains |

### 2. **Credential Protection**

#### Environment Variables
- All sensitive data stored in `.env` file
- `.env` file excluded from version control
- Environment validation on startup
- Secure defaults for missing values

#### Encryption
- **AES-256-GCM** encryption for sensitive data
- **PBKDF2** with 100,000 iterations for password hashing
- **Cryptographically secure** random key generation
- **Authenticated encryption** with integrity verification

### 3. **Request Security**

#### HMAC Signature Verification
All webhook requests require valid HMAC-SHA256 signatures:

```javascript
const crypto = require('crypto');
const payload = JSON.stringify(data);
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
```

#### Rate Limiting
- **Global rate limiting** per IP address
- **Endpoint-specific limits** for sensitive operations
- **User-Agent based** tracking for additional security
- **Automatic IP blocking** for repeated violations

#### Request Validation
- **Payload size limits** (1MB in production)
- **Content-Type validation**
- **Input sanitization** and XSS prevention
- **Discord ID format validation**

### 4. **Network Security**

#### CORS Configuration
```javascript
// Production - Restrictive
origin: ['https://yourdomain.com']

// Development - Permissive
origin: ['http://localhost:3000', 'http://localhost:8080']
```

#### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 5. **Access Control**

#### API Key Authentication
```bash
curl -H "X-API-Key: your_api_key_here" \
     -H "X-Webhook-Signature: your_signature" \
     http://localhost:3000/api/webhook/send
```

#### IP Whitelisting
Admin endpoints restricted to trusted IPs:
```javascript
adminIPWhitelist = [
  '127.0.0.1',    // Localhost
  '192.168.1.100', // Your office IP
  '10.0.0.50'     // Your server IP
];
```

### 6. **Logging & Monitoring**

#### Secure Logging
- **Sensitive data masking** in logs
- **Request/response logging** with timing
- **Security event logging**
- **Structured JSON logs** for analysis

#### Security Events Logged
- Invalid webhook signatures
- Rate limit violations
- Unauthorized IP access attempts
- Failed authentication attempts
- Large payload attempts

## 🔐 Credential Security Best Practices

### 1. **Environment File Security**

```bash
# Set restrictive permissions
chmod 600 .env
chown root:root .env

# Never commit to version control
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

### 2. **Secret Generation**

Use the provided script for secure secrets:
```bash
node scripts/generate-secrets.js
```

**Output:**
```
WEBHOOK_SECRET=a1b2c3d4e5f6...
API_KEY=1234567890abcdef
ENCRYPTION_KEY=abcdef1234567890...
```

### 3. **Discord Bot Security**

#### Bot Token Protection
- Store in `.env` file only
- Never log or expose in error messages
- Use environment variables in code
- Rotate tokens regularly

#### Bot Permissions
Minimal required permissions:
```
Manage Channels: ✅ (for channel management)
Manage Roles: ✅ (for role management)
Manage Webhooks: ✅ (for webhook creation)
Send Messages: ✅ (for webhook messages)
```

### 4. **Network Security**

#### Production Deployment
```bash
# Use reverse proxy (Nginx/Apache)
upstream discord_mcp {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://discord_mcp;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 443/tcp  # HTTPS
ufw allow 22/tcp   # SSH
ufw deny 3000/tcp  # Block direct access to app
```

## 🚨 Security Incident Response

### 1. **Token Compromise**

If Discord bot token is compromised:

1. **Immediately regenerate** token in Discord Developer Portal
2. **Update** `.env` file with new token
3. **Restart** the server
4. **Review logs** for unauthorized access
5. **Audit** recent bot actions

### 2. **Unauthorized Access**

If you detect unauthorized access:

1. **Block** suspicious IP addresses
2. **Rotate** all secrets and API keys
3. **Review** server logs for attack patterns
4. **Update** security configurations
5. **Notify** relevant stakeholders

### 3. **Rate Limit Abuse**

If experiencing rate limit abuse:

1. **Lower** rate limit thresholds
2. **Implement** IP-based blocking
3. **Add** CAPTCHA for sensitive endpoints
4. **Monitor** traffic patterns
5. **Consider** DDoS protection

## 🔍 Security Monitoring

### 1. **Log Analysis**

Monitor these log patterns:
```bash
# Failed authentication attempts
grep "Invalid webhook signature" logs/error.log

# Rate limit violations
grep "Rate limit exceeded" logs/discord-mcp.log

# Large payload attempts
grep "Request too large" logs/discord-mcp.log
```

### 2. **Health Checks**

Regular security health checks:
```bash
# Check server security status
curl -H "X-API-Key: your_key" http://localhost:3000/api/status

# Verify rate limiting
for i in {1..10}; do curl http://localhost:3000/health; done
```

### 3. **Automated Monitoring**

Set up monitoring for:
- Failed authentication attempts
- Unusual traffic patterns
- High error rates
- Memory/CPU spikes
- Disk space usage

## 📋 Security Checklist

### Pre-Deployment
- [ ] All secrets generated with secure random values
- [ ] Environment variables properly configured
- [ ] Bot permissions set to minimum required
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed
- [ ] Log rotation configured
- [ ] Backup strategy implemented

### Post-Deployment
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Authentication working
- [ ] Logging functioning
- [ ] Health checks responding
- [ ] Monitoring alerts configured

### Regular Maintenance
- [ ] Rotate secrets monthly
- [ ] Update dependencies weekly
- [ ] Review logs daily
- [ ] Test backup restoration monthly
- [ ] Security audit quarterly

## 🆘 Emergency Procedures

### 1. **Server Compromise**

```bash
# Immediately stop server
pm2 stop discord-mcp

# Block all traffic
ufw deny 3000/tcp

# Rotate all secrets
node scripts/generate-secrets.js

# Update environment
nano .env

# Restart with new secrets
pm2 start discord-mcp
```

### 2. **Token Leak**

```bash
# Generate new Discord token in portal
# Update .env file
# Restart server
pm2 restart discord-mcp

# Verify bot is working
curl http://localhost:3000/health
```

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Discord Bot Security Best Practices](https://discord.com/developers/docs/topics/oauth2)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures to stay protected against evolving threats.
