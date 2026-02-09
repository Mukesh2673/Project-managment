# Deploying to Render.com

This guide will help you deploy the Project Management Tool to Render.com.

## Prerequisites

- A Render.com account (sign up at [render.com](https://render.com))
- A MySQL database (Aiven, Render PostgreSQL, or external MySQL)
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Quick Start

### Option 1: Using render.yaml (Recommended)

1. **Push your code to Git** (if not already done)
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect `render.yaml`

3. **Configure Environment Variables**
   - In the Render Dashboard, go to your service
   - Navigate to "Environment" tab
   - Add the following variables (see [Environment Variables](#environment-variables) section)

4. **Deploy**
   - Render will automatically build and deploy
   - Migrations will run automatically after build

### Option 2: Manual Setup

1. **Create a New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure Build Settings**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **Set Environment Variables** (see below)

4. **Deploy**

## Environment Variables

Set these in the Render Dashboard under your service's "Environment" tab:

### Required Database Variables

```env
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

### For Aiven MySQL (with SSL)

```env
DB_HOST=mysql-xxxxx-xxxxx-xxxxx.j.aivencloud.com
DB_PORT=15369
DB_USER=avnadmin
DB_PASSWORD=AVNS_xxxxxxxxxxxxx
DB_NAME=defaultdb
DB_SSL_MODE=REQUIRED
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Next.js Configuration

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
PORT=10000
```

**Note**: Render automatically sets `PORT`, but you can explicitly set it to `10000`.

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to Git:
```bash
git status
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. Create Web Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Render will auto-detect settings from `render.yaml` if present

### 3. Configure Service Settings

If not using `render.yaml`, configure manually:

- **Name**: `project-management-app` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or specify if your app is in a subdirectory)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4. Set Environment Variables

In the Render Dashboard, go to your service → "Environment" tab:

#### Database Configuration
```
DB_HOST=mysql-xxxxx.j.aivencloud.com
DB_PORT=15369
DB_USER=avnadmin
DB_PASSWORD=AVNS_xxxxxxxxxxxxx
DB_NAME=defaultdb
```

#### SSL Configuration (for Aiven)
```
DB_SSL_MODE=REQUIRED
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

#### Application Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
PORT=10000
```

### 5. Deploy

1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the application (`npm run build`)
   - Run post-build migrations (`npm run postbuild`)
   - Start the application (`npm start`)

### 6. Verify Deployment

1. Wait for the build to complete (usually 3-5 minutes)
2. Check the "Logs" tab for any errors
3. Visit your app URL: `https://your-app-name.onrender.com`
4. Test creating a ticket to verify database connection

## Database Setup

### Using Aiven MySQL (Recommended)

1. **Create Aiven Account**
   - Sign up at [aiven.io](https://aiven.io)
   - Create a MySQL service

2. **Get Connection Details**
   - Copy the Service URI or individual connection details
   - Use these in your Render environment variables

3. **Run Migrations**
   - Migrations run automatically after build via `postbuild` script
   - Or run manually using Render Shell:
     ```bash
     npm run migrate
     ```

### Using Render PostgreSQL (Alternative)

If you prefer PostgreSQL:

1. **Create PostgreSQL Database**
   - In Render Dashboard: "New +" → "PostgreSQL"
   - Note the connection details

2. **Update Code**
   - You'll need to modify `lib/db.ts` to use PostgreSQL instead of MySQL
   - Or use a database abstraction layer like Prisma

### Using External MySQL

You can use any MySQL database:
- AWS RDS
- DigitalOcean Managed Database
- Your own MySQL server

Just configure the connection details in environment variables.

## Running Migrations

### Automatic (Recommended)

Migrations run automatically after each build via the `postbuild` script.

### Manual

If you need to run migrations manually:

1. **Using Render Shell**
   - Go to your service in Render Dashboard
   - Click "Shell" tab
   - Run: `npm run migrate`

2. **Using Render CLI**
   ```bash
   # Install Render CLI
   npm install -g render-cli
   
   # Login
   render login
   
   # Run migrations
   render exec -s your-service-name -- npm run migrate
   ```

## Custom Domain

1. **In Render Dashboard**
   - Go to your service
   - Click "Settings" → "Custom Domains"
   - Add your domain

2. **Update Environment Variable**
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Configure DNS**
   - Add a CNAME record pointing to your Render service
   - Render will provide the exact DNS configuration

## Monitoring & Logs

### View Logs
- Go to your service in Render Dashboard
- Click "Logs" tab
- View real-time application logs

### Health Checks
- Render automatically checks your app at the root path (`/`)
- Ensure your app responds to GET requests at `/`

## Troubleshooting

### Build Fails

**Error: Module not found**
- Ensure all dependencies are in `package.json`
- Check that `tsx` is in `devDependencies` (needed for migrations)

**Error: TypeScript errors**
- Fix TypeScript errors locally first
- Run `npm run build` locally to verify

### Application Won't Start

**Error: Port already in use**
- Render sets `PORT` automatically
- Don't hardcode port numbers in your code

**Error: Database connection failed**
- Verify environment variables are set correctly
- Check database is accessible from Render's IPs
- For Aiven, ensure SSL is configured

### Migrations Fail

**Error: Migration script not found**
- Ensure `tsx` is installed (in `devDependencies`)
- Check `scripts/postbuild.ts` exists

**Error: Database doesn't exist**
- The `postbuild` script creates the database automatically
- If it fails, create the database manually in your MySQL provider

### Database Connection Issues

**SSL Certificate Errors**
- Set `DB_SSL_REJECT_UNAUTHORIZED=false` for Aiven
- Or provide CA certificate path in `DB_SSL_CA`

**Connection Timeout**
- Check database allows connections from Render's IPs
- Verify firewall rules
- For Aiven, check service is running

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_HOST` | Yes | Database hostname | `mysql-xxx.j.aivencloud.com` |
| `DB_PORT` | Yes | Database port | `15369` |
| `DB_USER` | Yes | Database username | `avnadmin` |
| `DB_PASSWORD` | Yes | Database password | `AVNS_xxxxx` |
| `DB_NAME` | Yes | Database name | `defaultdb` |
| `DB_SSL_MODE` | For Aiven | SSL mode | `REQUIRED` |
| `DB_SSL` | For Aiven | Enable SSL | `true` |
| `DB_SSL_REJECT_UNAUTHORIZED` | For Aiven | Reject unauthorized | `false` |
| `NODE_ENV` | Yes | Environment | `production` |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL | `https://app.onrender.com` |
| `PORT` | Auto | Server port | `10000` (auto-set by Render) |

## Cost Optimization

### Free Tier Limits
- **Web Services**: 750 hours/month (free tier)
- **Sleep**: Free tier services sleep after 15 minutes of inactivity
- **Database**: Use external database (Aiven free tier available)

### Upgrade Options
- **Starter Plan**: $7/month - Always on, no sleep
- **Standard Plan**: $25/month - Better performance
- **Pro Plan**: Custom pricing - Production-grade

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use Render's environment variable management
   - Rotate database passwords regularly

2. **Database**
   - Use strong passwords
   - Enable SSL for database connections
   - Restrict database access to Render IPs if possible

3. **Application**
   - Keep dependencies updated
   - Use HTTPS (Render provides automatically)
   - Implement rate limiting for production

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **Render Community**: [community.render.com](https://community.render.com)

## Next Steps

After deployment:
1. ✅ Test all functionality
2. ✅ Set up monitoring
3. ✅ Configure custom domain
4. ✅ Set up backups for database
5. ✅ Enable auto-deploy from Git
