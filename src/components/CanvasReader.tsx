'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageFlip } from 'page-flip';
import ReaderToolbar from './ReaderToolbar';

interface Props {
  slug: string;
  articleTitle: string;
}

interface PageInfo {
  pageNumber: number;
  imageUrl: string;
}

export default function CanvasReader({ slug, articleTitle }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const pagesRef = useRef<PageInfo[]>([]);

  /* ── Fetch all page URLs ─────────────────────────────────────── */
  const fetchPages = useCallback(async (): Promise<PageInfo[]> => {
    const res = await fetch(`/api/articles/${slug}/pages`);
    if (!res.ok) throw new Error('Failed to load pages');
    const data = await res.json();
    return data.pages as PageInfo[];
  }, [slug]);

  /* ── Preload all page images ─────────────────────────────────── */
  const preloadImages = useCallback((pages: PageInfo[]): Promise<void> => {
    return new Promise((resolve) => {
      let loaded = 0;
      const total = pages.length;
      if (total === 0) { resolve(); return; }

      pages.forEach(p => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded >= total) resolve();
        };
        img.src = p.imageUrl;
      });
    });
  }, []);

  /* ── Initialize PageFlip ─────────────────────────────────────── */
  useEffect(() => {
    let destroyed = false;

    (async () => {
      try {
        const pages = await fetchPages();
        if (destroyed) return;

        if (!pages.length) {
          setError('Bài viết chưa được rasterize. Vui lòng chạy: npm run rasterize');
          setLoading(false);
          return;
        }

        pagesRef.current = pages;
        setTotalPages(pages.length);

        // Preload all images for instant navigation
        await preloadImages(pages);
        if (destroyed || !containerRef.current) return;

        const isMobile = window.innerWidth <= 768;

        const pf = new PageFlip(containerRef.current, {
          width: 512,
          height: 768,
          size: 'stretch' as const,
          minWidth: 240,
          maxWidth: 512,
          minHeight: 360,
          maxHeight: 768,
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
          startPage: Math.max(0, Math.min(initialPage - 1, pages.length - 1)),
        });

        pf.loadFromImages(pages.map(p => p.imageUrl));

        pf.on('flip', (e) => {
          const pageIndex = e.data as number;
          setCurrentPage(pageIndex);
          const url = new URL(window.location.href);
          url.searchParams.set('page', String(pageIndex + 1));
          window.history.replaceState(null, '', url.toString());
        });

        flipRef.current = pf;
        setCurrentPage(Math.max(0, Math.min(initialPage - 1, pages.length - 1)));
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* ── Keyboard navigation ─────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const pf = flipRef.current;
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
        router.back();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

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

  /* ── Context menu prevention ─────────────────────────────────── */
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
      />

      <div className="reader-viewport">
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
      </div>
    </div>
  );
}
