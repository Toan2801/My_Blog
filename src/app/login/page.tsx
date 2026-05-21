'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setBusy(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      setError('Email hoặc mật khẩu không đúng');
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <main className="bg-vibrant flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-6 left-6 text-2xl font-bold text-white">Daidien</div>

      <div className="w-full max-w-md rounded-md bg-neutral-800 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-white">Chào mừng trở lại!</h1>
        <p className="mb-6 text-center text-sm text-neutral-400">
          Rất vui được gặp lại bạn!
        </p>

        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-300">
              Email <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 rounded-sm border-0 bg-neutral-900 px-3 text-base text-white outline-none focus:ring-1 focus:ring-white/20"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-300">
              Mật khẩu <span className="text-red-500">*</span>
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-sm border-0 bg-neutral-900 px-3 text-base text-white outline-none focus:ring-1 focus:ring-white/20"
            />
            <Link
              href="#"
              className="mt-1 text-xs text-themed hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </label>

          {error && (
            <p className="bg-error rounded px-3 py-2 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-themed h-11 rounded-sm text-base font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="flex h-11 items-center justify-center gap-2 rounded-sm bg-white text-base font-medium text-neutral-900 transition hover:bg-neutral-200"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Đăng nhập với Google
          </button>

          <p className="text-sm text-neutral-400">
            Cần một tài khoản?{' '}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-themed hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-vibrant min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
