'use client';

import { useEffect, useRef } from 'react';

export default function ArticleBody({ content, highlight }: { content: string; highlight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight || !containerRef.current) return;

    const term = highlight.trim().toLowerCase();
    if (!term) return;

    // Traverses the DOM tree to find and highlight the first matching text node
    const walk = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue || '';
        const idx = val.toLowerCase().indexOf(term);
        if (idx !== -1) {
          const parent = node.parentNode;
          if (parent && parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE') {
            const before = val.substring(0, idx);
            const match = val.substring(idx, idx + term.length);
            const after = val.substring(idx + term.length);

            const nodes: Node[] = [];
            if (before) nodes.push(document.createTextNode(before));
            
            const mark = document.createElement('mark');
            mark.textContent = match;
            mark.style.backgroundColor = '#fdf3cd';
            mark.style.color = '#856404';
            mark.style.padding = '2px 4px';
            mark.style.borderRadius = '3px';
            mark.style.border = '1px solid #ffeeba';
            mark.style.fontWeight = 'bold';
            mark.style.boxShadow = '0 0 8px rgba(255, 193, 7, 0.4)';
            nodes.push(mark);

            if (after) nodes.push(document.createTextNode(after));

            // Replace the original text node with the new nodes
            const fragment = document.createDocumentFragment();
            nodes.forEach(n => fragment.appendChild(n));
            parent.replaceChild(fragment, node);

            // Scroll the mark element into view after a short delay
            setTimeout(() => {
              mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);

            return true; // Match found, stop walking
          }
        }
      } else {
        const children = Array.from(node.childNodes);
        for (const child of children) {
          if (walk(child)) return true;
        }
      }
      return false;
    };

    walk(containerRef.current);
  }, [highlight]);

  return (
    <div 
      ref={containerRef}
      className="article-body article-content"
      style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
