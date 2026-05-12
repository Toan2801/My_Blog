'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SiteConfig } from '@/lib/types';
import ProfileMenu from './ProfileMenu';

export default function SiteHeader({ config }: { config: SiteConfig }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Header Art Banner */}
      {config.heroImage && (
        <div className="header-banner">
          <Link href="/">
            <img src={config.heroImage} alt={config.blogTitle} className="header-banner-img" />
          </Link>
        </div>
      )}

      {/* Main Navigation (sticky — outside header so sticky works against body scroll) */}
      <nav className="header-nav">
        <div className="header-nav-inner">
          <ul className={`nav-items${menuOpen ? ' open' : ''}`}>
            <li>
              <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Trang chủ
              </Link>
            </li>
            <li className="has-dropdown">
              <Link href="/articles" className={pathname.startsWith('/articles') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Bài viết ▾
              </Link>
              <ul className="dropdown">
                {config.categories.map(cat => (
                  <li key={cat}>
                    <Link href={`/articles?category=${encodeURIComponent(cat)}`} onClick={() => setMenuOpen(false)}>
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link href="/translations" className={pathname.startsWith('/translations') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Bài dịch
              </Link>
            </li>
            <li>
              <Link href="/videos" className={pathname.startsWith('/videos') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Video
              </Link>
            </li>
            <li>
              <Link href="/contact" className={pathname.startsWith('/contact') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Liên hệ
              </Link>
            </li>
            <li>
              <a href="/api/articles/random" onClick={() => setMenuOpen(false)}>Ngẫu nhiên</a>
            </li>
          </ul>
          <div className="header-nav-actions">
            <ProfileMenu />
            <button
              className="header-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
