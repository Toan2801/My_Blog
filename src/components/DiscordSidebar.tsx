'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SiteConfig } from '@/lib/types';
import ProfileMenu from './ProfileMenu';

/* ---- inline SVG icons (thin outline style) ---- */
const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  articles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  translations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8l6 6" /><path d="M4 14l6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" />
      <path d="M22 22l-5-10-5 10" /><path d="M14 18h6" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polygon points="10 9 16 12 10 15 10 9" />
    </svg>
  ),
  contact: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  random: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  category: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

interface Props {
  config: SiteConfig;
  /** true = icon-only on desktop / fully hidden on mobile */
  collapsed: boolean;
  /** called when user clicks the mobile overlay */
  onClose: () => void;
}

export default function DiscordSidebar({ config, collapsed, onClose }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: icons.home },
    { href: '/articles', label: 'Bài viết', icon: icons.articles },
    { href: '/translations', label: 'Bài dịch', icon: icons.translations },
    { href: '/videos', label: 'Video', icon: icons.video },
    { href: '/contact', label: 'Liên hệ', icon: icons.contact },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay — shown when sidebar is expanded on mobile */}
      <div
        className={`dc-sidebar-overlay${!collapsed ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="dc-sidebar">
        {/* ── Main nav section ── */}
        <div className="dc-sidebar-nav">
          <div className="dc-nav-group">
            <div className="dc-nav-group-title">
              <span className="dc-nav-group-title-text">Điều hướng</span>
            </div>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`dc-nav-item${isActive(item.href) ? ' active' : ''}`}
                onClick={onClose}
                title={item.label}
              >
                <span className="dc-nav-icon">{item.icon}</span>
                <span className="dc-nav-label">{item.label}</span>
              </Link>
            ))}
            <a
              href="/api/articles/random"
              className="dc-nav-item"
              onClick={onClose}
              title="Ngẫu nhiên"
            >
              <span className="dc-nav-icon">{icons.random}</span>
              <span className="dc-nav-label">Ngẫu nhiên</span>
            </a>
          </div>

          {/* Categories */}
          {config.categories.length > 0 && (
            <div className="dc-nav-group">
              <div className="dc-nav-group-title">
                <span className="dc-nav-group-title-text">Chủ đề</span>
              </div>
              {config.categories.map(cat => (
                <Link
                  key={cat}
                  href={`/articles?category=${encodeURIComponent(cat)}`}
                  className="dc-nav-item"
                  onClick={onClose}
                  title={cat}
                >
                  <span className="dc-nav-icon">{icons.category}</span>
                  <span className="dc-nav-label">{cat}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: settings + profile ── */}
        <div className="dc-sidebar-footer">
          {/* Settings */}
          <div className="dc-sidebar-settings">
            <Link
              href="/admin/settings"
              className="dc-nav-item"
              onClick={onClose}
              title="Cài đặt"
            >
              <span className="dc-nav-icon">{icons.settings}</span>
              <span className="dc-nav-label">Cài đặt</span>
            </Link>
          </div>

          {/* Profile — uses existing ProfileMenu */}
          <div className="dc-sidebar-profile">
            <ProfileMenu />
          </div>
        </div>
      </aside>
    </>
  );
}
