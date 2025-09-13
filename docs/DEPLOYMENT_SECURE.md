# 🚀 Secure Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Discord MCP Server with maximum security in a production environment.

## 🔒 Security-First Deployment

### 1. **Server Preparation**

#### Create Dedicated User
```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash discord-mcp
sudo usermod -aG sudo discord-mcp

# Switch to the user
sudo su - discord-mcp
```

#### Secure Directory Structure
```bash
# Create secure application directory
mkdir -p /home/discord-mcp/app
cd /home/discord-mcp/app

# Set proper permissions
chmod 700 /home/discord-mcp
chmod 755 /home/discord-mcp/app
```

### 2. **Environment Setup**

#### Install Node.js Securely
```bash
# Install Node.js via NodeSource (more secure than snap)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install additional security tools
sudo apt-get install -y fail2ban ufw
```

#### Configure Firewall
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Check status
sudo ufw status
```

### 3. **Application Deployment**

#### Clone and Setup
```bash
# Clone your repository
git clone https://github.com/yourusername/discord-MCP.git
cd discord-MCP

# Install dependencies
npm ci --only=production

# Generate secrets
node scripts/generate-secrets.js > .env.temp
```

#### Configure Environment
```bash
# Create secure .env file
cp .env.example .env
nano .env

# Set restrictive permissions
chmod 600 .env
chown discord-mcp:discord-mcp .env
```

**Production .env example:**
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_production_discord_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Server Configuration
PORT=3000
NODE_ENV=production
HOST=127.0.0.1  # Bind to localhost only

# Security Configuration (Generated)
WEBHOOK_SECRET=your_64_character_webhook_secret
API_KEY=your_32_character_api_key
ENCRYPTION_KEY=your_32_character_encryption_key

# Rate Limiting (Strict for production)
RATE_LIMIT_WINDOW_MS=1800000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=warn
LOG_FILE_PATH=/home/discord-mcp/logs/discord-mcp.log

# Feature Flags
ENABLE_CHANNEL_MANAGEMENT=true
ENABLE_ROLE_MANAGEMENT=true
ENABLE_WEBHOOK_SYSTEM=true
ENABLE_SERVER_CONFIG=true
```

### 4. **Nginx Reverse Proxy**

#### Install and Configure Nginx
```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/discord-mcp
```

**Nginx Configuration:**
```nginx
upstream discord_mcp {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/m;
    
    # Hide Nginx version
    server_tokens off;
    
    # Logging
    access_log /var/log/nginx/discord-mcp.access.log;
    error_log /var/log/nginx/discord-mcp.error.log;
    
    location / {
        # Rate limiting
        limit_req zone=api burst=5 nodelay;
        
        # Proxy to application
        proxy_pass http://discord_mcp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /api/webhook/send {
        # Stricter rate limiting for webhooks
        limit_req zone=webhook burst=2 nodelay;
        
        proxy_pass http://discord_mcp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Block access to sensitive files
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
    
    location ~ \.(log|sql|db)$ {
        deny all;
        return 404;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Enable Site and SSL
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/discord-mcp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 5. **PM2 Configuration**

#### Enhanced PM2 Setup
```bash
# Create logs directory
mkdir -p /home/discord-mcp/logs
chmod 755 /home/discord-mcp/logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Enable PM2 monitoring (optional)
pm2 install pm2-server-monit
```

#### PM2 Log Rotation
```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### 6. **System Security**

#### Fail2Ban Configuration
```bash
# Configure Fail2Ban for Nginx
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[discord-mcp-api]
enabled = true
port = http,https
filter = discord-mcp-api
logpath = /home/discord-mcp/logs/discord-mcp.log
maxretry = 5
bantime = 7200
```

**Create custom filter:**
```bash
sudo nano /etc/fail2ban/filter.d/discord-mcp-api.conf
```

```ini
[Definition]
failregex = ^.*Invalid webhook signature.*$
            ^.*Rate limit exceeded.*$
            ^.*Invalid API key.*$
ignoreregex =
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Create monitoring script
nano /home/discord-mcp/monitor.sh
```

**Monitoring Script:**
```bash
#!/bin/bash
# Discord MCP Server Monitoring Script

LOG_FILE="/home/discord-mcp/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting health check..." >> $LOG_FILE

# Check if PM2 process is running
if pm2 list | grep -q "discord-mcp.*online"; then
    echo "[$DATE] PM2 process is running" >> $LOG_FILE
else
    echo "[$DATE] WARNING: PM2 process is not running!" >> $LOG_FILE
    # Attempt to restart
    pm2 restart discord-mcp
fi

# Check disk space
DISK_USAGE=$(df /home/discord-mcp | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check application health
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $HTTP_STATUS -ne 200 ]; then
    echo "[$DATE] WARNING: Application health check failed (HTTP $HTTP_STATUS)" >> $LOG_FILE
fi

echo "[$DATE] Health check completed" >> $LOG_FILE
```

```bash
# Make script executable
chmod +x /home/discord-mcp/monitor.sh

# Add to crontab for regular monitoring
crontab -e
# Add this line:
*/5 * * * * /home/discord-mcp/monitor.sh
```

### 7. **Backup Strategy**

#### Automated Backups
```bash
# Create backup script
nano /home/discord-mcp/backup.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/discord-mcp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="discord-mcp-backup-$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup (excluding logs and node_modules)
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    --exclude='*.log' \
    -C /home/discord-mcp discord-MCP

# Keep only last 7 days of backups
find $BACKUP_DIR -name "discord-mcp-backup-*.tar.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
```

```bash
# Make executable and add to crontab
chmod +x /home/discord-mcp/backup.sh
crontab -e
# Add this line for daily backups at 2 AM:
0 2 * * * /home/discord-mcp/backup.sh
```

### 8. **Security Verification**

#### Test Security Measures
```bash
# Test rate limiting
for i in {1..10}; do curl -I https://yourdomain.com/health; done

# Test SSL configuration
curl -I https://yourdomain.com

# Test API authentication
curl -H "X-API-Key: invalid_key" https://yourdomain.com/api/status

# Check security headers
curl -I https://yourdomain.com | grep -i "x-"
```

#### Security Audit Checklist
- [ ] SSL certificate installed and valid
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] API authentication required
- [ ] Logs not exposing sensitive data
- [ ] Firewall configured
- [ ] Fail2Ban active
- [ ] Monitoring in place
- [ ] Backups scheduled
- [ ] File permissions correct

## 🔄 Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update Node.js dependencies
cd /home/discord-mcp/discord-MCP
npm audit
npm update

# Restart application
pm2 restart discord-mcp
```

### Log Rotation
```bash
# Configure system log rotation
sudo nano /etc/logrotate.d/discord-mcp
```

```bash
/home/discord-mcp/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 discord-mcp discord-mcp
}
```

## 🆘 Emergency Response

### Incident Response Plan
1. **Immediate Response**
   - Stop the application: `pm2 stop discord-mcp`
   - Block suspicious IPs: `sudo ufw deny from <IP>`
   - Check logs: `tail -f /home/discord-mcp/logs/discord-mcp.log`

2. **Investigation**
   - Analyze access logs
   - Check for unauthorized changes
   - Review security events

3. **Recovery**
   - Rotate all secrets
   - Restore from backup if needed
   - Restart with new configuration

### Contact Information
- **Server Admin**: admin@yourdomain.com
- **Discord Bot Owner**: bot-owner@yourdomain.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

---

This deployment guide ensures your Discord MCP Server is deployed with enterprise-grade security measures. Regular maintenance and monitoring are essential for maintaining security over time.
