const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../data/articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

let combinedOutput = '';

files.forEach(file => {
  const filePath = path.join(articlesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.content) {
    // Basic HTML stripping
    const plainText = data.content
      .replace(/<[^>]+>/g, '\n') // Replace HTML tags with newlines
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim();
      
    combinedOutput += `========== FILE: ${file} ==========\n`;
    combinedOutput += `TITLE: ${data.title}\n\n`;
    combinedOutput += plainText + '\n\n\n';
  }
});

fs.writeFileSync(path.join(__dirname, '../scratch/extracted_contents.txt'), combinedOutput);
console.log('Extracted content to scratch/extracted_contents.txt');
