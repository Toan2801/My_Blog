'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export default function ProfileMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (status === 'loading') {
    return <div className="profile-menu-skel" aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className="profile-login-btn">
        Đăng nhập
      </Link>
    );
  }

  const user = session.user;
  const initial = (user.name || user.email || '?').slice(0, 1).toUpperCase();
  const isAdmin = user.role === 'admin';

  return (
    <div className="profile-menu" ref={ref}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.email ?? ''}
      >
        {user.image ? (
          <img src={user.image} alt="" className="profile-avatar" />
        ) : (
          <span className="profile-avatar profile-avatar-fallback">{initial}</span>
        )}
        <span className="profile-name">{user.name || user.email?.split('@')[0]}</span>
        <span className="profile-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-header">
            <strong>{user.name || user.email}</strong>
            <span className={`profile-role-pill ${isAdmin ? 'is-admin' : ''}`}>
              {isAdmin ? 'Quản trị viên' : 'Bạn đọc'}
            </span>
          </div>
          {isAdmin && (
            <Link href="/admin" className="profile-dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
              Admin Dashboard
            </Link>
          )}
          <Link href="/settings" className="profile-dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button
            type="button"
            className="profile-dropdown-item profile-dropdown-signout"
            onClick={() => signOut({ callbackUrl: '/login' })}
            role="menuitem"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
