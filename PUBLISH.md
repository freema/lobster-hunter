# Publishing to NPM

This document describes how to publish lobster-hunter to NPM.

## Prerequisites

1. **NPM Token**: Already configured as GitHub secret `NPM_TOKEN`
2. **GitHub Repository**: https://github.com/freema/lobster-hunter
3. **Clean Working Directory**: No uncommitted changes

## Publishing Process

### Automatic (via GitHub Actions - RECOMMENDED)

1. **Update version in package.json**:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   # or
   npm version minor  # 1.0.0 -> 1.1.0
   # or
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Push tag to GitHub**:
   ```bash
   git push origin feature/code-review-fixes
   git push --tags
   ```

3. **GitHub Action will automatically**:
   - Run tests (typecheck, lint, format)
   - Build TypeScript
   - Publish to NPM
   - Create GitHub Release

### Manual (local publish)

⚠️ **Not recommended** - Use GitHub Actions instead

```bash
# 1. Update version
npm version patch

# 2. Build and test
npm run test
npm run build

# 3. Login to NPM (if needed)
npm login

# 4. Publish
npm publish
```

## Pre-publish Checklist

Before creating a release tag:

- [ ] Update CHANGELOG.md with new version
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run build` - builds successfully
- [ ] Test CLI locally: `node dist/index.js --version`
- [ ] Update version in package.json
- [ ] Commit all changes
- [ ] Create and push tag

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x -> 2.0.0): Breaking changes
- **MINOR** (1.0.x -> 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 -> 1.0.1): Bug fixes, backwards compatible

## First Release (v1.0.0)

```bash
# On main branch (after merging feature branch)
git checkout main
git pull origin main

# Create v1.0.0 tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag
git push origin v1.0.0
```

GitHub Action will automatically publish to NPM!

## NPM Package Details

- **Package Name**: `lobster-hunter`
- **Registry**: https://registry.npmjs.org
- **Package Page**: https://www.npmjs.com/package/lobster-hunter (after first publish)

## What Gets Published

Files included in NPM package (see `.npmignore`):

- `dist/` - Compiled JavaScript
- `README.md` - Documentation
- `LICENSE` - License file
- `CHANGELOG.md` - Version history
- `package.json` - Package metadata

Files excluded:
- Source TypeScript files (`src/`)
- Development configs (`.eslintrc.json`, `.prettierrc`, etc.)
- GitHub Actions (`.github/`)
- Test files
- `node_modules/`

## Installation (for users)

After publishing, users can install with:

```bash
npm install -g lobster-hunter
# or
npx lobster-hunter 192.168.1.0/24
```

## Troubleshooting

### "Package already exists"
- Update version in package.json
- NPM doesn't allow re-publishing the same version

### "No permission to publish"
- Check NPM_TOKEN secret is set correctly
- Verify you have publish rights for the package

### "Tests failed"
- Fix failing tests before publishing
- Run `npm test` locally to debug

### "Build failed"
- Fix TypeScript errors
- Run `npm run build` locally to debug

## GitHub Action Workflow

Located in: `.github/workflows/release.yml`

Triggers on: Git tags matching `v*` (e.g., v1.0.0, v1.2.3)

Steps:
1. Checkout code
2. Setup Node.js 20.x with NPM registry
3. Install dependencies
4. Run tests
5. Build project
6. Publish to NPM (using NPM_TOKEN secret)
7. Create GitHub Release

## Monitoring

After publishing:
- Check NPM: https://www.npmjs.com/package/lobster-hunter
- Check GitHub Release: https://github.com/freema/lobster-hunter/releases
- Test installation: `npm install -g lobster-hunter`
