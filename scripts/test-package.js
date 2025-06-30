#!/usr/bin/env node

/**
 * This script tests the npm package by:
 * 1. Running npm pack to create a tarball
 * 2. Installing the tarball in a temporary directory
 * 3. Running the installed package with --help flag
 * 4. Cleaning up
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Create a temporary directory
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qase-mcp-server-test-'));
console.log(`Created temporary directory: ${tempDir}`);

try {
  // Get the package version from package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const version = packageJson.version;
  
  // Run npm pack to create a tarball
  console.log('Creating package tarball...');
  execSync('npm pack', { stdio: 'inherit', cwd: projectRoot });
  
  const tarballName = `qase-mcp-server-${version}.tgz`;
  
  // Move to temp directory and install the tarball
  console.log(`Installing package in temporary directory...`);
  execSync(`cd "${tempDir}" && npm init -y && npm install "${path.resolve(projectRoot, tarballName)}"`, { stdio: 'inherit' });
  
  // Test running the package with --help
  console.log('Testing package execution...');
  execSync(`cd "${tempDir}" && QASE_API_TOKEN=test-token npx qase-mcp-server --help`, { stdio: 'inherit' });
  
  console.log('\n✅ Package test successful!');
} catch (error) {
  console.error('\n❌ Package test failed:');
  console.error(error.message);
  process.exit(1);
} finally {
  // Clean up
  console.log('Cleaning up...');
  try {
    // Remove the tarball
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const tarballName = `qase-mcp-server-${packageJson.version}.tgz`;
    const tarballPath = path.join(projectRoot, tarballName);
    if (fs.existsSync(tarballPath)) {
      fs.unlinkSync(tarballPath);
    }
    
    // Remove the temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Cleanup complete.');
  } catch (cleanupError) {
    console.error('Cleanup failed:', cleanupError.message);
  }
}