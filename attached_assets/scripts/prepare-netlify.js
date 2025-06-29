#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Preparing Netlify deployment...');

// Ensure directories exist
const dirs = ['netlify', 'netlify/functions', 'dist', 'dist/public'];
dirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy redirects file to public directory
if (existsSync('_redirects')) {
  copyFileSync('_redirects', 'client/public/_redirects');
  console.log('✅ Copied _redirects to public directory');
}

// Create a simple package.json for the function if it doesn't exist
const functionPackageJson = {
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "serverless-http": "^3.2.0"
  }
};

const functionPackagePath = join('netlify', 'functions', 'package.json');
if (!existsSync(functionPackagePath)) {
  writeFileSync(functionPackagePath, JSON.stringify(functionPackageJson, null, 2));
  console.log('✅ Created package.json for Netlify functions');
}

console.log('🎉 Netlify deployment preparation complete!');