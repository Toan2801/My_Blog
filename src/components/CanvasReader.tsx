'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageFlip } from 'page-flip';
import ReaderToolbar from './ReaderToolbar';
import ReaderSidebar, { type TocEntry } from './ReaderSidebar';
import { derivePermutation, TILE_COLS, TILE_ROWS, TILE_COUNT } from '@/lib/tile-shuffle';

/** Render a markdown snippet's inline syntax: `code`, _italic_, **bold**. */
function renderInlineMarkdown(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  // Order matters: longer/more-specific delimiters first.
  const regex = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|_([^_\n]+)_|\*([^*\n]+)\*/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > i) nodes.push(<Fragment key={key++}>{text.slice(i, m.index)}</Fragment>);
    if (m[1] !== undefined) nodes.push(<code key={key++}>{m[1]}</code>);
    else if (m[2] !== undefined || m[3] !== undefined) nodes.push(<strong key={key++}>{m[2] ?? m[3]}</strong>);
    else nodes.push(<em key={key++}>{m[4] ?? m[5]}</em>);
    i = m.index + m[0].length;
  }
  if (i < text.length) nodes.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
  return nodes;
}

interface Props {
  slug: string;
  articleTitle: string;
  tocEntries?: TocEntry[];
}

interface PageInfo {
  pageNumber: number;
  imageUrl: string;
}

interface SearchHit {
  pageNumber: number;
  snippet: string;
  count: number;
}

/** How many pages around the current one to keep painted on-canvas. */
const WINDOW_BEHIND = 2;
const WINDOW_AHEAD = 3;

/** Logical (CSS) page dimensions used by page-flip — match rasterize.ts. */
const LOGICAL_W = 512;
const LOGICAL_H = 768;

export default function CanvasReader({ slug, articleTitle, tocEntries = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar starts open on desktop, closed on mobile. The CSS handles
  // the responsive layout; this only seeds the initial state.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768,
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const pagesRef = useRef<PageInfo[]>([]);
  const tokenRef = useRef<string>('');

  // Per-page DOM state: the wrapper div (used by page-flip) and the canvas
  // we paint into. Index = pageNumber - 1.
  const pageElsRef = useRef<HTMLDivElement[]>([]);
  const pageCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  // 'idle' = blank canvas, 'loading' = fetching, 'ready' = painted.
  const pageStatusRef = useRef<('idle' | 'loading' | 'ready')[]>([]);

  /* ── Fetch page metadata + session token ─────────────────────── */
  const fetchPages = useCallback(async (): Promise<{ pages: PageInfo[]; token: string }> => {
    const res = await fetch(`/api/articles/${slug}/pages`);
    if (!res.ok) throw new Error('Failed to load pages');
    const data = await res.json();
    return { pages: data.pages as PageInfo[], token: data.token as string };
  }, [slug]);

  /* ── Tile-unshuffle a page into its canvas ───────────────────── */
  const loadPageInto = useCallback(async (pageIdx: number) => {
    if (pageStatusRef.current[pageIdx] !== 'idle') return;
    const info = pagesRef.current[pageIdx];
    const canvas = pageCanvasesRef.current[pageIdx];
    if (!info || !canvas) return;

    pageStatusRef.current[pageIdx] = 'loading';
    try {
      const url = `${info.imageUrl}?t=${encodeURIComponent(tokenRef.current)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      // Body is a scrambled PNG. The browser will still decode it as PNG
      // bytes (it's structurally valid) — we just route through createImageBitmap.
      const blob = new Blob([bytes], { type: 'image/png' });
      const bitmap = await createImageBitmap(blob);

      const permutation = await derivePermutation(
        tokenRef.current,
        slug,
        info.pageNumber,
      );

      // Size the canvas to the bitmap's native resolution so text stays crisp.
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d unavailable');

      const tileW = bitmap.width / TILE_COLS;
      const tileH = bitmap.height / TILE_ROWS;

      // permutation[i] = original index that was placed at shuffled index i.
      // So tile sitting at shuffled position i belongs at original position
      // permutation[i] when reassembling.
      for (let i = 0; i < TILE_COUNT; i++) {
        const srcCol = i % TILE_COLS;
        const srcRow = Math.floor(i / TILE_COLS);
        const dstIdx = permutation[i];
        const dstCol = dstIdx % TILE_COLS;
        const dstRow = Math.floor(dstIdx / TILE_COLS);
        ctx.drawImage(
          bitmap,
          srcCol * tileW,
          srcRow * tileH,
          tileW,
          tileH,
          dstCol * tileW,
          dstRow * tileH,
          tileW,
          tileH,
        );
      }
      bitmap.close?.();
      pageStatusRef.current[pageIdx] = 'ready';
    } catch (e) {
      pageStatusRef.current[pageIdx] = 'idle';
      console.error(`page ${pageIdx + 1} load failed`, e);
    }
  }, [slug]);

  /* ── Clear a previously-loaded canvas, freeing memory ─────────── */
  const clearPage = useCallback((pageIdx: number) => {
    if (pageStatusRef.current[pageIdx] === 'idle') return;
    const canvas = pageCanvasesRef.current[pageIdx];
    if (canvas) {
      // Setting width clears the bitmap and releases its backing store.
      canvas.width = canvas.width;
    }
    pageStatusRef.current[pageIdx] = 'idle';
  }, []);

  /* ── Sync the loaded window around `center` ─────────────────── */
  const syncWindow = useCallback((center: number) => {
    const total = pagesRef.current.length;
    if (total === 0) return;
    const start = Math.max(0, center - WINDOW_BEHIND);
    const end = Math.min(total - 1, center + WINDOW_AHEAD);

    // Unload anything outside the window.
    for (let i = 0; i < total; i++) {
      if ((i < start || i > end) && pageStatusRef.current[i] !== 'idle') {
        clearPage(i);
      }
    }
    // Load anything inside the window.
    for (let i = start; i <= end; i++) {
      if (pageStatusRef.current[i] === 'idle') {
        void loadPageInto(i);
      }
    }
  }, [loadPageInto, clearPage]);

  /* ── Initialize PageFlip ─────────────────────────────────────── */
  useEffect(() => {
    let destroyed = false;

    (async () => {
      try {
        const { pages, token } = await fetchPages();
        if (destroyed) return;

        if (!pages.length) {
          setError('Bài viết chưa được rasterize. Vui lòng chạy: npm run rasterize');
          setLoading(false);
          return;
        }

        pagesRef.current = pages;
        tokenRef.current = token || '';
        setTotalPages(pages.length);

        // Build the page DOM up-front. Each "page" is a div containing a
        // canvas that we paint into on demand.
        const els: HTMLDivElement[] = [];
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 0; i < pages.length; i++) {
          const div = document.createElement('div');
          div.className = 'reader-page-host';

          const canvas = document.createElement('canvas');
          canvas.className = 'reader-page-canvas';
          // Initial logical size — actual pixel size is set on first paint.
          canvas.width = LOGICAL_W;
          canvas.height = LOGICAL_H;

          const placeholder = document.createElement('div');
          placeholder.className = 'reader-page-placeholder';
          placeholder.textContent = `Trang ${i + 1}`;

          div.appendChild(canvas);
          div.appendChild(placeholder);

          els.push(div);
          canvases.push(canvas);
        }
        pageElsRef.current = els;
        pageCanvasesRef.current = canvases;
        pageStatusRef.current = pages.map(() => 'idle');

        if (!containerRef.current) return;
        const isMobile = window.innerWidth <= 768;
        const startIdx = Math.max(0, Math.min(initialPage - 1, pages.length - 1));

        const pf = new PageFlip(containerRef.current, {
          width: LOGICAL_W,
          height: LOGICAL_H,
          size: 'stretch' as const,
          minWidth: 240,
          maxWidth: LOGICAL_W,
          minHeight: 360,
          maxHeight: LOGICAL_H,
          showCover: true,
          usePortrait: isMobile,
          autoSize: true,
          maxShadowOpacity: 0.5,
          mobileScrollSupport: false,
          useMouseEvents: true,
          swipeDistance: 30,
          showPageCorners: true,
          drawShadow: true,
          flippingTime: 800,
          startZIndex: 0,
          startPage: startIdx,
        });

        pf.loadFromHTML(els);

        pf.on('flip', (e) => {
          const pageIndex = e.data as number;
          setCurrentPage(pageIndex);
          syncWindow(pageIndex);
          const url = new URL(window.location.href);
          url.searchParams.set('page', String(pageIndex + 1));
          window.history.replaceState(null, '', url.toString());
        });

        flipRef.current = pf;
        setCurrentPage(startIdx);
        // Kick off initial window load.
        syncWindow(startIdx);
        setLoading(false);
      } catch (err) {
        if (!destroyed) {
          setError(String(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      destroyed = true;
      if (flipRef.current) {
        flipRef.current.destroy();
        flipRef.current = null;
      }
      pageElsRef.current = [];
      pageCanvasesRef.current = [];
      pageStatusRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* ── Search ──────────────────────────────────────────────────── */
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchHits([]);
      setSearchTotal(0);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/articles/${slug}/search?q=${encodeURIComponent(q)}&t=${encodeURIComponent(tokenRef.current)}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setSearchHits(data.hits as SearchHit[]);
      setSearchTotal(data.total as number);
    } catch {
      setSearchHits([]);
      setSearchTotal(0);
    } finally {
      setSearchLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!searchOpen) return;
    const id = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery, searchOpen, runSearch]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const jumpToHit = useCallback((pageNumber: number) => {
    flipRef.current?.flip(pageNumber - 1);
    setSearchOpen(false);
  }, []);

  /* ── Keyboard navigation ─────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const pf = flipRef.current;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (!pf) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        pf.flipNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        pf.flipPrev();
      }
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        } else {
          router.back();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, searchOpen]);

  /* ── Navigation callbacks ────────────────────────────────────── */
  const goNext = useCallback(() => { flipRef.current?.flipNext(); }, []);
  const goPrev = useCallback(() => { flipRef.current?.flipPrev(); }, []);
  const goToPage = useCallback((page: number) => { flipRef.current?.flip(page - 1); }, []);

  /* ── Fullscreen ──────────────────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    const el = document.querySelector('.reader-layout');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const preventContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  return (
    <div
      className="reader-layout"
      onContextMenu={preventContext}
      onDragStart={(e) => e.preventDefault()}
    >
      <ReaderToolbar
        title={articleTitle}
        currentPage={currentPage + 1}
        totalPages={totalPages}
        onBack={() => router.back()}
        onPageChange={goToPage}
        onFullscreen={toggleFullscreen}
        onSearch={openSearch}
        onToggleSidebar={tocEntries.length > 0 ? () => setSidebarOpen(o => !o) : undefined}
        sidebarOpen={sidebarOpen}
      />

      <div className={`reader-viewport ${sidebarOpen ? 'has-sidebar-open' : ''}`}>
        <ReaderSidebar
          entries={tocEntries}
          currentPage={currentPage + 1}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onJumpToPage={goToPage}
        />
        {loading && (
          <div className="reader-loading">
            <div className="reader-spinner" />
            <p className="reader-loading-text">Đang tải trang sách...</p>
          </div>
        )}

        {error && (
          <div className="reader-error">
            <p>{error}</p>
            <button className="reader-btn" onClick={() => router.back()}>
              ← Quay lại
            </button>
          </div>
        )}

        {!error && (
          <>
            <button
              className="reader-arrow reader-arrow-prev"
              onClick={goPrev}
              disabled={currentPage <= 0}
              aria-label="Previous page"
            >
              ‹
            </button>

            <div className="reader-book-container" ref={containerRef} />

            <button
              className="reader-arrow reader-arrow-next"
              onClick={goNext}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </>
        )}

        {searchOpen && (
          <div className="reader-search-overlay" role="dialog" aria-label="Tìm trong bài">
            <div className="reader-search-panel">
              <div className="reader-search-header">
                <input
                  autoFocus
                  className="reader-search-input"
                  type="search"
                  placeholder="Tìm trong bài viết…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="reader-btn" onClick={closeSearch} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="reader-search-status">
                {searchLoading
                  ? 'Đang tìm…'
                  : searchQuery.trim().length < 2
                    ? 'Nhập ít nhất 2 ký tự'
                    : `${searchTotal} kết quả trên ${searchHits.length} trang`}
              </div>
              <ul className="reader-search-results">
                {searchHits.map((hit) => (
                  <li key={hit.pageNumber}>
                    <button
                      className="reader-search-hit"
                      onClick={() => jumpToHit(hit.pageNumber)}
                    >
                      <span className="reader-search-hit-page">Trang {hit.pageNumber}</span>
                      <span className="reader-search-hit-snippet">{renderInlineMarkdown(hit.snippet)}</span>
                      {hit.count > 1 && (
                        <span className="reader-search-hit-count">×{hit.count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
