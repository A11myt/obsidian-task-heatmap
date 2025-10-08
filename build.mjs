import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create deployment directory if it doesn't exist
const deploymentDir = './deployment';
if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
}

console.log('📦 Building plugin...');

// Run the esbuild process
execSync('node esbuild.config.mjs production', { stdio: 'inherit' });

// Copy essential files to deployment folder
const filesToCopy = [
    'manifest.json',
    'styles.css'
];

console.log('📁 Copying essential files to deployment folder...');

filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(deploymentDir, file));
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`⚠️  ${file} not found, skipping...`);
    }
});

console.log('🎉 Build complete! Files are ready in the deployment folder.');