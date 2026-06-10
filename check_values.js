const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/contexts/LanguageContext.js',
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
     const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*(["'])(.*?)\2/);
     if (keyMatch) {
       obj[keyMatch[1]] = keyMatch[3];
     }
  }
  return obj;
}

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const uz = extractObject(content, 'uz');
    const ru = extractObject(content, 'ru');
    const kz = extractObject(content, 'kz');
    
    const duplicateRu = [];
    const duplicateUz = [];
    
    for (const key in kz) {
      if (kz[key] === ru[key] && kz[key] !== '' && !/^[0-9]+$/.test(kz[key])) {
        duplicateRu.push(key);
      }
      if (kz[key] === uz[key] && kz[key] !== '' && !/^[0-9]+$/.test(kz[key])) {
        duplicateUz.push(key);
      }
    }
    
    console.log(`\n--- File: ${file} ---`);
    console.log(`KZ total keys parsed: ${Object.keys(kz).length}`);
    console.log(`Same as RU (${duplicateRu.length}):`, duplicateRu);
    console.log(`Same as UZ (${duplicateUz.length}):`, duplicateUz);
  }
});
