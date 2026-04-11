import fs from 'fs';
import path from 'path';
import { Article, SiteConfig } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

export function getSiteConfig(): SiteConfig {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function saveSiteConfig(config: SiteConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf-8');
      return JSON.parse(raw) as Article;
    })
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllArticlesAdmin(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf-8');
      return JSON.parse(raw) as Article;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function saveArticle(article: Article): void {
  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const filePath = path.join(ARTICLES_DIR, `${article.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8');
}

export function deleteArticle(slug: string): void {
  const filePath = path.join(ARTICLES_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function getCategories(): string[] {
  const config = getSiteConfig();
  return config.categories;
}

export function getRelatedArticles(current: Article, all: Article[], limit = 3): Article[] {
  return all
    .filter(a => a.slug !== current.slug && (a.category === current.category || a.tags.some(t => current.tags.includes(t))))
    .slice(0, limit);
}
