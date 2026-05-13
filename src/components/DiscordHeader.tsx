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
    <header className="dc-header">
      {/* Collapse / expand toggle — always visible */}
      <button
        className="dc-collapse-btn"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? <IconSidebarExpand /> : <IconSidebarCollapse />}
      </button>

      {/* Brand: logo + title */}
      <Link href="/" className="dc-header-brand">
        {config.heroImage && (
          <img src={config.heroImage} alt="" className="dc-header-brand-logo" />
        )}
        <span className="dc-header-brand-name">{config.blogTitle}</span>
      </Link>

      {/* Push right-side items to the end */}
      <div className="dc-header-spacer" />

      {/* Right side: dark-mode toggle + search */}
      <div className="dc-header-right">
        {/* Dark mode toggle (placeholder) */}
        <button
          className="dc-header-icon-btn"
          aria-label="Toggle dark mode"
          title="Dark mode (coming soon)"
          onClick={() => alert('Dark mode feature is coming soon!')}
        >
          <IconSun />
        </button>

        {/* Search input — hidden on mobile */}
        <div className="dc-header-search-wrap">
          <IconSearch />
          <input
            type="text"
            className="dc-header-search"
            placeholder="Tìm kiếm bài viết..."
            aria-label="Search"
          />
        </div>

        {/* Search icon — mobile only */}
        <button
          className="dc-header-icon-btn dc-mobile-search-btn"
          aria-label="Open search"
          onClick={() => setMobileSearchOpen(o => !o)}
        >
          <IconSearch />
        </button>
      </div>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className="dc-mobile-search-dropdown">
          <input
            type="text"
            className="dc-mobile-search-input"
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
