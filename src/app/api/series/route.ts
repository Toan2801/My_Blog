import { NextRequest, NextResponse } from 'next/server';
import { saveSeries, deleteSeries, getAllSeries } from '@/lib/data';
import { Series } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const series: Series = await req.json();
    if (!series.slug || !series.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề hoặc slug' }, { status: 400 });
    }
    saveSeries(series);
    return NextResponse.json({ success: true, slug: series.slug });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const series: Series = await req.json();
    if (!series.slug || !series.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề hoặc slug' }, { status: 400 });
    }
    saveSeries(series);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Cần slug' }, { status: 400 });
  deleteSeries(slug);
  return NextResponse.json({ success: true });
}

export async function GET() {
  const series = getAllSeries();
  return NextResponse.json(series);
}
