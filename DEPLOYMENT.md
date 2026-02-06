# Deployment Guide - Project Management Tool

This guide will help you deploy the Project Management Tool to a live server with MySQL database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Production Build](#production-build)
7. [Process Management](#process-management)
8. [Nginx Configuration](#nginx-configuration)
9. [SSL/HTTPS Setup](#sslhttps-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04 LTS or later (recommended)
- **Node.js**: Version 18.x or later
- **MySQL**: Version 8.0 or later
- **Nginx**: Latest stable version (for reverse proxy)
- **PM2**: Process manager for Node.js (recommended)
- **Domain Name**: (Optional but recommended for production)

### Software Installation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version
npm --version
mysql --version
nginx -v
pm2 --version
```

---

## Server Setup

### 1. Create Application User

```bash
# Create a new user for the application (optional but recommended)
sudo adduser projectmanager
sudo usermod -aG sudo projectmanager

# Switch to the new user
su - projectmanager
```

### 2. Clone/Upload Project

```bash
# If using Git
git clone <your-repository-url> project-management
cd project-management

# Or upload your project files to the server
# Recommended location: /home/projectmanager/project-management
```

### 3. Install Dependencies

```bash
cd /home/projectmanager/project-management
npm install
```

---

## Database Setup

### 1. Secure MySQL Installation

```bash
# Run MySQL secure installation
sudo mysql_secure_installation

# Follow the prompts:
# - Set root password
# - Remove anonymous users
# - Disallow root login remotely
# - Remove test database
```

### 2. Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE project_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER 'pm_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON project_management.* TO 'pm_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Initialize Database Schema

```bash
# Run the schema script
mysql -u pm_user -p project_management < database/schema.sql

# Or manually run SQL commands
mysql -u pm_user -p project_management
```

```sql
-- Verify table creation
SHOW TABLES;
DESCRIBE tickets;
EXIT;
```

---

## Environment Configuration

### 1. Create Environment File

```bash
cd /home/projectmanager/project-management
cp .env.example .env
nano .env
```

### 2. Configure Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=pm_user
DB_PASSWORD=your_secure_password_here
DB_NAME=project_management

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Production Environment
NODE_ENV=production
```

### 3. Secure Environment File

```bash
# Set proper permissions
chmod 600 .env

# Verify .env is in .gitignore
cat .gitignore | grep .env
```

---

## Production Build

### 1. Build the Application

```bash
cd /home/projectmanager/project-management

# Build for production
npm run build

# Verify build was successful
ls -la .next
```

### 2. Test Production Build Locally

```bash
# Start production server
npm start

# Test in browser (if accessible)
# http://your-server-ip:3000
```

---

## Process Management

### 1. Setup PM2

```bash
cd /home/projectmanager/project-management

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'project-management',
    script: 'npm',
    args: 'start',
    cwd: '/home/projectmanager/project-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF
```

### 2. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command

# Check application status
pm2 status
pm2 logs project-management
```

### 3. PM2 Useful Commands

```bash
# View logs
pm2 logs project-management

# Restart application
pm2 restart project-management

# Stop application
pm2 stop project-management

# Monitor application
pm2 monit
```

---

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/project-management
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For initial setup, use this:
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
    }
}
```

### 2. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Or individually
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 3. Update Nginx Configuration

Certbot will automatically update your Nginx configuration. Verify:

```bash
sudo nano /etc/nginx/sites-available/project-management
```

### 4. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up renewal via cron
# Check renewal status
sudo systemctl status certbot.timer
```

---

## Additional Security

### 1. Update .env with HTTPS URL

```bash
nano /home/projectmanager/project-management/.env
```

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Restart the application:
```bash
pm2 restart project-management
```

### 2. Database Security

```bash
# Ensure MySQL only listens on localhost
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Ensure:
```ini
bind-address = 127.0.0.1
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### 3. Regular Backups

Create a backup script:

```bash
nano /home/projectmanager/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/projectmanager/backups"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u pm_user -p'your_password' project_management > $BACKUP_DIR/db_$DATE.sql

# Backup application files (optional)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/projectmanager/project-management

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
chmod +x /home/projectmanager/backup.sh
```

Add to crontab:
```bash
crontab -e
```

Add:
```
0 2 * * * /home/projectmanager/backup.sh
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs project-management

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Check Node.js version
node --version

# Rebuild application
cd /home/projectmanager/project-management
rm -rf .next node_modules
npm install
npm run build
pm2 restart project-management
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u pm_user -p project_management

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Verify environment variables
cd /home/projectmanager/project-management
cat .env | grep DB_
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### Permission Issues

```bash
# Fix file permissions
cd /home/projectmanager/project-management
sudo chown -R projectmanager:projectmanager .

# Fix .env permissions
chmod 600 .env
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiration
sudo certbot certificates | grep Expiry
```

---

## Monitoring

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View real-time logs
pm2 logs project-management --lines 100

# Check application metrics
pm2 describe project-management
```

### 2. System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check MySQL status
sudo systemctl status mysql
```

---

## Maintenance

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /home/projectmanager/project-management
npm update

# Rebuild and restart
npm run build
pm2 restart project-management
```

### Database Maintenance

```bash
# Optimize database
mysql -u pm_user -p project_management -e "OPTIMIZE TABLE tickets;"

# Check database size
mysql -u pm_user -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'project_management';"
```

---

## Quick Reference

### Important Commands

```bash
# Application
pm2 start ecosystem.config.js
pm2 restart project-management
pm2 logs project-management
pm2 stop project-management

# Database
mysql -u pm_user -p project_management
mysqldump -u pm_user -p project_management > backup.sql

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx

# SSL
sudo certbot renew
sudo certbot certificates
```

### Important File Locations

- Application: `/home/projectmanager/project-management`
- Environment: `/home/projectmanager/project-management/.env`
- Nginx Config: `/etc/nginx/sites-available/project-management`
- PM2 Config: `/home/projectmanager/project-management/ecosystem.config.js`
- Logs: `~/.pm2/logs/`

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs: `pm2 logs project-management`
3. Check system logs: `journalctl -xe`
4. Verify all services are running: `sudo systemctl status nginx mysql`

---

**Deployment completed successfully!** 🎉

Your application should now be accessible at `https://yourdomain.com` (or `http://your-server-ip` if SSL is not configured yet).
