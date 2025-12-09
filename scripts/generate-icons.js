/**
 * Icon Generation Script for CryptoLaunch
 * 
 * This script generates PNG icons from SVG files for PWA and favicon use.
 * 
 * Usage:
 * node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Icon configurations
const icons = [
  { input: 'favicon.svg', output: 'favicon-16x16.png', size: 16 },
  { input: 'favicon.svg', output: 'favicon-32x32.png', size: 32 },
  { input: 'icon-192.svg', output: 'icon-192x192.png', size: 192 },
  { input: 'icon-512.svg', output: 'icon-512x512.png', size: 512 },
  { input: 'apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('🎨 Generating icons...\n');

  for (const icon of icons) {
    const inputPath = path.join(publicDir, icon.input);
    const outputPath = path.join(publicDir, icon.output);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${icon.input} - file not found`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.output} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.output}:`, error.message);
    }
  }

  // Generate OG Image (1200x630)
  console.log('\n📸 Generating OG Image...');
  await generateOGImage();

  console.log('\n🎉 Icon generation complete!');
}

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Create OG image with gradient background and text
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0f;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Grid pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(99, 102, 241, 0.1)" stroke-width="1"/>
      </pattern>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      
      <!-- Decorative circles -->
      <circle cx="100" cy="100" r="200" fill="rgba(99, 102, 241, 0.1)"/>
      <circle cx="1100" cy="530" r="250" fill="rgba(139, 92, 246, 0.1)"/>
      
      <!-- Logo container -->
      <rect x="500" y="150" width="200" height="200" rx="40" fill="url(#grad)"/>
      
      <!-- Lightning bolt -->
      <path d="M620 200 L560 300 L595 300 L580 400 L650 280 L610 280 L620 200Z" 
            fill="white" 
            stroke="rgba(255,255,255,0.3)" 
            stroke-width="3"
            stroke-linejoin="round"/>
      
      <!-- Text -->
      <text x="${width / 2}" y="420" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="64" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle">CryptoLaunch</text>
      
      <text x="${width / 2}" y="480" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="28" 
            fill="#a0a0b0" 
            text-anchor="middle">Professional Token Launchpad Platform</text>
      
      <!-- Bottom bar -->
      <rect x="0" y="600" width="${width}" height="30" fill="url(#grad)"/>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    
    console.log('✅ Generated og-image.png (1200x630)');
  } catch (error) {
    console.error('❌ Error generating OG image:', error.message);
  }
}

generateIcons().catch(console.error);
