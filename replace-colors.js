const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend/src/App.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace hex colors
const replacements = {
  '#d7ac62': '#3b82f6', // Neon Blue
  '#c8b88a': '#93c5fd', // Light Blue
  '#b8860b': '#2563eb', // Deep Blue
  '#b2a691': '#cbd5e1', // Slate Gray
  '#cfba8d': '#60a5fa', // Blue 400
  '#e6c887': '#93c5fd', // Light Blue
  '#c7b492': '#94a3b8',
  '#f1eadf': '#f8fafc',
  '#f3ede1': '#f8fafc',
  '#f4ebdf': '#f8fafc',
  '#4a4238': '#334155',
  '#7a6a52': '#475569',
  '#7f745e': '#64748b',
  '#665c49': '#94a3b8',
  '#4a3a20': '#1e293b',
  '#a89a85': '#94a3b8',
  '#d4c7b0': '#e2e8f0',
  '#0d0b09': '#020617', // Very Dark Blue
  '#15110d': '#0f172a',
  '#0b0a08': '#020617',
  '#22150b': '#ffffff',
  '#20140a': '#ffffff',
  'rgba(207, 153, 62,': 'rgba(59, 130, 246,', // Blue glow
  'rgba(208, 162, 75,': 'rgba(59, 130, 246,',
  'rgba(110, 60, 34,': 'rgba(220, 38, 38,', // Red glow
  'rgba(117, 63, 40,': 'rgba(220, 38, 38,',
  'rgba(215, 172, 98,': 'rgba(59, 130, 246,',
  'rgba(214, 173, 96,': 'rgba(59, 130, 246,',
  'rgba(20, 16, 11,': 'rgba(15, 23, 42,',
  'rgba(17, 13, 10,': 'rgba(15, 23, 42,',
  'rgba(20, 16, 12,': 'rgba(15, 23, 42,',
  'rgba(15, 12, 9,': 'rgba(2, 6, 23,',
  'rgba(11, 9, 7,': 'rgba(2, 6, 23,',
  'rgba(10, 8, 6,': 'rgba(2, 6, 23,'
};

for (const [oldVal, newVal] of Object.entries(replacements)) {
  css = css.split(oldVal).join(newVal);
}

fs.writeFileSync(cssPath, css);
console.log('Colors replaced successfully!');
