const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-slate-950': 'bg-slate-50',
  'bg-slate-900': 'bg-white',
  'bg-slate-800': 'bg-slate-100',
  'text-white': 'text-slate-900',
  'text-slate-400': 'text-slate-500',
  'text-slate-300': 'text-slate-700',
  'text-slate-500': 'text-slate-400',
  'border-slate-800': 'border-slate-200',
  'border-slate-700': 'border-slate-300',
  'from-indigo-900/20': 'from-indigo-100/50',
  'via-slate-950': 'via-slate-50',
  'to-slate-950': 'to-slate-50',
  'hover:bg-slate-800': 'hover:bg-slate-100',
  'hover:bg-slate-700': 'hover:bg-slate-200',
  'bg-slate-800/50': 'bg-slate-100/80',
  'border-slate-700/50': 'border-slate-200',
  'bg-slate-900/80': 'bg-white/90',
  'border-slate-800/50': 'border-slate-200',
  'divide-slate-800/50': 'divide-slate-200',
  'bg-slate-800/30': 'bg-slate-50',
  'hover:border-slate-700/50': 'hover:border-slate-300'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Need to replace the keys with word boundaries to avoid partial matches
  // However, hyphenated words in regex \b might be tricky.
  // We can just use split/join or a regex with lookaround.
  
  for (const [key, value] of Object.entries(replacements)) {
    // Escape special characters in key
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(?<![a-zA-Z0-9-])' + escapedKey + '(?![a-zA-Z0-9-])', 'g');
    newContent = newContent.replace(regex, value);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
  }
});

console.log('Changed ' + changed + ' files.');
