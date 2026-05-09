const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');
const SERIES_DIR = path.join(process.cwd(), 'data', 'series');

if (!fs.existsSync(SERIES_DIR)) {
  fs.mkdirSync(SERIES_DIR, { recursive: true });
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
const seriesMap = new Set();

files.forEach(f => {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf-8');
  const article = JSON.parse(raw);
  if (article.series) {
    seriesMap.add(article.series);
  }
});

seriesMap.forEach(seriesName => {
  const slug = seriesName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
  const filePath = path.join(SERIES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    const series = {
      slug: slug,
      title: seriesName,
      description: `Lời giới thiệu cho series ${seriesName}...`,
      coverImage: null,
      status: 'published'
    };
    fs.writeFileSync(filePath, JSON.stringify(series, null, 2), 'utf-8');
    console.log(`Created series: ${seriesName} (${slug})`);
  }
});
