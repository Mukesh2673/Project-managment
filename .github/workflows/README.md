# GitHub Actions Workflows

This directory contains CI/CD workflows for automated testing and deployment.

## Workflows

### 🔍 CI (`ci.yml`)
**When:** Every pull request and push to main/develop  
**What:** Linting, type checking, build verification  
**Duration:** ~2-3 minutes

### 🚀 CD - Simple (`cd-simple.yml`)
**When:** Push to main branch  
**What:** Pre-deployment checks (Render auto-deploys)  
**Duration:** ~2-3 minutes  
**Recommended for:** Most users

### 🚀 CD - Advanced (`cd.yml`)
**When:** Push to main branch  
**What:** Deploys via Render API  
**Duration:** ~3-5 minutes  
**Requires:** Render API key and service ID secrets

### 🧪 Test Build (`test-build.yml`)
**When:** Pull requests and manual trigger  
**What:** Tests build with real MySQL database  
**Duration:** ~5-7 minutes

## Quick Start

1. **Push to GitHub** - Workflows run automatically
2. **View Status** - Go to Actions tab in GitHub
3. **For Render Deployment** - Use `cd-simple.yml` (recommended)

## Configuration

### For Simple CD (Recommended)
- No configuration needed
- Render auto-deploys from Git

### For Advanced CD
Add GitHub Secrets:
- `RENDER_SERVICE_ID`
- `RENDER_API_KEY`

See [CI_CD.md](../CI_CD.md) for detailed documentation.
