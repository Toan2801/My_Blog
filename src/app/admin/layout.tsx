'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const ADMIN_PW = 'admin123';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const ok = sessionStorage.getItem('admin_auth');
    if (ok === 'true') setAuth(true);
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PW) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuth(true);
      setError('');
    } else {
      setError('Mật khẩu không đúng');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuth(false);
  };

  if (!auth) {
    return (
      <div className="password-gate">
        <div className="password-card">
          <div className="password-icon">🔒</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-2)' }}>Khu vực Quản trị</h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-5)', fontFamily: 'var(--font-ui)' }}>
            Vui lòng nhập mật khẩu để tiếp tục
          </p>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              type="password"
              className="form-input"
              placeholder="Mật khẩu"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
            />
            {error && <p style={{ color: 'var(--error)', fontSize: '0.82rem', fontFamily: 'var(--font-ui)' }}>{error}</p>}
            <button type="submit" className="btn-primary" style={{ alignSelf: 'stretch' }}>Đăng nhập</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: '📊 Tổng quan', exact: true },
    { href: '/admin/articles/new', label: '✏️ Bài viết mới' },
    { href: '/admin/articles', label: '📋 Quản lý bài viết' },
    { href: '/admin/settings', label: '⚙️ Cài đặt trang' },
    { href: '/admin/donation', label: '💳 Cài đặt QR' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">Sử Ký · Admin</div>
        <ul className="admin-nav">
          {navItems.map(item => (
            <li key={item.href} className="admin-nav-item">
              <Link
                href={item.href}
                className={
                  item.exact ? (pathname === item.href ? 'active' : '') :
                  pathname.startsWith(item.href) ? 'active' : ''
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="admin-nav-item" style={{ marginTop: 'auto' }}>
            <Link href="/" style={{ marginTop: '32px', display: 'block' }}>🏠 Xem trang web</Link>
          </li>
        </ul>
        <button
          onClick={logout}
          style={{ margin: '16px 20px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(253,248,240,0.65)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', width: 'calc(100% - 40px)', textAlign: 'left' }}
        >
          🚪 Đăng xuất
        </button>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
