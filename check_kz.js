const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/contexts/LanguageContext.js',
  'src/utils/pageI18n.js',
  'src/utils/researcherI18n.js',
  'src/utils/locationI18n.js'
];

// Helper to extract the translations object string from a file content
function extractTranslations(content) {
  const match = content.match(/const\s+translations\s*=\s*(\{[\s\S]*?\n\s*\}\s*;|\{[\s\S]*?export\s+default)/);
  if (match) {
    let objStr = match[1];
    if (objStr.endsWith('export default')) {
      objStr = objStr.replace(/export\s+default$/, '');
    }
    if (objStr.endsWith(';')) {
        objStr = objStr.slice(0, -1);
    }
    return objStr;
  }
  
  // Try another pattern if it's exported directly
  const match2 = content.match(/export\s+const\s+translations\s*=\s*(\{[\s\S]*?\n\s*\})/);
  if (match2) return match2[1];
  
  return null;
}

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const transStr = extractTranslations(content);
    
    if (transStr) {
      console.log(`\n--- File: ${file} ---`);
      
      // Let's use regex to find missing keys instead of eval due to complex file structure
      // We'll extract keys for 'uz', 'ru' and 'kz'
      const extractLangKeys = (lang) => {
        const regex = new RegExp(`${lang}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'g');
        const match = regex.exec(transStr);
        if (!match) return null;
        
        const keys = [];
        const lines = match[1].split('\n');
        for (const line of lines) {
           const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
           if (keyMatch) keys.push(keyMatch[1]);
        }
        return keys;
      };

      const uzKeys = extractLangKeys('uz');
      const ruKeys = extractLangKeys('ru');
      const kzKeys = extractLangKeys('kz');

      console.log(`UZ keys count: ${uzKeys ? uzKeys.length : 0}`);
      console.log(`RU keys count: ${ruKeys ? ruKeys.length : 0}`);
      console.log(`KZ keys count: ${kzKeys ? kzKeys.length : 0}`);

      const baseKeys = uzKeys || ruKeys || [];
      if (baseKeys.length > 0) {
        if (!kzKeys) {
            console.log(`CRITICAL: 'kz' language object is completely MISSING in ${file}`);
        } else {
            const missing = baseKeys.filter(k => !kzKeys.includes(k));
            if (missing.length > 0) {
               console.log(`Missing KZ keys (${missing.length}):`, missing);
            } else {
               console.log(`All keys exist in KZ for ${file}`);
            }
        }
      }

    } else {
      console.log(`Could not extract translations from ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
