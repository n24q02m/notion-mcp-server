# Release Guide

Quick guide for releasing new versions.

## Setup (One-time)

Add secrets in GitHub Settings → Secrets:

- `NPM_TOKEN`: npm access token (npmjs.com → Access Tokens → Automation)
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token
- `CODECOV_TOKEN`: Codecov token (optional)

## Release Process

```bash
# 1. Bump version
npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
npm version minor  # 1.0.0 → 1.1.0 (new features)
npm version major  # 1.0.0 → 2.0.0 (breaking changes)

# 2. Update CHANGELOG.md

# 3. Commit and push
git push origin main
git push origin --tags

# 4. Create GitHub Release from tag
# Workflows will automatically publish to npm and Docker Hub
```

## Manual Publish

```bash
# npm
npm run build && npm test
npm publish --access public

# Docker
docker build -t n24q02m/better-notion-mcp:VERSION .
docker push n24q02m/better-notion-mcp:VERSION
```
