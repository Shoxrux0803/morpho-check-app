const fs = require('fs');
const path = require('path');

const files = [
  'src/utils/pageI18n.js',
  'src/utils/researcherI18n.js',
  'src/contexts/LanguageContext.js'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Convert to CommonJS for eval
    content = content.replace(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g, 'const $1 =');
    content = content.replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, '');
    content = content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    content = content.replace(/const\s+LanguageContext\s*=\s*createContext\(null\);/g, '');
    
    try {
      // Create a function to evaluate and return the dictionary
      let dictionaries, translations;
      if (file.includes('LanguageContext.js')) {
          eval(content + '\n; __result = translations;');
          dictionaries = global.__result;
      } else {
          eval(content + '\n; __result = dictionaries;');
          dictionaries = global.__result;
      }
      
      const uz = dictionaries.uz;
      const kz = dictionaries.kz;
      
      if (!uz || !kz) {
          console.log(`Skipping ${file}: missing uz or kz`);
          return;
      }
      
      const missingKeys = [];
      for (const key in uz) {
        if (!(key in kz)) {
          missingKeys.push(key);
        }
      }
      
      console.log(`\n--- File: ${file} ---`);
      console.log(`UZ: ${Object.keys(uz).length}`);
      console.log(`KZ: ${Object.keys(kz).length}`);
      if (missingKeys.length > 0) {
        console.log(`Missing in KZ:`, missingKeys);
        console.log(`VALUES to translate from UZ:`);
        missingKeys.forEach(k => console.log(`"${k}": "${uz[k]}",`));
      } else {
        console.log(`No missing keys!`);
      }
      
    } catch (err) {
      console.log(`Error evaluating ${file}: ${err.message}`);
    }
  }
});
