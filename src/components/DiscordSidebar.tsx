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
  const sidebarClassName = [
    'fixed bottom-0 left-0 top-12 z-30 flex flex-col overflow-x-hidden overflow-y-auto bg-surface transition-all duration-200 max-md:z-40',
    collapsed ? 'w-12 max-md:w-72 max-md:-translate-x-full' : 'w-72 max-md:w-screen max-md:translate-x-0',
  ].join(' ');
  const navGroupClassName = collapsed ? 'px-2 pb-1 pt-2' : 'px-2 pb-1 pt-3';
  const navItemClassName = (active = false) => [
    'relative mb-px flex items-center overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium no-underline transition-colors hover:bg-hover hover:text-normal',
    collapsed ? 'justify-center gap-2.5 px-0 py-2.5' : 'gap-2.5 px-2 py-1.5',
    active ? 'font-semibold text-themed' : 'cursor-pointer text-subtle',
  ].join(' ');
  const navLabelClassName = collapsed ? 'hidden' : 'flex-1 overflow-hidden text-ellipsis transition-all duration-200';
  const profileWrapperClassName = [
    'border-normal',
    collapsed ? 'flex justify-center p-2' : 'px-3 pb-2.5 pt-2',
    'max-md:order-first max-md:border-b max-md:p-3',
  ].join(' ');

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
        className={`hidden max-md:fixed max-md:inset-0 max-md:top-12 max-md:z-30 max-md:bg-black/40 ${!collapsed ? 'max-md:block' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={sidebarClassName}>
        {/* ── Main nav section ── */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className={navGroupClassName}>
            <div className="flex cursor-default select-none items-center justify-between overflow-hidden whitespace-nowrap px-2 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted">
              <span className={collapsed ? 'hidden' : ''}>Điều hướng</span>
            </div>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClassName(isActive(item.href))}
                onClick={onClose}
                title={item.label}
              >
                <span className={`flex size-4 shrink-0 items-center [&_svg]:size-5 ${isActive(item.href) ? 'opacity-100' : 'opacity-70'}`}>
                  {item.icon}
                </span>
                <span className={navLabelClassName}>{item.label}</span>
              </Link>
            ))}
            <a
              href="/api/articles/random"
              className={navItemClassName(false)}
              onClick={onClose}
              title="Ngẫu nhiên"
            >
              <span className="flex size-4 shrink-0 items-center opacity-70 [&_svg]:size-5">{icons.random}</span>
              <span className={navLabelClassName}>Ngẫu nhiên</span>
            </a>
          </div>

          {/* Categories */}
          {config.categories.length > 0 && (
            <div className={navGroupClassName}>
              <div className="flex cursor-default select-none items-center justify-between overflow-hidden whitespace-nowrap px-2 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                <span className={collapsed ? 'hidden' : ''}>Chủ đề</span>
              </div>
              {config.categories.map(cat => (
                <Link
                  key={cat}
                  href={`/articles?category=${encodeURIComponent(cat)}`}
                  className={navItemClassName(false)}
                  onClick={onClose}
                  title={cat}
                >
                  <span className="flex size-4 shrink-0 items-center opacity-70 [&_svg]:size-5">{icons.category}</span>
                  <span className={navLabelClassName}>{cat}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: settings + profile ── */}
        <div className="shrink-0 border-t border-normal max-md:flex max-md:flex-col">
          {/* Settings */}
          <div className="p-2">
            <Link
              href="/admin/settings"
              className={navItemClassName(false)}
              onClick={onClose}
              title="Cài đặt"
            >
              <span className="flex size-4 shrink-0 items-center opacity-70 [&_svg]:size-5">{icons.settings}</span>
              <span className={navLabelClassName}>Cài đặt</span>
            </Link>
          </div>

          {/* Profile — uses existing ProfileMenu */}
          <div className={profileWrapperClassName}>
            <ProfileMenu collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
