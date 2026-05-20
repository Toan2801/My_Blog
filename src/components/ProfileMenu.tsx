'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  collapsed?: boolean;
}

export default function ProfileMenu({ collapsed = false }: Props) {
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
    return (
      <div
        className={collapsed
          ? 'mx-auto size-8 rounded-full bg-[#f0f0f3]'
          : 'h-8 w-full rounded-lg bg-[#f0f0f3]'}
        aria-hidden="true"
      />
    );
  }

  if (!session?.user) {
    if (collapsed) return null;

    return (
      <Link href="/login" className="block px-1 py-2 text-sm no-underline text-themed">
        Đăng nhập
      </Link>
    );
  }

  const user = session.user;
  const initial = (user.name || user.email || '?').slice(0, 1).toUpperCase();
  const isAdmin = user.role === 'admin';

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className={collapsed
          ? 'flex w-full items-center justify-center rounded-lg px-0 py-2 transition-colors hover:bg-hover'
          : 'flex w-full items-center gap-2.5 rounded-lg px-1 py-2 transition-colors hover:bg-hover'}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        title={user.email ?? ''}
      >
        {user.image ? (
          <img src={user.image} alt="" className="inline-flex size-[26px] rounded-full object-cover" />
        ) : (
          <span className="inline-flex size-[26px] items-center justify-center rounded-full bg-[#c68a2b] font-serif text-[0.85rem] font-bold text-white">
            {initial}
          </span>
        )}
        {!collapsed && (
          <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-normal">
            {user.name || user.email?.split('@')[0]}
          </span>
        )}
        {!collapsed && <span className="text-xs text-muted" aria-hidden="true">▾</span>}
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-auto bottom-full z-[1000] mb-1 min-w-[220px] rounded-lg border border-[#e5e5e9] bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
          role="menu"
        >
          <div className="mb-1 flex flex-col gap-1 border-b border-[#f0f0f3] px-3 py-2.5 text-[0.88rem]">
            <strong>{user.name || user.email}</strong>
            <span
              className={isAdmin
                ? 'self-start rounded-full bg-[#c68a2b] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-white'
                : 'self-start rounded-full bg-[#f0f0f3] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-[#6c6c73]'}
            >
              {isAdmin ? 'Quản trị viên' : 'Bạn đọc'}
            </span>
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="block w-full rounded px-3 py-2 text-left text-[0.88rem] text-[#1a1a1a] no-underline hover:bg-[#fdf4e0]"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <Link
            href="/settings"
            className="block w-full rounded px-3 py-2 text-left text-[0.88rem] text-[#1a1a1a] no-underline hover:bg-[#fdf4e0]"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="mt-1 block w-full rounded border-0 border-t border-[#f0f0f3] bg-transparent px-3 py-2 text-left text-[0.88rem] text-[#b3261e] hover:bg-[#fdf4e0]"
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
