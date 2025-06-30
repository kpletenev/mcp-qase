# Publishing Guide for qase-mcp-server

This document outlines the steps to publish the qase-mcp-server package to npm.

## Prerequisites

1. You need an npm account with publishing rights to the package
2. You need to be logged in to npm (`npm login`)
3. Ensure all changes are committed to the repository

## Publishing Process

### 1. Prepare for Release

1. Update the version in `package.json` if needed
2. Ensure all tests pass and the build is successful
3. Update the README.md if necessary

### 2. Test the Package Locally

Run the package test to ensure everything works correctly:

```bash
npm run test:package
```

This will:
- Create a package tarball
- Install it in a temporary directory
- Test running it with the `--help` flag
- Clean up afterward

### 3. Publish to npm

When you're ready to publish:

```bash
npm publish
```

This will:
- Run linting (`npm run lint`)
- Build the package (`npm run build`)
- Test the package (`npm run test:package`)
- Publish to npm
- Display a success message

### 4. Verify the Published Package

After publishing, verify that the package is available and works correctly:

```bash
# Use with npx
npx -y qase-mcp-server --help
```

## Troubleshooting

If you encounter issues during publishing:

1. **Authentication Issues**: Ensure you're logged in with `npm login`
2. **Version Conflicts**: Make sure you're not trying to publish a version that already exists
3. **Build Failures**: Fix any TypeScript errors or linting issues
4. **Test Failures**: Ensure the package works correctly when installed

## Maintenance

After publishing:

1. Create a git tag for the release: `git tag v1.0.0 && git push --tags`
2. Update the repository with any changes made during the publishing process
3. Consider creating a GitHub release with release notes