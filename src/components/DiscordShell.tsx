'use client';

import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  MagnifyingGlassIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import * as OutlineIcons from '@heroicons/react/24/outline';
import * as SolidIcons from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { SiteConfig, MenuItem, LogoConfig } from '@/lib/types';
import ProfileMenu from './ProfileMenu';
import DiscordShellLoading from './DiscordShellLoading';

type HeroIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function resolveIcon(name: string, variant: 'outline' | 'solid'): HeroIconComponent | null {
  const registry = variant === 'solid'
    ? (SolidIcons as Record<string, HeroIconComponent>)
    : (OutlineIcons as Record<string, HeroIconComponent>);
  return registry[name] ?? null;
}

interface Props {
  config: SiteConfig;
  children: React.ReactNode;
  menuItems: MenuItem[];
  logoConfig: LogoConfig;
}

export default function DiscordShell({ config, children, menuItems, logoConfig }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const sidebarOpen = !collapsed;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', !collapsed);
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [collapsed]);

  const SidebarToggleIcon = collapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-2 border-b border-normal bg-transparent pl-2 pr-4 max-sm:pr-2 max-sm:pl-1">
        <button
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent text-subtle transition-colors hover:bg-muted hover:text-normal [&_svg]:size-5"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
        >
          <SidebarToggleIcon />
        </button>

        <Link href="/" className="group flex shrink-0 items-center gap-2.5 no-underline">
          <span
            className="text-han inline-flex items-center ml-2 text-xl font-bold leading-none text-strong"
            aria-label="经书大典"
          >
            <span className='whitespace-nowrap inline-flex'>
              <span className='p-1 inline-flex'>
                {logoConfig.subDomain.map(item => (
                  <span className={`overflow-hidden transform-gpu transition-all duration-200 ease-in-out ${sidebarOpen || !item.isHiddenOnCollapse ? 'max-w-24' : 'max-w-0'}`}>
                    <span className={`transform-gpu transition-transform duration-200 ease-in-out  ${(sidebarOpen || !item.isHiddenOnCollapse) ? 'origin-left scale-x-100' : 'origin-left scale-x-0'}`}>
                      {item.text}
                    </span>
                  </span>
                ))}
              </span>

              <span className='p-1 inline-flex rounded bg-zinc-300'>
                {logoConfig.domain.map(item => (
                  <span className={`overflow-hidden transform-gpu transition-all duration-200 ease-in-out ${sidebarOpen || !item.isHiddenOnCollapse ? 'max-w-24' : 'max-w-0'}`}>
                    <span className={`bg-logo bg-clip-text text-transparent transform-gpu transition-transform duration-200 ease-in-out  ${(sidebarOpen || !item.isHiddenOnCollapse) ? 'origin-left scale-x-100' : 'origin-left scale-x-0'}`}>
                      {item.text}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </span>
          <span className="max-md:max-w-36 max-md:overflow-hidden max-md:text-ellipsis whitespace-nowrap text-base font-bold text-normal group-hover:text-themed max-md:text-sm">
            {config.blogTitle}
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-subtle transition-colors hover:bg-muted hover:text-normal [&_svg]:size-5"
            aria-label="Toggle dark mode"
            title="Dark mode (coming soon)"
            onClick={() => alert('Dark mode feature is coming soon!')}
          >
            <SunIcon />
          </button>

          <div className="flex h-8 min-w-[220px] max-w-[320px] items-center gap-2 rounded-lg border border-normal bg-muted px-3.5 transition focus-within:bg-normal max-md:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600 dark:[&_svg]:text-neutral-400">
            <MagnifyingGlassIcon />
            <input
              type="text"
              className="w-full border-0 bg-transparent text-sm text-normal outline-none placeholder:text-muted"
              placeholder="Tìm kiếm bài viết..."
              aria-label="Search"
            />
          </div>

          <button
            className="hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-subtle transition-colors hover:bg-muted hover:text-normal max-md:flex [&_svg]:size-5"
            aria-label="Open search"
            onClick={() => setMobileSearchOpen(o => !o)}
          >
            <MagnifyingGlassIcon />
          </button>
        </div>

        {mobileSearchOpen && (
          <div className="absolute left-0 right-0 top-12 z-50 border-b border-normal bg-normal px-4 py-2.5 shadow-md">
            <input
              type="text"
              className="w-full rounded-full border border-normal bg-muted px-4 py-2.5 text-sm text-normal outline-none focus:border-themed"
              placeholder="Tìm kiếm bài viết..."
              autoFocus
              aria-label="Search"
              onBlur={() => setMobileSearchOpen(false)}
            />
          </div>
        )}
      </header>

      {/* ── Sidebar ── */}
      <div
        className={`hidden max-md:fixed max-md:inset-0 max-md:top-12 max-md:z-30 max-md:bg-black/40 ${!collapsed ? 'max-md:block' : ''}`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />

      <aside className={`fixed bottom-0 left-0 top-0 pt-12 z-30 flex flex-col overflow-x-hidden overflow-y-auto border-r border-normal bg-subtle transition-all duration-200 max-md:z-40 ${collapsed ? 'w-12 max-md:w-72 max-md:-translate-x-full' : 'w-72 max-md:w-screen max-md:translate-x-0'}`}>
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className='px-2 pb-1 pt-2'>
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative mb-px flex items-center overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium no-underline transition-colors gap-2 px-2 py-2 hover:bg-hover hover:text-normal ${ isActive(item.href) ? 'font-semibold text-strong' : 'cursor-pointer text-muted'}`}
                onClick={() => setCollapsed(true)}
                title={item.label}
              >
                <span className={`flex size-4 shrink-0 items-center ${ isActive(item.href) ? 'opacity-100' : 'opacity-70'}`}>
                  {(() => {
                    const Icon = resolveIcon(item.icon, isActive(item.href) ? 'solid' : 'outline');
                    return Icon ? <Icon className="size-5" /> : null;
                  })()}
                </span>
                <span className={`${ collapsed ? 'hidden' : 'flex-1 overflow-hidden text-ellipsis transition-all duration-200'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-normal max-md:flex max-md:flex-col">
          <div className={`border-normal ${collapsed ? 'flex justify-center p-2' : 'px-3 pb-2.5 pt-2'} max-md:order-first max-md:border-b max-md:p-3`}>
            <ProfileMenu collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* ── Header-height filler behind the sidebar toggle area ── */}
      <div
        className={`pointer-events-none fixed right-0 top-0 z-40 h-12 bg-strong transition-all duration-200 max-md:left-0 ${
        collapsed ? 'left-12' : 'left-72'
        }`}
      />

      <main
        className={`mt-12 flex min-w-0 min-h-12 flex-1 flex-col bg-strong transition-all duration-200 max-md:ml-0 ${collapsed ? 'ml-12' : 'ml-72'}`}
      >
        <div
          className={isAdminRoute
            ? 'box-border w-full flex-1 bg-transparent max-w-none p-0'
            : 'box-border m-0 mx-auto w-full max-w-7xl flex-1 bg-transparent px-8 py-6 max-md:p-4 max-sm:p-3'}
        >
          <Suspense fallback={<DiscordShellLoading />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
