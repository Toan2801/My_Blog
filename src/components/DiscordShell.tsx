'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/types';
import DiscordSidebar from './DiscordSidebar';
import DiscordHeader from './DiscordHeader';
import DiscordShellLoading from './DiscordShellLoading';

interface Props {
  config: SiteConfig;
  children: React.ReactNode;
}

export default function DiscordShell({ config, children }: Props) {
  // collapsed = true means sidebar icon-only on desktop, hidden on mobile
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', !collapsed);
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [collapsed]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header spans full page width, always on top */}
      <DiscordHeader
        config={config}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <DiscordSidebar
        config={config}
        collapsed={collapsed}
        onClose={() => setCollapsed(true)}
      />

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
