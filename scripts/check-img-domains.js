const fs = require('fs');
const path = require('path');
const files = fs.readdirSync('data/articles');
const urls = new Set();
files.forEach(f => {
  if(f.endsWith('.json')) {
    const d = JSON.parse(fs.readFileSync(path.join('data/articles', f), 'utf8'));
    if (d.content) {
      const m = d.content.match(/<img[^>]+src=["']([^"']+)["']/g);
      if(m) {
        m.forEach(s => {
          const match = s.match(/src=["']([^"']+)["']/);
          if (match && match[1]) {
            try {
              const url = match[1];
              const domain = new URL(url, 'http://localhost').hostname;
              urls.add(domain);
            } catch (e) {}
          }
        });
      }
    }
  }
});
console.log(Array.from(urls));
