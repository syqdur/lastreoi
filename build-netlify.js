#!/usr/bin/env node
import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

console.log('Building for Netlify...');

// Build the frontend
console.log('Building frontend...');
execSync('vite build', { stdio: 'inherit' });

// Create netlify functions directory if it doesn't exist
if (!existsSync('netlify/functions')) {
  mkdirSync('netlify/functions', { recursive: true });
}

console.log('Netlify build complete!');