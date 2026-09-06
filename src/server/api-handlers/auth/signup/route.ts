import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { SignupSchema } from '@/lib/password-policy';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ValidationError', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { email, password, name } = parsed.data;

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: 'EmailExists', message: 'Email đã được đăng ký. Vui lòng đăng nhập.' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role =
    (process.env.ADMIN_EMAILS || 'admin@abc.com')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .includes(email)
      ? 'admin'
      : 'user';

  const u = await User.create({ email, name, passwordHash, role });
  return NextResponse.json({ ok: true, id: u._id.toString(), email: u.email, role: u.role });
}
