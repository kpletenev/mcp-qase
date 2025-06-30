#!/usr/bin/env node

/**
 * This script checks if the package name is available on npm
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json to get the name
const packageJsonPath = path.join(path.dirname(__dirname), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageName = packageJson.name;

console.log(`Checking availability of package name: ${packageName}`);

// Make a request to the npm registry
https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
  if (res.statusCode === 404) {
    console.log(`✅ Package name "${packageName}" is available!`);
    process.exit(0);
  } else if (res.statusCode === 200) {
    console.log(`❌ Package name "${packageName}" is already taken.`);
    
    // Get the data to check if it's your package
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const packageInfo = JSON.parse(data);
        
        if (packageInfo.versions) {
          const versions = Object.keys(packageInfo.versions);
          console.log(`Existing versions: ${versions.join(', ')}`);
          
          // Check if our version is already published
          if (versions.includes(packageJson.version)) {
            console.log(`⚠️ Version ${packageJson.version} is already published!`);
            console.log('Consider updating the version number in package.json');
          } else {
            console.log(`✅ Version ${packageJson.version} is available for publishing.`);
          }
        }
        
        if (packageInfo.maintainers && packageInfo.maintainers.length > 0) {
          console.log('Maintainers:');
          packageInfo.maintainers.forEach(maintainer => {
            console.log(`- ${maintainer.name} (${maintainer.email || 'No email'})`);
          });
        }
      } catch (error) {
        console.error('Error parsing package info:', error.message);
      }
    });
    
    process.exit(1);
  } else {
    console.log(`Received status code ${res.statusCode}`);
    process.exit(1);
  }
}).on('error', (err) => {
  console.error(`Error checking package name: ${err.message}`);
  process.exit(1);
});