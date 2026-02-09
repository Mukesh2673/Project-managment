# CI/CD Pipeline Documentation

This project uses GitHub Actions for Continuous Integration and Continuous Deployment.

## Overview

The CI/CD pipeline consists of three main workflows:

1. **CI Workflow** - Runs on every pull request and push
2. **CD Workflow** - Deploys to Render.com on push to main
3. **Test Build Workflow** - Tests build and migrations with real MySQL

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Jobs:**
- **Lint & Type Check**: Runs ESLint and TypeScript type checking
- **Build**: Builds the Next.js application
- **Verify Migrations**: Checks migration files exist and follow naming conventions

**Duration:** ~2-3 minutes

### 2. CD Workflow - Simple (`.github/workflows/cd-simple.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**Jobs:**
- **Pre-Deployment Checks**: Verifies code quality before Render auto-deploys
  - Linting
  - Type checking
  - Build verification

**Note:** This workflow assumes Render.com is configured for auto-deployment from Git. Render will automatically deploy when code is pushed to `main`.

**Duration:** ~2-3 minutes

### 3. CD Workflow - Advanced (`.github/workflows/cd.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**Jobs:**
- **Deploy to Render**: Uses Render API to trigger deployment
- **Notify**: Sends deployment status notifications

**Requirements:**
- `RENDER_SERVICE_ID` - Your Render service ID (GitHub Secret)
- `RENDER_API_KEY` - Your Render API key (GitHub Secret)

**Duration:** ~3-5 minutes

### 4. Test Build Workflow (`.github/workflows/test-build.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Manual trigger

**Jobs:**
- **Test Build & Migrations**: 
  - Sets up MySQL service container
  - Runs database migrations
  - Builds the application
  - Verifies build artifacts

**Duration:** ~5-7 minutes

## Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions are automatically enabled when you push the `.github/workflows/` directory to your repository.

### 2. Configure Secrets (For Advanced CD Workflow)

If using the advanced CD workflow (`.github/workflows/cd.yml`), add these secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

```
RENDER_SERVICE_ID=your-render-service-id
RENDER_API_KEY=your-render-api-key
```

#### Getting Render API Key

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to **Account Settings** → **API Keys**
3. Generate a new API key
4. Copy the key

#### Getting Render Service ID

1. Go to your service in Render Dashboard
2. The Service ID is in the URL: `https://dashboard.render.com/web/your-service-id`
3. Or check the service settings page

### 3. Configure Render Auto-Deploy (Recommended)

For the simple CD workflow, configure Render to auto-deploy:

1. Go to Render Dashboard → Your Service
2. Navigate to **Settings** → **Build & Deploy**
3. Enable **Auto-Deploy**
4. Set branch to `main`

## Workflow Status

### View Workflow Runs

1. Go to your GitHub repository
2. Click **Actions** tab
3. View all workflow runs and their status

### Workflow Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/your-username/your-repo/workflows/CI/badge.svg)
![CD](https://github.com/your-username/your-repo/workflows/CD%20-%20Simple/badge.svg)
```

## Pipeline Flow

```
┌─────────────────┐
│  Developer      │
│  Creates PR     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Workflow    │
│  - Lint         │
│  - Type Check   │
│  - Build        │
│  - Verify       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PR Approved    │
│  & Merged       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CD Workflow    │
│  - Pre-deploy   │
│  - Deploy       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render.com     │
│  Production     │
└─────────────────┘
```

## Manual Workflow Triggers

### Run CI Workflow Manually

1. Go to **Actions** tab
2. Select **CI** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Run CD Workflow Manually

1. Go to **Actions** tab
2. Select **CD - Simple** or **CD - Deploy to Render**
3. Click **Run workflow**
4. Select branch (usually `main`) and click **Run workflow**

## Troubleshooting

### CI Workflow Fails

**Linting Errors:**
```bash
# Fix locally
npm run lint -- --fix
```

**Type Errors:**
```bash
# Check types locally
npm run type-check
```

**Build Errors:**
```bash
# Build locally
npm run build
```

### CD Workflow Fails

**Deployment Not Triggered:**
- Check Render auto-deploy is enabled
- Verify branch is `main`
- Check Render service is active

**API Key Issues:**
- Verify `RENDER_API_KEY` secret is set correctly
- Regenerate API key if needed
- Check API key has proper permissions

### Test Build Fails

**MySQL Connection Issues:**
- Check MySQL service container is running
- Verify connection credentials in workflow
- Check MySQL health check passes

**Migration Failures:**
- Verify migration files are valid SQL
- Check migration file naming convention
- Ensure migrations are idempotent

## Best Practices

### ✅ Do:

- Keep workflows fast (< 5 minutes)
- Use caching for dependencies
- Run tests before deployment
- Use environment-specific configurations
- Monitor workflow runs regularly
- Keep secrets secure

### ❌ Don't:

- Commit secrets to repository
- Skip CI checks
- Deploy directly to production without testing
- Use hardcoded values in workflows
- Ignore failed workflow runs

## Workflow Customization

### Add More Tests

Edit `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: npm test
```

### Add Deployment Notifications

Edit `.github/workflows/cd.yml`:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
```

### Add More Environments

Create separate workflows for staging/production:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]

# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
```

## Monitoring

### GitHub Actions Insights

1. Go to **Actions** → **Insights**
2. View:
   - Workflow run duration
   - Success/failure rates
   - Most common failures

### Render Deployment Logs

1. Go to Render Dashboard
2. Select your service
3. View **Logs** tab for deployment and runtime logs

## Security

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate API keys regularly
- Use least privilege principle

### Workflow Permissions

Workflows run with limited permissions by default. To modify:

```yaml
permissions:
  contents: read
  deployments: write
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
- [Migration Guide](./MIGRATIONS.md)

## Support

For issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review error messages
3. Verify configuration
4. Check Render deployment logs
