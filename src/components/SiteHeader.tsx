'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteConfig } from '@/lib/types';
import Navigation from './Navigation';

export default function SiteHeader({ config }: { config: SiteConfig }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="site-header">
      <Navigation title={config.blogTitle} categories={config.categories} />
      
      {/* Hero Section - Compact and unified on all pages */}
      <section className="hero hero-compact">
        {config.heroImage && (
          <div className="hero-logo-container">
            <img src={config.heroImage} alt={config.blogTitle} className="hero-logo-image" />
          </div>
        )}

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {isHome && config.blogSubtitle && <p className="hero-eyebrow">{config.blogSubtitle}</p>}
          {/* Removed redundant h1 title here as it's already in the Navigation */}
          {isHome && config.blogDescription && (
            <p className="hero-description" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.8)' }}>
              {config.blogDescription}
            </p>
          )}
        </div>
      </section>
    </header>
  );
}
