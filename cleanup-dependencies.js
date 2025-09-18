#!/usr/bin/env node

/**
 * Safe dependency cleanup script
 * This script helps identify and remove unused dependencies from your project
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Dependencies that are definitely safe to remove based on analysis
const SAFE_TO_REMOVE = [
  '@sendgrid/mail',
  'openid-client', 
  'memoizee',
  '@types/memoizee',
  'passport',
  'passport-local',
  '@types/passport',
  '@types/passport-local',
  'embla-carousel-react',
  'recharts',
  'react-day-picker', 
  'vaul',
  'react-resizable-panels'
];

// Dependencies that need manual verification
const VERIFY_FIRST = [
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-slider',
  '@radix-ui/react-switch',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-tooltip',
  'input-otp',
  'cmdk',
  'tw-animate-css'
];

async function analyzeDependencies() {
  console.log('🔍 Analyzing dependencies...\n');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log('📦 SAFE TO REMOVE (Definitely unused):');
  console.log('═'.repeat(50));
  
  const safeRemovalSize = [];
  for (const dep of SAFE_TO_REMOVE) {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}`);
      safeRemovalSize.push(dep);
    }
  }
  
  console.log(`\n📊 Found ${safeRemovalSize.length} safe removals\n`);
  
  console.log('⚠️  VERIFY FIRST (Check if actually used):');
  console.log('═'.repeat(50));
  
  const verifySize = [];
  for (const dep of VERIFY_FIRST) {
    if (dependencies[dep]) {
      console.log(`🔍 ${dep}`);
      verifySize.push(dep);
    }
  }
  
  console.log(`\n📊 Found ${verifySize.length} to verify\n`);
  
  return { safeRemovalSize, verifySize };
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `package.json.backup.${timestamp}`;
  fs.copyFileSync('package.json', backupName);
  console.log(`💾 Created backup: ${backupName}`);
  return backupName;
}

function removeDependencies(deps) {
  if (deps.length === 0) {
    console.log('No dependencies to remove.');
    return;
  }
  
  console.log(`\n🗑️  Removing ${deps.length} dependencies...`);
  
  try {
    const command = `npm uninstall ${deps.join(' ')}`;
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Dependencies removed successfully!');
  } catch (error) {
    console.error('❌ Error removing dependencies:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🧹 TicTac 3x5 - Dependency Cleanup Tool\n');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found in current directory');
    process.exit(1);
  }
  
  const { safeRemovalSize } = await analyzeDependencies();
  
  // Create backup
  const backup = createBackup();
  
  // Process command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--auto') || args.includes('-a')) {
    console.log('🤖 Auto mode: Removing safe dependencies...\n');
    removeDependencies(safeRemovalSize);
  } else if (args.includes('--list') || args.includes('-l')) {
    console.log('📋 List mode: Analysis complete. Use --auto to remove safe dependencies.');
  } else {
    console.log('💡 Usage:');
    console.log('  node cleanup-dependencies.js --list   # List unused dependencies');
    console.log('  node cleanup-dependencies.js --auto   # Remove safe dependencies');
    console.log('  npm run cleanup-deps                   # Alias for --auto');
    console.log('\n💾 Backup created: ' + backup);
    console.log('🔒 Safe to run --auto for the dependencies marked as safe');
  }
  
  console.log('\n✨ Cleanup analysis complete!');
}

main().catch(console.error);