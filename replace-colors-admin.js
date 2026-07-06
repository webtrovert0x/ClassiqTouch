const fs = require('fs');

const file = '/Users/mac/Desktop/classiq/frontend/src/Admin.css';
let css = fs.readFileSync(file, 'utf8');

const replacements = {
  '#cf993e': '#3b82f6',
  '#6e3c22': '#1e3a8a',
  '#d7ac62': '#60a5fa',
  '#c8b88a': '#93c5fd',
  '#e4bc72': '#3b82f6',
  '#b8860b': '#2563eb',
  '#b2966e': '#93c5fd',
  'rgba(215, 172, 98': 'rgba(96, 165, 250',
  'rgba(140, 80, 40': 'rgba(30, 58, 138',
  '#f3efe6': '#f1f5f9',
  '#f1eadf': '#f8fafc',
  '#f3ede1': '#f8fafc',
  '#c49b50': '#2563eb',
  '#d4a84e': '#1d4ed8',
  '#7a6e60': '#94a3b8',
  '#5a5248': '#64748b',
  '#b2a691': '#cbd5e1',
  '#1a0f06': '#0f172a',
  '#4a4238': '#64748b',
  'rgba(207, 153, 62': 'rgba(59, 130, 246',
  'rgba(110, 60, 34': 'rgba(30, 58, 138'
};

for (const [oldColor, newColor] of Object.entries(replacements)) {
  css = css.split(oldColor).join(newColor);
}

fs.writeFileSync(file, css);
console.log('Admin.css colors replaced successfully!');
