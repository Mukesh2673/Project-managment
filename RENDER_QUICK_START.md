# Render.com Quick Start Guide

## 🚀 Quick Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Render will auto-detect settings from `render.yaml`

### 3. Set Environment Variables
In Render Dashboard → Your Service → Environment:

**Copy from `.env.render.example` or set these:**

```
DB_HOST=your-aiven-host.j.aivencloud.com
DB_PORT=15369
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=defaultdb
DB_SSL_MODE=REQUIRED
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
PORT=10000
```

### 4. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for build
- Visit your app URL!

## ✅ Checklist

- [ ] Code pushed to Git
- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables set
- [ ] Database accessible (Aiven MySQL)
- [ ] Build successful
- [ ] App accessible at Render URL

## 🔧 Manual Migration (if needed)

If migrations don't run automatically:

1. Go to Render Dashboard → Your Service
2. Click "Shell" tab
3. Run: `npm run migrate`

## 📚 Full Documentation

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions.
