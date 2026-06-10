const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/utils/pageI18n.js',
  'src/utils/researcherI18n.js'
];

function extractObject(content, lang) {
  const regex = new RegExp(`${lang}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'g');
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

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const uz = extractObject(content, 'uz');
    const kz = extractObject(content, 'kz');
    
    const missing = [];
    for (const key in uz) {
      if (!kz[key]) missing.push(key);
    }
    
    console.log(`\n--- File: ${file} ---`);
    console.log(`UZ keys: ${Object.keys(uz).length}`);
    console.log(`KZ keys: ${Object.keys(kz).length}`);
    console.log(`Missing in KZ (${missing.length}):`, missing);
  }
});
