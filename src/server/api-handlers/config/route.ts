import { NextRequest, NextResponse } from 'next/server';
import { getSiteConfig, saveSiteConfig } from '@/lib/data';

export async function GET() {
  const config = getSiteConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  try {
    const config = await req.json();
    saveSiteConfig(config);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json();
    const config = getSiteConfig();
    const newConfig = { ...config, ...updates };
    saveSiteConfig(newConfig);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
