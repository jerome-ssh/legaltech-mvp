import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = {
  'icon-192x192.png': 192,
  'icon-512x512.png': 512,
  'dashboard-192x192.png': 192,
  'crm-192x192.png': 192,
  'analytics-192x192.png': 192
};

const sourceIcon = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate each icon
Object.entries(sizes).forEach(async ([filename, size]) => {
  try {
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(outputDir, filename));
    console.log(`Generated ${filename}`);
  } catch (error) {
    console.error(`Error generating ${filename}:`, error);
  }
}); 