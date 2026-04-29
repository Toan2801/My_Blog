import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');

export interface Video {
  id: string;
  title: string;
  url: string;
  description: string;
}

// Ensure directory exists
const ensureDir = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export function getVideos(): Video[] {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(content);
}

export function saveVideos(videos: Video[]) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), 'utf-8');
}
