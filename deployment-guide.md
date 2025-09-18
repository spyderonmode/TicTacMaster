# TicTac 3x5 VPS Deployment Guide

## Overview
This guide will help you deploy your TicTac 3x5 application to your VPS with proper production configuration.

## Prerequisites
- Ubuntu/Debian VPS with root access
- Domain name pointed to your VPS IP
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database
- SMTP email service credentials

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Required Software
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Database Setup

### Create Database and User
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE tictac_db;
CREATE USER tictac_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tictac_db TO tictac_user;
\q
```

## Step 3: Application Deployment

### Create App Directory
```bash
sudo mkdir -p /var/www/tictac
sudo chown $USER:$USER /var/www/tictac
```

### Upload and Extract Project
```bash
# Upload your project files to /var/www/tictac
cd /var/www/tictac

# Install dependencies
npm install

# Build the application
npm run build
```

### Create Production Environment File
```bash
nano .env.production
```

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_very_secure_session_secret_here
DATABASE_URL=postgresql://tictac_user:your_secure_password@localhost:5432/tictac_db

# SMTP Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com

# Domain Configuration
REPLIT_DOMAIN=https://yourdomain.com
```

### Database Migration
```bash
npm run db:push
```

## Step 4: PM2 Configuration

### Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'tictac-app',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Start Application with PM2
```bash
# Create logs directory
mkdir logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Step 5: Nginx Configuration

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/tictac
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/tictac /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: SSL Certificate

### Install Let's Encrypt Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7: Firewall Configuration

### Setup UFW Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 8: Monitoring and Logs

### View Application Logs
```bash
pm2 logs tictac-app
```

### Monitor Application
```bash
pm2 monit
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 9: Backup Strategy

### Database Backup Script
```bash
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tictac"
mkdir -p $BACKUP_DIR

pg_dump -U tictac_user -h localhost tictac_db > $BACKUP_DIR/tictac_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tictac_backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x backup-db.sh
# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/tictac/backup-db.sh") | crontab -
```

## Step 10: Application Updates

### Update Script
```bash
nano update-app.sh
```

```bash
#!/bin/bash
cd /var/www/tictac

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run database migrations
npm run db:push

# Restart application
pm2 restart tictac-app
```

```bash
chmod +x update-app.sh
```

## Troubleshooting

### Common Issues:

1. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check firewall rules

2. **Application Won't Start**
   - Check PM2 logs: `pm2 logs tictac-app`
   - Verify environment variables
   - Check port availability

3. **Nginx Issues**
   - Test configuration: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify proxy settings

4. **SSL Certificate Issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

## Security Recommendations

1. **Regular Updates**: Keep system and dependencies updated
2. **Strong Passwords**: Use secure passwords for database and session secret
3. **Firewall**: Only open necessary ports
4. **Monitoring**: Set up log monitoring and alerts
5. **Backups**: Regular automated backups
6. **SSL**: Always use HTTPS in production

## Performance Optimization

1. **Enable Gzip**: Add gzip compression in Nginx
2. **Database Indexes**: Optimize database queries
3. **Static Assets**: Use CDN for static files
4. **Connection Pooling**: Configure database connection pooling
5. **Caching**: Implement Redis for session storage

Your TicTac 3x5 application is now ready for production deployment!