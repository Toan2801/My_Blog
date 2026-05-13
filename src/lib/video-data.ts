import prisma from './prisma';

export interface Video {
  id: string;
  title: string;
  url: string;
  description: string;
}

export async function getVideos(): Promise<Video[]> {
  const rows = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((v) => ({
    id: v.id,
    title: v.title,
    url: v.url,
    description: v.description,
  }));
}

export async function createVideo(video: Omit<Video, 'id'>): Promise<Video> {
  const id = Date.now().toString();
  const row = await prisma.video.create({
    data: { id, ...video },
  });
  return { id: row.id, title: row.title, url: row.url, description: row.description };
}

export async function deleteVideo(id: string): Promise<void> {
  await prisma.video.delete({ where: { id } }).catch(() => {});
}
