const fs = require('fs');
const path = require('path');

const articlesDir = 'D:/Antigravity/history-blog/data/articles';
const seriesFilePath = 'D:/Antigravity/history-blog/data/series/minh-quy-nam-luoc.json';

// 1. Read the series file
const seriesData = JSON.parse(fs.readFileSync(seriesFilePath, 'utf8'));

// 2. Read all articles
const files = fs.readdirSync(articlesDir);
const articles = [];

files.forEach(file => {
  if (file.endsWith('.json')) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));
      if (data.series === 'Minh quý nam lược') {
        articles.push({
          file,
          slug: data.slug,
          title: data.title,
          content: data.content
        });
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
  }
});

// 3. Sort articles by Quyen number
// Example slugs: minhquynamluoc-quyen01, minhquynamluoc-quyen02, minhquynamluoc-quyen3...
function getQuyenNumber(slug) {
  const match = slug.match(/quyen(?:0)?(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

articles.sort((a, b) => getQuyenNumber(a.slug) - getQuyenNumber(b.slug));

console.log(`Found ${articles.length} articles in the series.`);

// 4. Extract headings and build HTML
let html = '<h2>Mục lục chi tiết</h2>\n';

articles.forEach(article => {
  html += `<p><strong><a href="/articles/${article.slug}">📖 ${article.title}</a></strong></p>\n`;
  
  // Extract h1 and h2 tags
  const headings = [];
  const regex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(article.content)) !== null) {
    const tag = match[1].toLowerCase();
    const text = match[2].replace(/<[^>]+>/g, '').trim(); // Remove any inner HTML tags
    headings.push({ tag, text });
  }
  
  if (headings.length > 0) {
    html += '<ul>\n';
    headings.forEach(h => {
      // Indent or style depending on h1 vs h2/h3
      if (h.tag === 'h1') {
        html += `  <li><strong>${h.text}</strong></li>\n`;
      } else {
        html += `  <li>${h.text}</li>\n`;
      }
    });
    html += '</ul>\n';
  }
});

// 5. Update series JSON data
seriesData.content = html;

// 6. Write back to file
fs.writeFileSync(seriesFilePath, JSON.stringify(seriesData, null, 2), 'utf8');
console.log('Successfully updated series file with TOC!');
