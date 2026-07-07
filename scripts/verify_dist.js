import fs from 'fs';
import path from 'path';

const distDir = './.output/chrome-mv3';

const filesToVerify = [
  'manifest.json',
  'background.js',
  'content-scripts/content.js',
  'popup.html',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

let failed = false;

console.log('Verifying WXT compiled build outputs in .output/chrome-mv3...');

if (!fs.existsSync(distDir)) {
  console.error(`Error: WXT compilation directory '${distDir}' does not exist.`);
  process.exit(1);
}

filesToVerify.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✓ [FOUND] ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.error(`✗ [MISSING] ${file}`);
    failed = true;
  }
});

// Extra validation for manifest file structure
try {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  if (manifest.manifest_version !== 3) {
    console.error(`✗ Manifest version is not V3: found ${manifest.manifest_version}`);
    failed = true;
  } else {
    console.log(`✓ [VALID] manifest.json matches WXT-generated MV3 layout specifications.`);
  }
} catch (e) {
  console.error(`✗ [ERROR] manifest.json parsing failed:`, e.message);
  failed = true;
}

if (failed) {
  console.error('WXT build output verification failed.');
  process.exit(1);
} else {
  console.log('All WXT build outputs successfully verified! Package is ready for loading in Chrome.');
}
