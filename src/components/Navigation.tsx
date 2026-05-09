'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ title, categories = [] }: { title: string; categories?: string[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner" style={{ justifyContent: 'center', position: 'relative' }}>

        <button
          className="nav-hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          style={{ position: 'absolute', right: 'var(--space-6)' }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
