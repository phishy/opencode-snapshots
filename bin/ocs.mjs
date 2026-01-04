#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];

function runTui() {
  const tuiPath = path.join(rootDir, 'tui', 'dist', 'cli.js');
  
  if (!fs.existsSync(tuiPath)) {
    console.error('TUI not built. Run: npm run tui:build');
    process.exit(1);
  }
  
  const child = spawn('node', [tuiPath], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  
  child.on('exit', (code) => process.exit(code || 0));
}

function runWeb(isDev = true) {
  const nextBin = path.join(rootDir, 'node_modules', '.bin', 'next');
  const cmd = isDev ? 'dev' : 'start';
  const extraArgs = isDev ? ['--turbopack'] : [];
  
  console.log(`Starting web server (${isDev ? 'development' : 'production'})...`);
  console.log('Open http://localhost:3000\n');
  
  const child = spawn(nextBin, [cmd, ...extraArgs], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  
  child.on('exit', (code) => process.exit(code || 0));
}

function showHelp() {
  console.log(`
OpenCode Snapshot Browser

Usage: ocs [command]

Commands:
  (none)      Run terminal UI (default)
  tui         Run terminal UI
  serve       Start web server (development mode)
  web         Start web server (alias for serve)
  start       Start web server (production mode)
  help        Show this help

Examples:
  ocs              # Launch TUI
  ocs serve        # Start dev server at http://localhost:3000
  ocs web          # Same as serve
`);
}

switch (command) {
  case undefined:
  case 'tui':
    runTui();
    break;
  case 'serve':
  case 'web':
    runWeb(true);
    break;
  case 'start':
    runWeb(false);
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
