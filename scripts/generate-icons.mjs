import fs from 'fs';
import path from 'path';

// Create icons directory
const iconsDir = path.resolve('firefox-extension/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG icon representation
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#121214"/>
  <text x="48" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">G.S.T</text>
  <!-- Cybernetic / Mecha silhouette -->
  <path d="M48 35 C42 35 39 40 39 45 C39 50 43 55 48 55 C53 55 57 50 57 45 C57 40 54 35 48 35 Z" fill="#FFFFFF"/>
  <path d="M42 43 L54 43 L52 46 L44 46 Z" fill="#121214"/>
  <path d="M33 54 L48 49 L63 54 L60 69 L48 74 L36 69 Z" fill="#FFFFFF"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');

// Load official G.S.T base64 icons if available
const jsonPath = path.join(iconsDir, 'icons-base64.json');
if (fs.existsSync(jsonPath)) {
  const { b48, b96 } = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  fs.writeFileSync(path.join(iconsDir, 'icon-48.png'), Buffer.from(b48, 'base64'));
  fs.writeFileSync(path.join(iconsDir, 'icon-96.png'), Buffer.from(b96, 'base64'));
}

console.log('Icons generated successfully with official G.S.T artwork.');
