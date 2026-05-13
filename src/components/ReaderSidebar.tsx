'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

export interface TocEntry {
  level: number;
  text: string;
  pageNumber: number;
}

interface TocNode extends TocEntry {
  path: string;
  children: TocNode[];
}

export interface NoteEntry {
  text: string;
  pageNumber: number;
}

interface Props {
  entries: TocEntry[];
  notes?: NoteEntry[];
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
  notes = [],
  currentPage,
  open,
  onClose,
  onJumpToPage,
}: Props) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'toc' | 'notes'>('toc');

  // Resizing logic
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(200, Math.min(800, e.clientX));
      const layout = document.querySelector('.reader-layout') as HTMLElement;
      if (layout) {
        layout.style.setProperty('--sidebar-width', `${newWidth}px`);
      } else {
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);


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

  return (
    <>
      <div
        className={`reader-sidebar-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`reader-sidebar ${open ? 'is-open' : ''} ${isResizing ? 'is-resizing' : ''}`}
        aria-label="Menu đọc"
        aria-hidden={!open}
      >
        <div
          className="reader-sidebar-resizer"
          onMouseDown={startResizing}
          title="Kéo để dãn rộng"
        />
        <div className="reader-sidebar-header">
          <div className="reader-sidebar-tabs">
            <button 
              className={`reader-sidebar-tab ${activeTab === 'toc' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('toc')}
            >
              Mục lục
            </button>
            <button 
              className={`reader-sidebar-tab ${activeTab === 'notes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Chú thích {notes.length > 0 && `(${notes.length})`}
            </button>
          </div>
          <button
            type="button"
            className="reader-sidebar-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <nav className="reader-sidebar-nav">
          {activeTab === 'toc' ? (
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
              {entries.length === 0 && (
                <li className="reader-sidebar-empty">Không có mục lục</li>
              )}
            </ul>
          ) : (
            <ul className="reader-notes-list">
              {notes.map((note, idx) => (
                <li key={idx} className="reader-note-sidebar-item">
                  <button 
                    type="button" 
                    className="reader-note-sidebar-link"
                    onClick={() => handleJump(note.pageNumber)}
                  >
                    <span className="reader-note-sidebar-page">Trang {note.pageNumber}</span>
                    <span className="reader-note-sidebar-text">{note.text}</span>
                  </button>
                </li>
              ))}
              {notes.length === 0 && (
                <li className="reader-sidebar-empty">Không có chú thích</li>
              )}
            </ul>
          )}
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
