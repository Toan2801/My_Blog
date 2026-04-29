import { NextResponse } from 'next/server';
import { getVideos, saveVideos, Video } from '@/lib/video-data';

export async function GET() {
  const videos = getVideos();
  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  try {
    const { title, url, description } = await req.json();
    const videos = getVideos();
    
    const newVideo: Video = {
      id: Date.now().toString(),
      title,
      url,
      description
    };
    
    videos.unshift(newVideo); // Add to beginning
    saveVideos(videos);
    
    return NextResponse.json(newVideo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    let videos = getVideos();
    videos = videos.filter(v => v.id !== id);
    saveVideos(videos);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
