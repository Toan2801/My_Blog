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
      
      {/* Hero Section - Compact and unified on all pages */}
      <section className="hero hero-compact">
        {config.heroImage && (
          <div className="hero-logo-container">
            <img src={config.heroImage} alt={config.blogTitle} className="hero-logo-image" />
          </div>
        )}
      </section>

      {/* Main Navigator - Now sticky and container-aligned */}
      <nav className="main-nav-premium">
        <div className="main-nav-premium-inner">
          <Link href="/" className={`nav-link-premium ${pathname === '/' ? 'active' : ''}`}>Trang chủ</Link>
          <Link href="/articles" className={`nav-link-premium ${pathname.startsWith('/articles') ? 'active' : ''}`}>Bài viết</Link>
          <Link href="/translations" className={`nav-link-premium ${pathname.startsWith('/translations') ? 'active' : ''}`}>Bài dịch</Link>
          <Link href="/videos" className={`nav-link-premium ${pathname.startsWith('/videos') ? 'active' : ''}`}>Video</Link>
          <Link href="/contact" className={`nav-link-premium ${pathname.startsWith('/contact') ? 'active' : ''}`}>Liên hệ</Link>
          <a href="/api/articles/random" className="nav-link-premium">✨ Ngẫu nhiên</a>
        </div>
      </nav>
    </header>
  );
}
