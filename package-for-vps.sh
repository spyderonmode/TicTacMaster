#!/bin/bash

# TicTac 3x5 VPS Packaging Script

echo "📦 Preparing TicTac 3x5 for VPS deployment..."

# Create deployment directory
mkdir -p tictac-vps-deploy
cd tictac-vps-deploy

# Copy necessary files
echo "📋 Copying project files..."

# Copy main directories with all game logic
cp -r ../client ./
cp -r ../server ./
cp -r ../shared ./

# Copy configuration files
cp ../package.json ./
cp ../package-lock.json ./
cp ../tsconfig.json ./
cp ../vite.config.ts ./
cp ../tailwind.config.ts ./
cp ../postcss.config.js ./
cp ../components.json ./
cp ../drizzle.config.ts ./
cp ../ecosystem.config.js ./
cp ../deployment-guide.md ./

# Copy additional files if they exist
[ -f ../.gitignore ] && cp ../.gitignore ./
[ -f ../README.md ] && cp ../README.md ./
[ -f ../replit.md ] && cp ../replit.md ./

echo "✅ Copied all project files including:"
echo "   🎮 Game Logic: server/gameLogic.ts, server/aiPlayer.ts"
echo "   🎯 Game Components: client/src/components/GameBoard.tsx, RoomManager.tsx"
echo "   🔄 Real-time: server/routes.ts (WebSocket), client/src/hooks/useWebSocket.ts"
echo "   🎵 Audio: client/src/hooks/useAudio.ts"
echo "   🔐 Auth: server/auth.ts, server/emailService.ts"
echo "   💾 Database: server/storage.ts, shared/schema.ts"

# Create production scripts
echo "⚙️ Creating production scripts..."

# Create production build script
cat > build-production.sh << 'EOF'
#!/bin/bash
echo "🏗️ Building TicTac 3x5 for production..."

# Install dependencies
npm install --production=false

# Build the application
npm run build

# Install only production dependencies
npm prune --production

echo "✅ Production build complete!"
EOF

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying TicTac 3x5..."

# Set production environment
export NODE_ENV=production

# Run database migrations
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
EOF

# Create environment template
cat > .env.template << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Session Security
SESSION_SECRET=your_very_secure_session_secret_change_this

# SMTP Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com

# Domain Configuration
REPLIT_DOMAIN=https://yourdomain.com
EOF

# Create Nginx configuration template
cat > nginx.conf.template << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

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
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
EOF

# Create database backup script
cat > backup-database.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tictac"
mkdir -p $BACKUP_DIR

# Load environment variables
source .env

# Extract database details from DATABASE_URL
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Could not parse DATABASE_URL"
    exit 1
fi

# Create backup
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME > $BACKUP_DIR/tictac_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "tictac_backup_*.sql" -mtime +7 -delete

echo "✅ Database backup created: tictac_backup_$DATE.sql"
EOF

# Create update script
cat > update-app.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating TicTac 3x5 application..."

# Stop application
pm2 stop tictac-app

# Pull latest changes (if using git)
# git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run database migrations
npm run db:push

# Restart application
pm2 restart tictac-app

echo "✅ Application updated successfully!"
EOF

# Create systemd service file
cat > tictac.service << 'EOF'
[Unit]
Description=TicTac 3x5 Application
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/var/www/tictac
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
PIDFile=/var/www/tictac/.pm2/pm2.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Make scripts executable
chmod +x build-production.sh
chmod +x deploy.sh
chmod +x backup-database.sh
chmod +x update-app.sh

# Create README for VPS deployment
cat > README-VPS.md << 'EOF'
# TicTac 3x5 VPS Deployment Package

## Quick Start

1. **Upload this folder to your VPS**
   ```bash
   scp -r tictac-vps-deploy/ user@your-server:/var/www/tictac/
   ```

2. **Connect to your VPS**
   ```bash
   ssh user@your-server
   cd /var/www/tictac
   ```

3. **Configure environment**
   ```bash
   cp .env.template .env
   nano .env  # Edit with your settings
   ```

4. **Build and deploy**
   ```bash
   ./build-production.sh
   ./deploy.sh
   ```

5. **Configure Nginx** (copy nginx.conf.template to /etc/nginx/sites-available/)

6. **Setup SSL** with Let's Encrypt

## Important Files

- `deployment-guide.md` - Complete deployment instructions
- `.env.template` - Environment configuration template
- `nginx.conf.template` - Nginx configuration template
- `ecosystem.config.js` - PM2 process configuration
- `build-production.sh` - Production build script
- `deploy.sh` - Deployment script
- `backup-database.sh` - Database backup script
- `update-app.sh` - Application update script

## Support

Refer to `deployment-guide.md` for detailed instructions and troubleshooting.
EOF

echo "✅ VPS deployment package created in 'tictac-vps-deploy' folder!"
echo ""
echo "📁 Package contents:"
echo "   - Complete application source code"
echo "   - Production configuration files"
echo "   - Deployment scripts"
echo "   - Nginx configuration template"
echo "   - Database backup tools"
echo "   - Comprehensive deployment guide"
echo ""
echo "🚀 Ready to deploy to your VPS!"
echo "   1. Upload the 'tictac-vps-deploy' folder to your server"
echo "   2. Follow the instructions in README-VPS.md"
echo "   3. Use deployment-guide.md for detailed setup"