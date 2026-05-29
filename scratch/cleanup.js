const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../public/uploads');
const articlesDir = path.join(__dirname, '../data/articles');

// 1. Get all upload files
const uploadFiles = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());

// 2. Read all articles content
const articleFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
let allArticlesContent = '';

for (const file of articleFiles) {
  const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
  allArticlesContent += content + '\n';
}

// 3. Find unused files
const unusedFiles = [];
for (const file of uploadFiles) {
  if (!allArticlesContent.includes(file)) {
    unusedFiles.push(file);
  }
}

// 4. Delete unused files
console.log(`Found ${unusedFiles.length} unused files out of ${uploadFiles.length} total files.`);
for (const file of unusedFiles) {
  console.log(`Deleting ${file}...`);
  fs.unlinkSync(path.join(uploadsDir, file));
}
console.log('Done cleanup.');
