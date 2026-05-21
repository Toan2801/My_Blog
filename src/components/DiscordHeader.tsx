'use client';

import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  MagnifyingGlassIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import type { SiteConfig } from '@/lib/types';

interface Props {
  config: SiteConfig;
  collapsed: boolean;
  onToggle: () => void;
}

export default function DiscordHeader({ config, collapsed, onToggle }: Props) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const SidebarToggleIcon = collapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-2 border-b border-normal bg-base pl-2 pr-4 max-sm:pr-2 max-sm:pl-1">
      {/* Collapse / expand toggle — always visible */}
      <button
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent text-subtle transition-colors hover:bg-hover hover:text-normal [&_svg]:size-5"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
      >
        <SidebarToggleIcon />
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
          <SunIcon />
        </button>

        {/* Search input — hidden on mobile */}
        <div className="flex h-8 min-w-[220px] max-w-[320px] items-center gap-2 rounded-lg border border-normal bg-surface px-3.5 transition focus-within:bg-base max-md:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600 dark:[&_svg]:text-neutral-400">
          <MagnifyingGlassIcon />
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
          <MagnifyingGlassIcon />
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
