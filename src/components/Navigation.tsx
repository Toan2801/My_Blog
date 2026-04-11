'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ title, categories = [] }: { title: string; categories?: string[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };


  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          {title}
        </Link>

        <ul className={`nav-links${open ? ' open' : ''}`}>
          <li>
            <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setOpen(false)}>
              Trang Chủ
            </Link>
          </li>
          
          <li className="nav-dropdown">
            <Link 
              href="/articles" 
              className={pathname.startsWith('/articles') ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              Bài Viết
            </Link>
            {categories.length > 0 && (
              <ul className="dropdown-menu">
                {categories.map(cat => (
                  <li key={cat}>
                    <Link href={`/articles?category=${encodeURIComponent(cat)}`} onClick={() => setOpen(false)}>
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <Link href="/contact" className={pathname === '/contact' ? 'active' : ''} onClick={() => setOpen(false)}>
              Liên Hệ
            </Link>
          </li>
          <li className="search-nav">
            <form action="/articles" method="GET" style={{ position: 'relative' }}>
              <input
                type="text"
                name="search"
                placeholder="Tìm kiếm..."
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-ui)',
                  background: 'var(--surface)',
                  width: '150px'
                }}
              />
            </form>
          </li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
