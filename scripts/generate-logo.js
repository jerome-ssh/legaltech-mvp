import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a 512x512 canvas with a blue background
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0ea5e9"/>
  <text x="256" y="256" font-family="Arial" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">LM</text>
</svg>
`;

const outputDir = path.join(__dirname, '../public');
const outputFile = path.join(outputDir, 'logo.png');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate the logo
sharp(Buffer.from(svg))
  .png()
  .toFile(outputFile)
  .then(() => console.log('Generated logo.png'))
  .catch(error => console.error('Error generating logo:', error)); 