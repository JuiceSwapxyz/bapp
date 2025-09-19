# GitHub Actions CI/CD Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment. All pull requests must pass required checks before merging.

## Workflows

### PR Checks (`pr-checks.yml`)
**Triggers:** Pull requests to `main` or `develop` branches

Comprehensive checks that run on every PR:
- **Quick Checks**: Dependency validation and formatting
- **TypeScript Check**: Type safety across the monorepo
- **Lint**: Code quality and style rules
- **Format Check**: Code formatting consistency
- **Tests**: Unit tests for all packages, web, mobile, and extension
- **Build**: Ensures all packages build successfully
- **Circular Dependencies**: Checks for circular imports

### PR Checks Changed (`pr-checks-changed.yml`)
**Triggers:** Pull requests with code changes

Optimized workflow that only runs checks on changed files/packages:
- Analyzes which parts of the monorepo were modified
- Runs targeted checks only for affected areas
- Faster feedback for small PRs

### Web Deployment
- **DEV (`web-dev.yaml`)**: Auto-deploys to development on push to `develop`
- **PRD (`web-prd.yaml`)**: Deploys to production on push to `main`

## Branch Protection

### Main Branch
- ✅ All CI checks must pass
- ✅ 2 approved reviews required
- ✅ Stale reviews dismissed on new commits
- ✅ Admins must follow rules
- ❌ Force pushes disabled
- ❌ Branch deletion disabled

### Develop Branch
- ✅ All CI checks must pass
- ✅ 1 approved review required
- ✅ Stale reviews dismissed on new commits
- ✅ Auto-merge enabled
- ❌ Force pushes disabled
- ❌ Branch deletion disabled

## Setting Up Branch Protection

Run the setup script to configure branch protection rules:

```bash
# Using GitHub token
./scripts/setup-branch-protection.sh YOUR_GITHUB_TOKEN

# Or set environment variable
export GITHUB_TOKEN=YOUR_TOKEN
./scripts/setup-branch-protection.sh
```

## Local Testing

Before pushing, run these commands locally to ensure CI will pass:

```bash
# Run all checks (comprehensive)
yarn g:run-all-checks

# Run quick checks for changed files
yarn g:run-fast-checks

# Individual checks
yarn g:typecheck        # TypeScript
yarn g:lint            # Linting
yarn g:format          # Formatting
yarn g:test            # Tests
yarn g:build           # Build all packages
```

## Common CI Failures and Solutions

### TypeScript Errors
```bash
# Check types locally
yarn g:typecheck

# Check only changed files
yarn g:typecheck:changed
```

### Lint Errors
```bash
# Auto-fix many lint issues
yarn g:lint:fix

# Check specific package
yarn workspace [package-name] lint
```

### Format Errors
```bash
# Auto-fix formatting
yarn g:format:fix

# Check formatting
yarn g:format
```

### Test Failures
```bash
# Run all tests
yarn g:test

# Run tests with coverage
yarn g:test:coverage

# Run specific test suite
yarn web test
yarn mobile test
yarn extension test
```

### Build Failures
```bash
# Clean build
rm -rf node_modules
yarn install --frozen-lockfile
yarn g:build
```

## Performance Optimization

The CI uses several optimization strategies:
- **Concurrency control**: Cancels outdated runs
- **Parallel jobs**: Tests run in parallel when possible
- **Node modules caching**: Via `actions/setup-node`
- **Conditional checks**: Only runs necessary checks based on changes

## Required Environment Variables

For deployment workflows:
- `AZURE_DEV_CREDENTIALS`: Azure service principal for DEV
- `AZURE_PROD_CREDENTIALS`: Azure service principal for PROD

## Monitoring

Check workflow runs at:
https://github.com/JuiceSwapxyz/bapp/actions

## Support

For CI/CD issues:
1. Check the workflow logs in GitHub Actions
2. Run the failing command locally
3. Ensure all dependencies are up to date
4. Verify Node.js version matches CI (22.13.1)