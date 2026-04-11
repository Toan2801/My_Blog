'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    // Scan the DOM for headings within the article content
    const timer = setTimeout(() => {
      const parent = document.querySelector('.article-content');
      if (!parent) return;

      const headings = Array.from(parent.querySelectorAll('h1, h2, h3, h4'));
      const tocItems: TocItem[] = headings.map((h, index) => {
        const text = h.textContent || '';
        let id = h.getAttribute('id');
        if (!id) {
          id = `sect-${index}`;
          h.setAttribute('id', id);
        }

        return {
          id,
          text,
          level: parseInt(h.tagName[1]),
        };
      });
      setItems(tocItems);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              setActive(e.target.id);
            }
          });
        },
        { rootMargin: '-10% 0px -70% 0px' }
      );

      headings.forEach(h => observer.observe(h));
      return () => observer.disconnect();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="toc-container" aria-label="Mục lục bài viết">
      <div className="toc-header">
        <span className="toc-icon">📜</span>
        <span className="toc-title">Mục lục</span>
      </div>
      <ul className="toc-list">
        {items.map(item => (
          <li key={item.id} className={`toc-item toc-level-${item.level}`}>
            <a
              href={`#${item.id}`}
              className={`toc-link ${active === item.id ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  const offset = 80; // Offset for header/padding
                  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                  const offsetPosition = elementPosition - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              <span className="toc-text">{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
