'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validatePassword } from '@/lib/password-policy';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pwErrors = password ? validatePassword(password) : [];
  const confirmMismatch = confirm && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    if (pwErrors.length > 0) {
      setError(pwErrors[0]);
      return;
    }
    if (password !== confirm) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirm, name }),
    });
    if (res.status === 409) {
      setBusy(false);
      setError('Email đã được đăng ký. Vui lòng đăng nhập.');
      return;
    }
    if (!res.ok) {
      setBusy(false);
      setError('Đăng ký thất bại. Vui lòng thử lại.');
      return;
    }
    // Auto sign-in.
    const r = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (!r || r.error) {
      setInfo('Đăng ký thành công. Vui lòng đăng nhập.');
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng ký</h1>
        <p className="auth-subtitle">Tạo tài khoản để đọc và lưu tiến độ.</p>

        <form onSubmit={submit} className="auth-form" noValidate>
          <label className="auth-field">
            <span>Tên hiển thị (tuỳ chọn)</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && pwErrors.length > 0 && (
              <ul className="auth-hint">
                {pwErrors.map((m) => <li key={m}>• {m}</li>)}
              </ul>
            )}
          </label>
          <label className="auth-field">
            <span>Xác nhận mật khẩu</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {confirmMismatch && <p className="auth-hint auth-hint-error">Mật khẩu không khớp</p>}
          </label>
          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Đang đăng ký…' : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-divider"><span>hoặc</span></div>

        <button
          type="button"
          className="auth-google"
          onClick={() => signIn('google', { callbackUrl })}
        >
          <span aria-hidden="true">G</span> Đăng ký với Google
        </button>

        <p className="auth-foot">
          Đã có tài khoản? <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignupForm />
    </Suspense>
  );
}
