const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/utils/pageI18n.js',
  'src/utils/researcherI18n.js',
  'src/utils/locationI18n.js'
];

// Helper to extract keys for a specific language
function extractKeys(content, lang) {
  // This is a naive regex. It looks for `lang: { ... }` or `lang: {`
  const regex = new RegExp(`(?:^|\\s)${lang}\\s*:\\s*\\{([\\s\\S]*?)(?:\\n\\s*\\},|\\n\\s*\\}$|\\n\\s*[a-z]+\\s*:\\s*\\{)`, 'g');
  const match = regex.exec(content);
  if (!match) return {};
  
  const obj = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
     const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
     if (keyMatch) {
       obj[keyMatch[1]] = true;
     }
  }
  return obj;
}

// More robust helper using regex to find missing keys if they share structure
function checkMissing(file) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const uzKeys = extractKeys(content, 'uz');
  const ruKeys = extractKeys(content, 'ru');
  
  const missingInRu = [];
  for (const key in uzKeys) {
    if (!ruKeys[key]) missingInRu.push(key);
  }
  
  console.log(`\n--- File: ${file} ---`);
  console.log(`UZ keys: ${Object.keys(uzKeys).length}`);
  console.log(`RU keys: ${Object.keys(ruKeys).length}`);
  console.log(`Missing in RU (${missingInRu.length}):`, missingInRu);
}

filesToCheck.forEach(checkMissing);
