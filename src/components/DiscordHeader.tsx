'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SiteConfig } from '@/lib/types';

interface Props {
  config: SiteConfig;
  collapsed: boolean;
  onToggle: () => void;
}

/* SVG for the sidebar-panel collapse/expand */
const IconSidebarCollapse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="12 9 9 12 12 15" />
  </svg>
);

const IconSidebarExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="15 9 18 12 15 15" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export default function DiscordHeader({ config, collapsed, onToggle }: Props) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-2 border-b border-normal bg-base pl-2 pr-4 max-sm:pr-2 max-sm:pl-1">
      {/* Collapse / expand toggle — always visible */}
      <button
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent text-subtle transition-colors hover:bg-hover hover:text-normal [&_svg]:size-5"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? <IconSidebarExpand /> : <IconSidebarCollapse />}
      </button>

      {/* Brand: logo + title */}
      <Link href="/" className="group flex shrink-0 items-center gap-2.5 no-underline">
        {config.heroImage && (
          <img src={config.heroImage} alt="" className="h-8 w-auto rounded-md object-cover" />
        )}
        <span className="max-md:max-w-36 max-md:overflow-hidden max-md:text-ellipsis whitespace-nowrap text-base font-bold text-normal group-hover:text-themed max-md:text-sm">
          {config.blogTitle}
        </span>
      </Link>

      {/* Push right-side items to the end */}
      <div className="flex-1" />

      {/* Right side: dark-mode toggle + search */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Dark mode toggle (placeholder) */}
        <button
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-subtle transition-colors hover:bg-hover hover:text-normal [&_svg]:size-5"
          aria-label="Toggle dark mode"
          title="Dark mode (coming soon)"
          onClick={() => alert('Dark mode feature is coming soon!')}
        >
          <IconSun />
        </button>

        {/* Search input — hidden on mobile */}
        <div className="flex h-8 min-w-[220px] max-w-[320px] items-center gap-2 rounded-lg border border-normal bg-surface px-3.5 transition focus-within:bg-base max-md:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted">
          <IconSearch />
          <input
            type="text"
            className="w-full border-0 bg-transparent text-sm text-normal outline-none placeholder:text-muted"
            placeholder="Tìm kiếm bài viết..."
            aria-label="Search"
          />
        </div>

        {/* Search icon — mobile only */}
        <button
          className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-subtle transition-colors hover:bg-hover hover:text-normal max-md:flex [&_svg]:size-5"
          aria-label="Open search"
          onClick={() => setMobileSearchOpen(o => !o)}
        >
          <IconSearch />
        </button>
      </div>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className="absolute left-0 right-0 top-12 z-50 border-b border-normal bg-base px-4 py-2.5 shadow-md">
          <input
            type="text"
            className="w-full rounded-full border border-normal bg-surface px-4 py-2.5 text-sm text-normal outline-none focus:border-themed"
            placeholder="Tìm kiếm bài viết..."
            autoFocus
            aria-label="Search"
            onBlur={() => setMobileSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
