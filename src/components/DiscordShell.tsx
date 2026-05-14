'use client';

import { Suspense, useState } from 'react';
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

  return (
    <div className={`dc-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Header spans full page width, always on top */}
      <DiscordHeader
        config={config}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      {/* Body: sidebar + content, sits below the fixed header */}
      <div className="dc-body">
        <DiscordSidebar
          config={config}
          collapsed={collapsed}
          onClose={() => setCollapsed(true)}
        />
        <main className="dc-main-content">
          <div className="dc-content">
            <Suspense fallback={<DiscordShellLoading />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
