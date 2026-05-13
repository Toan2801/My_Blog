'use client';

import { useMemo, useState } from 'react';

export interface TocEntry {
  level: number;
  text: string;
  pageNumber: number;
}

interface TocNode extends TocEntry {
  path: string;
  children: TocNode[];
}

interface Props {
  entries: TocEntry[];
  currentPage: number;
  /** True when the sidebar is visible (controlled by parent). */
  open: boolean;
  /** Called when the user clicks the close/backdrop. */
  onClose: () => void;
  /** Called when the user clicks a TOC entry. */
  onJumpToPage: (page: number) => void;
}

/** Build a nested tree from a flat list of headings, using level as depth. */
function buildTree(entries: TocEntry[]): TocNode[] {
  const root: TocNode = { level: 0, text: '', pageNumber: 0, path: '', children: [] };
  const stack: TocNode[] = [root];
  entries.forEach((e, i) => {
    while (stack.length > 1 && stack[stack.length - 1].level >= e.level) stack.pop();
    const parent = stack[stack.length - 1];
    const path = parent.path === '' ? `${i}` : `${parent.path}.${parent.children.length}`;
    const node: TocNode = { ...e, path, children: [] };
    parent.children.push(node);
    stack.push(node);
  });
  return root.children;
}

export default function ReaderSidebar({
  entries,
  currentPage,
  open,
  onClose,
  onJumpToPage,
}: Props) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleJump = (page: number) => {
    onJumpToPage(page);
    // Auto-close on mobile only — desktop sidebar stays put.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  if (entries.length === 0) return null;

  return (
    <>
      <div
        className={`reader-sidebar-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`reader-sidebar ${open ? 'is-open' : ''}`}
        aria-label="Mục lục"
        aria-hidden={!open}
      >
        <div className="reader-sidebar-header">
          <span className="reader-sidebar-title">Mục lục</span>
          <button
            type="button"
            className="reader-sidebar-close"
            onClick={onClose}
            aria-label="Đóng mục lục"
          >
            ✕
          </button>
        </div>
        <nav className="reader-sidebar-nav">
          <ul className="reader-toc-list">
            {tree.map((node) => (
              <TocNodeView
                key={node.path}
                node={node}
                currentPage={currentPage}
                onJump={handleJump}
                collapsed={collapsed}
                toggle={toggle}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

interface NodeProps {
  node: TocNode;
  currentPage: number;
  onJump: (page: number) => void;
  collapsed: Set<string>;
  toggle: (path: string) => void;
}

function TocNodeView({ node, currentPage, onJump, collapsed, toggle }: NodeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.path);
  const isActive = currentPage === node.pageNumber;

  return (
    <li className={`reader-toc-item reader-toc-level-${node.level}`}>
      <div className="reader-toc-row">
        {hasChildren ? (
          <button
            type="button"
            className="reader-toc-toggle"
            onClick={() => toggle(node.path)}
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            aria-expanded={!isCollapsed}
          >
            <span className={`reader-toc-chevron ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
          </button>
        ) : (
          <span className="reader-toc-toggle reader-toc-toggle-placeholder" aria-hidden="true" />
        )}
        <button
          type="button"
          className={`reader-toc-link ${isActive ? 'is-active' : ''}`}
          onClick={() => onJump(node.pageNumber)}
        >
          <span className="reader-toc-text">{node.text}</span>
          <span className="reader-toc-page">{node.pageNumber}</span>
        </button>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="reader-toc-children">
          {node.children.map((child) => (
            <TocNodeView
              key={child.path}
              node={child}
              currentPage={currentPage}
              onJump={onJump}
              collapsed={collapsed}
              toggle={toggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
