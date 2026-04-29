import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    // Google TTS is synchronous and fast
    const urls = googleTTS.getAllAudioUrls(text, {
      lang: 'vi',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: '.,;!?',
    });

    return NextResponse.json({ urls: urls.map(u => u.url) });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
