# Plan: Canvas-Based Reading Experience

## Reference Behavior (hochiminh.vn)

The reference site renders book/article content as **pre-rendered page images** (PNG, base64-encoded) inside a dedicated full-viewport reader. Users see one or two page images at a time and navigate with prev/next controls. The content is never present as selectable HTML text in the DOM, which prevents copying, scraping, and browser-extension text extraction.

Key observed traits:
- Each "page" is a single `<img>` element whose `src` is a `data:image/png;base64,...` blob.
- No raw text appears anywhere in the DOM — the article body is entirely image-based.
- A minimal toolbar sits above or overlays the reader (back button, page nav, zoom, fullscreen).
- The reader occupies the full viewport; standard site header/footer are hidden while reading.
- Page images are fetched on demand (not all at once) to avoid large initial payloads.
- Right-click context menu is suppressed in the reader area.

---

## Proposed Architecture

### Overview

Render article HTML content into **canvas elements** on the client, producing a page-by-page reading experience that never exposes raw text in the DOM. The server sends content only to authenticated/authorized API calls, and the client immediately paints it onto canvas.

### Component Tree

```
<CanvasReaderPage>                     ← full-screen route (e.g. /read/[slug])
  <ReaderToolbar />                    ← back, page indicator, zoom, fullscreen, font size
  <CanvasViewport>                     ← manages canvas sizing, gesture detection
    <canvas />                         ← the actual rendering surface
  </CanvasViewport>
  <PageControls />                     ← prev/next arrows, keyboard/swipe handlers
</CanvasReaderPage>
```

### 1. Content Delivery (Server → Client)

| Step | Detail |
|------|--------|
| **API route** | `GET /api/articles/[slug]/pages?page=N` — returns a JSON payload `{ totalPages, html }` containing a single page's HTML fragment. The route checks that the request is from an active browser session (via cookie or referer header) rather than a raw scraper. |
| **Server-side pagination** | `src/lib/paginate.ts` — splits the article's full HTML into page-sized chunks. Splitting is done by estimated character/word count fitting a target viewport (e.g. ~800 words per page at default font size). Headings are never orphaned at the bottom of a page. |
| **No bulk endpoint** | There is intentionally no endpoint that returns the entire article body in one request. Each page must be fetched individually. |

### 2. Canvas Rendering (Client)

| Step | Detail |
|------|--------|
| **Off-screen HTML → Canvas** | Use an off-screen `<div>` (positioned off-viewport with `position: fixed; left: -9999px`) to inject the page HTML. Let the browser lay it out with the desired fonts, line-height, and column width. Then use `html2canvas` (or a lightweight alternative like `modern-screenshot`) to rasterize that `<div>` into an `ImageBitmap`, and draw it onto the visible `<canvas>`. |
| **Canvas sizing** | The `<canvas>` element fills the viewport minus toolbar height. On resize / orientation change, re-render the current page. |
| **High-DPI** | Render at `window.devicePixelRatio` scale so text remains sharp on Retina displays. |
| **Page cache** | Keep the last 3 rendered `ImageBitmap` objects in a `Map<number, ImageBitmap>` so prev/next navigation is instant. Evict beyond 3 to limit memory. |
| **Cleanup** | After painting to canvas, immediately remove the off-screen `<div>` content so the text never lingers in the DOM. |

### 3. Navigation

| Feature | Implementation |
|---------|---------------|
| **Prev / Next buttons** | Render `←` and `→` arrow buttons overlaying the canvas edges. |
| **Keyboard** | `ArrowLeft` / `ArrowRight` / `PageUp` / `PageDown`. |
| **Swipe** | Touch events: `touchstart` / `touchend` horizontal delta > 50px triggers page change. |
| **Page indicator** | `Page 3 / 42` in the toolbar, with an optional page-number input for direct jump. |
| **URL sync** | Update `?page=N` search param on navigation so the browser back button and link sharing work. |

### 4. Zoom / Font Size

| Feature | Implementation |
|---------|---------------|
| **Zoom** | Three presets: 100%, 125%, 150%. Changing zoom re-paginates the content (different word count per page) and re-renders. |
| **Pinch-zoom (mobile)** | Use CSS `touch-action: none` on the canvas and handle `gesturechange` / pointer events to scale the canvas bitmap without re-paginating (visual zoom only). |

### 5. Fullscreen

Use the Fullscreen API (`element.requestFullscreen()`) toggled by a toolbar button. On exit, restore the previous layout. Fall back to a CSS-only "pseudo-fullscreen" (fixed positioning, z-index above everything) on browsers that block the API.

### 6. Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥ 1024px)** | Two-column "book spread" layout showing two canvas pages side by side. |
| **Tablet (768–1023px)** | Single page, landscape-aware. If landscape, optionally show two pages. |
| **Mobile (< 768px)** | Single page. Toolbar collapses to icons only. Swipe is the primary navigation. |

The off-screen `<div>` used for rasterization is sized to match the canvas viewport, so pagination automatically adapts to screen size.

---

## Content Protection Strategy

### Goal

Make casual copying impractical while acknowledging that a sufficiently motivated user with browser devtools can always capture screen pixels. The goal is **deterrence**, not DRM.

### Layers

| Layer | Technique |
|-------|-----------|
| **No text in DOM** | Content is rendered to `<canvas>`. `Ctrl+A`, `Ctrl+C`, and browser "Select All" yield nothing. |
| **Disable context menu** | `oncontextmenu="return false"` on the canvas and its parent. |
| **Disable drag** | `draggable="false"` and `ondragstart="return false"` on the canvas. |
| **CSS user-select** | `user-select: none` on the entire reader viewport. |
| **Print prevention** | A `@media print` CSS rule that hides the canvas and shows a "Printing is disabled" message. |
| **DevTools detection (light)** | Detect when the canvas is being inspected (e.g., by monitoring `window.outerHeight - window.innerHeight` changes) and overlay a watermark with the user's session ID. This deters screenshot sharing without breaking the UX. |
| **Watermark** | Optionally draw a faint, semi-transparent watermark (site name + timestamp) on the canvas after rendering each page. |
| **Rate-limiting the page API** | Limit `/api/articles/[slug]/pages` to ~30 requests/minute per IP. A scraper fetching all pages rapidly will be throttled. |
| **Referer / Origin check** | The page-content API rejects requests without a matching `Origin` or `Referer` header. |

### What This Does NOT Do

- It does not prevent screenshots (impossible without OS-level DRM).
- It does not prevent a determined attacker from using headless Chrome to render and OCR the canvas.
- It does not add encryption to the image data in transit (HTTPS already handles that).

These are acceptable trade-offs for a content-protection strategy that doesn't degrade the reading experience.

---

## File Plan

| New File | Purpose |
|----------|---------|
| `src/app/read/[slug]/page.tsx` | Server component: fetches article metadata, renders `<CanvasReaderPage>`. |
| `src/app/api/articles/[slug]/pages/route.ts` | API: returns paginated HTML fragments with anti-scraping guards. |
| `src/components/CanvasReader.tsx` | Client component: canvas viewport, rendering pipeline, navigation, zoom. |
| `src/components/ReaderToolbar.tsx` | Toolbar: back, page indicator, zoom, fullscreen, font-size buttons. |
| `src/lib/paginate.ts` | Server utility: splits article HTML into page-sized chunks. |
| `src/app/read/reader.css` | Reader-specific styles (fullscreen layout, print prevention, user-select). |

### Changes to Existing Files

| File | Change |
|------|--------|
| `src/app/articles/[slug]/page.tsx` | Add a "Read in viewer" link/button that navigates to `/read/[slug]`. |
| `src/lib/types.ts` | No schema changes needed; the existing `Article` type is sufficient. |
| `package.json` | Add `html2canvas` (or `modern-screenshot`) as a dependency. |

---

## Implementation Phases

### Phase 1 — Minimal Viable Reader
- Build `paginate.ts` and the paginated API route.
- Build `CanvasReader.tsx` with single-page rendering and prev/next navigation.
- Build `ReaderToolbar.tsx` with back button and page indicator.
- Wire up `/read/[slug]` route.

### Phase 2 — Polish and Protection
- Add zoom presets and fullscreen toggle.
- Add swipe and keyboard navigation.
- Add content-protection CSS (user-select, print, context menu).
- Add watermark rendering.

### Phase 3 — Responsive and Performance
- Implement two-page "book spread" layout for desktop.
- Add page cache (3-page LRU).
- Add rate limiting to the page API.
- Test on mobile devices and optimize canvas resolution for low-end hardware.

---

## Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `html2canvas` | Rasterize off-screen HTML to canvas | ~40 KB gzipped |

Alternative: `modern-screenshot` (~15 KB) — faster, ESM-native, but less battle-tested. Evaluate both during Phase 1.

No other new dependencies are required. The project already has React 19, Next.js 16, and the App Router infrastructure needed to build this.
