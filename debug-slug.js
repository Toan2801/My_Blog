const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');
const slug = 'thanh-su-cao-ly-hong-chuong';
const filePath = path.join(ARTICLES_DIR, `${slug}.json`);

console.log('Checking path:', filePath);
console.log('Exists:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  console.log('Slug in JSON:', data.slug);
  console.log('Status in JSON:', data.status);
}
