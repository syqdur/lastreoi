#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('Building frontend for Netlify...');

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Build only the frontend with Vite
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('Frontend build completed successfully!');
} catch (error) {
  console.error('Frontend build failed:', error.message);
  process.exit(1);
}