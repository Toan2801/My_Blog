import { getAllArticles } from './src/lib/data';

const articles = getAllArticles();
console.log('Total articles:', articles.length);
const translations = articles.filter(a => a.type === 'translation');
console.log('Translations:', translations.length);
translations.forEach(t => {
  console.log(`- ${t.title} (slug: ${t.slug}, featured: ${t.featured}, series: ${t.series})`);
});
