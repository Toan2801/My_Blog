'use client';

import {
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SiteConfig } from '@/lib/types';
import ProfileMenu from './ProfileMenu';

interface Props {
  config: SiteConfig;
  /** true = icon-only on desktop / fully hidden on mobile */
  collapsed: boolean;
  /** called when user clicks the mobile overlay */
  onClose: () => void;
}

export default function DiscordSidebar({ config, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const SettingsIcon = Cog6ToothIcon;
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
    { href: '/', label: 'Trang chủ', icon: HomeIcon },
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
                <span className={`flex size-4 shrink-0 items-center ${isActive(item.href) ? 'opacity-100' : 'opacity-70'}`}>
                  <item.icon className="size-5" />
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
              <span className="flex size-4 shrink-0 items-center opacity-70">
                <ArrowsRightLeftIcon className="size-5" />
              </span>
              <span className={navLabelClassName}>Ngẫu nhiên</span>
            </a>
          </div>

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
              <span className="flex size-4 shrink-0 items-center opacity-70">
                <SettingsIcon className="size-5" />
              </span>
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
