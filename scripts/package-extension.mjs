/**
 * K-Apply Chrome Extension Packaging Script
 * Validates manifest.json, checks required assets, and packages the extension into dist/
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('⚡ [K-Apply] Starting Chrome Extension packaging...\n');

// 1. Read & Validate manifest.json
const manifestPath = path.resolve(rootDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: manifest.json not found at root!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`✓ Manifest valid: ${manifest.name} (v${manifest.version}) [Manifest V${manifest.manifest_version}]`);

// 2. Validate essential files & icons
const requiredFiles = [
  'manifest.json',
  manifest.background?.service_worker,
  'popup/popup.html',
  'popup/popup.js',
  'popup/popup.css',
  'sidepanel/sidepanel.html',
  'sidepanel/sidepanel.js',
  'sidepanel/sidepanel.css',
  'dashboard/dashboard.html',
  'dashboard/dashboard.js',
  'dashboard/dashboard.css',
  'content/content-script.js',
  'content/autofill-engine.js',
  'content/matcher.js',
  'content/floating-widget.css',
  'utils/storage.js',
  'utils/api.js',
  'utils/extractor.js',
  'utils/events.js',
  'data/default-data.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
].filter(Boolean);

let missing = false;
for (const rel of requiredFiles) {
  const fullPath = path.resolve(rootDir, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${rel}`);
    missing = true;
  }
}

if (missing) {
  process.exit(1);
}
console.log(`✓ All ${requiredFiles.length} core extension files and icons verified.`);

// 3. Prepare dist directory and staging
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const stagingDir = path.resolve(distDir, 'extension-unpacked');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Copy only extension files to staging
const extensionDirs = ['background', 'content', 'dashboard', 'data', 'icons', 'popup', 'sidepanel', 'utils'];
const extensionRootFiles = ['manifest.json', 'LICENSE'];

for (const dir of extensionDirs) {
  const src = path.resolve(rootDir, dir);
  const dest = path.resolve(stagingDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

for (const file of extensionRootFiles) {
  const src = path.resolve(rootDir, file);
  const dest = path.resolve(stagingDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}
console.log(`✓ Copied clean extension bundle to: dist/extension-unpacked/`);

// 4. Create ZIP archive
const zipName = `k-apply-extension-v${manifest.version}.zip`;
const zipPath = path.resolve(distDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  if (process.platform === 'win32') {
    // Use PowerShell Compress-Archive on Windows
    execSync(
      `powershell.exe -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    // Use standard zip on Linux / macOS
    execSync(`cd "${stagingDir}" && zip -r "${zipPath}" ./*`, { stdio: 'inherit' });
  }

  const stats = fs.statSync(zipPath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`\n🎉 Success! Extension packaged ready for Chrome Web Store:`);
  console.log(`   📦 Archive: dist/${zipName} (${sizeKb} KB)`);
  console.log(`   📂 Unpacked: dist/extension-unpacked/`);
} catch (err) {
  console.error('❌ Failed to create zip archive:', err.message);
  process.exit(1);
}
