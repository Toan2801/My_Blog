# Plan: Layout and Design Mimicry (hochiminh.vn)

## Reference Site Analysis

### Overall Visual Identity

hochiminh.vn is a **government news/archive portal** with a formal, information-dense layout. Key visual traits:

| Trait | Detail |
|-------|--------|
| **Color palette** | Deep red (`#d32f2f`) dominant, white/light-grey backgrounds, black text, gold accents on hover. |
| **Typography** | System sans-serif body text, bold serif headings. Vietnamese diacritics are rendered crisply. |
| **Density** | Content-heavy; minimal whitespace. Multiple content sections visible above the fold. |
| **Imagery** | Large banner images, article thumbnails with fixed aspect ratios, book covers. |
| **Navigation** | Top mega-nav with dropdowns, breadcrumbs on inner pages, sidebar category trees on archive pages. |

### Page-by-Page Breakdown

#### 1. Homepage (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR: date/time · secondary links · search icon         │
├──────────────────────────────────────────────────────────────┤
│  LOGO + SITE TITLE (centered)                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN NAV: TIN TỨC | CUỘC ĐỜI | TƯ TƯỞNG | TÁC PHẨM |...│
├──────────────────────────────────────────────────────────────┤
│  HERO SLIDER: large featured news image + headline overlay  │
├─────────────────────────────┬────────────────────────────────┤
│  MAIN COLUMN (2/3)          │  SIDEBAR (1/3)                 │
│  ┌─────────────────────┐    │  ┌────────────────────────┐    │
│  │ Article card grid    │    │  │ Category navigation    │    │
│  │ (thumbnail + title   │    │  │ (tree/accordion)       │    │
│  │  + excerpt + date)   │    │  ├────────────────────────┤    │
│  └─────────────────────┘    │  │ Related links / banners │    │
│                             │  └────────────────────────┘    │
├─────────────────────────────┴────────────────────────────────┤
│  MULTIMEDIA SECTION: Video | Photos | Megastory | Infograph  │
├──────────────────────────────────────────────────────────────┤
│  FOOTER: Copyright · organ info · partner links              │
└──────────────────────────────────────────────────────────────┘
```

#### 2. Book Listing Page (`/tac-pham-cua-ho-chi-minh/...`)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER + NAV (same as homepage)                             │
├──────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Trang chủ > Tác phẩm > Hồ Chí Minh toàn tập   │
├─────────────────────────────┬────────────────────────────────┤
│  SIDEBAR (left, 1/4)        │  MAIN CONTENT (3/4)            │
│  ┌─────────────────────┐    │  ┌────────────────────────┐    │
│  │ Category nav tree    │    │  │ Section title           │    │
│  │ - Hồ Chí Minh toàn  │    │  │ Book cover grid:        │    │
│  │   tập (active)       │    │  │ ┌──────┐ ┌──────┐      │    │
│  │ - Tuyển tập          │    │  │ │cover │ │cover │      │    │
│  │ - Tác phẩm           │    │  │ │ img  │ │ img  │      │    │
│  │ - Giới thiệu         │    │  │ │title │ │title │      │    │
│  └─────────────────────┘    │  │ └──────┘ └──────┘      │    │
│                             │  └────────────────────────┘    │
├─────────────────────────────┴────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### 3. Book Detail Page

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER + NAV                                                │
├──────────────────────────────────────────────────────────────┤
│  BREADCRUMB                                                  │
├─────────────────────────────┬────────────────────────────────┤
│  SIDEBAR (left)             │  ┌────────────────────────┐    │
│  Category nav               │  │ Book cover (large)     │    │
│                             │  │ Title, Publisher, Date  │    │
│                             │  │ View count              │    │
│                             │  │ [Xem sách] [Tải về]    │    │
│                             │  ├────────────────────────┤    │
│                             │  │ Introduction / excerpt  │    │
│                             │  ├────────────────────────┤    │
│                             │  │ TÁC PHẨM LIÊN QUAN     │    │
│                             │  │ (related book covers)   │    │
│                             │  └────────────────────────┘    │
├─────────────────────────────┴────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### 4. Book Reader (fullscreen)

```
┌──────────────────────────────────────────────────────────────┐
│  READER TOOLBAR: [← Quay lại]  Page 3/42  [−][+] [⛶]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ┌──────────────────────────────────┐                 │
│    ◄    │                                  │    ►            │
│         │     PAGE IMAGE (canvas/img)      │                 │
│         │                                  │                 │
│         └──────────────────────────────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Mapping to Current Project

The current site already has a header, nav, footer, and article pages. The changes below reshape these into the reference site's layout without discarding existing content or routes.

### What Changes

| Area | Current State | Target State |
|------|--------------|--------------|
| **Header** | Hero image + single-row nav | Three-tier header: top bar → logo → mega-nav with dropdowns |
| **Homepage** | Grid of featured articles/series | Hero slider + main column + sidebar layout |
| **Article listing** | Full-width card grid with filter bar | Left sidebar category tree + right content grid |
| **Article detail** | Full reading page with TOC sidebar | Same reading page, plus "Open in reader" button linking to canvas reader |
| **Series listing** | Cards on series page | Book-cover grid layout matching the reference's book listing |
| **Footer** | Two-column links + copyright | Three-column footer: nav links, categories, organ/author info |
| **Reader** | (does not exist) | New fullscreen canvas-based reader (see `plan-canvas-reader.md`) |

### What Stays the Same

- Admin UI layout (unaffected — it has its own `layout.tsx`).
- Data model, API routes, JSON storage, migration workflow.
- `src/lib/` utilities and `src/models/` schemas.
- Vietnamese content, slugs, and editorial formatting.

---

## Detailed Component Changes

### 1. Header (`SiteHeader.tsx`)

**Current**: Single hero image + one-row nav bar.

**Target**: Three-tier header.

```tsx
<header className="site-header">
  {/* Tier 1: Top utility bar */}
  <div className="header-topbar">
    <span className="header-date">{formattedDate}</span>
    <div className="header-topbar-links">
      <Link href="/admin">Quản trị</Link>
      <button className="search-toggle">🔍</button>
    </div>
  </div>

  {/* Tier 2: Logo and title */}
  <div className="header-brand">
    <Link href="/">
      <img src={config.heroImage} alt={config.blogTitle} className="header-logo" />
      <h1 className="header-site-title">{config.blogTitle}</h1>
    </Link>
  </div>

  {/* Tier 3: Main navigation with dropdowns */}
  <nav className="header-nav">
    <ul className="nav-items">
      <li><Link href="/">Trang chủ</Link></li>
      <li className="has-dropdown">
        <Link href="/articles">Bài viết</Link>
        <ul className="dropdown">
          {config.categories.map(cat => (
            <li key={cat}><Link href={`/articles?category=${cat}`}>{cat}</Link></li>
          ))}
        </ul>
      </li>
      <li><Link href="/translations">Bài dịch</Link></li>
      <li><Link href="/videos">Video</Link></li>
      <li><Link href="/contact">Liên hệ</Link></li>
    </ul>
  </nav>
</header>
```

The nav should be **sticky** after scroll (pin to top when the brand section scrolls away).

### 2. Homepage (`page.tsx`)

**Current**: Single grid of featured cards.

**Target**: Three-section layout.

```
Section 1: Hero slider (1-3 featured articles with large images, auto-rotate)
Section 2: Main + Sidebar
  - Main (8 cols): Latest articles in a card grid (thumbnail, title, excerpt, date)
  - Sidebar (4 cols): Category links, featured series covers, quote block
Section 3: Multimedia row (videos, if any)
```

New components needed:
- `HeroSlider.tsx` — client component with auto-play and manual arrows.
- `Sidebar.tsx` — reusable sidebar with category links, featured series, quote block.

### 3. Article Listing Page (`articles/page.tsx`)

**Current**: Full-width grid with top filter bar.

**Target**: Sidebar + content layout.

```
┌──────────────┬──────────────────────────────────┐
│  CategoryNav │  Breadcrumb                       │
│  (accordion) │  Filter chips (active category)   │
│              │  Article card grid                 │
│              │  Pagination                        │
└──────────────┴──────────────────────────────────┘
```

New component: `CategorySidebar.tsx` — renders a vertical list of categories with the active one highlighted. This replaces the current horizontal filter chips.

### 4. Series / Book Listing (`series/[slug]/page.tsx`)

Reshape the series page to show a **book cover grid**:
- Each article in the series is displayed as a vertical card with its `coverImage` rendered at a fixed ~3:4 aspect ratio (book-like).
- Below the cover: title, date, reading time.
- Clicking opens the article detail page. A secondary "Đọc trên trình xem" button opens the canvas reader.

### 5. Article Detail Page (`articles/[slug]/page.tsx`)

Minimal layout changes:
- Add a breadcrumb at the top: `Trang chủ > Bài viết > {category} > {title}`.
- Add a prominent "📖 Đọc trên trình xem" (Read in viewer) button in the article header, linking to `/read/{slug}`.
- Keep the existing TOC sidebar, reading progress bar, and comment section.

### 6. Footer (`Footer.tsx`)

**Current**: Two-column links + copyright.

**Target**: Three-column footer matching the reference:

```
Column 1: Navigation links
Column 2: Categories (all, not just first 4)
Column 3: Author info, contact email, social links
───────────────────────────────────────────
Copyright line · "Bảo lưu mọi quyền"
```

### 7. Breadcrumb Component (new)

A simple `Breadcrumb.tsx` that renders `Trang chủ > Section > Page` links. Used on article listing, article detail, and series pages.

---

## CSS / Design Token Changes

### Color Palette Shift

The reference site uses a **red-dominant** government color scheme. The current project uses a blue/gold scheme. The shift:

| Token | Current Value | New Value | Note |
|-------|--------------|-----------|------|
| `--gold` | `#2c5282` (blue) | `#c62828` (deep red) | Primary accent |
| `--gold-light` | `#4299e1` | `#ef5350` | Hover state |
| `--gold-pale` | `#ebf8ff` | `#ffebee` | Background tint |
| `--paper` | `#f0f7ff` (light blue) | `#fafafa` (neutral white) | Page background |
| `--paper-dark` | `#e1efff` | `#f5f5f5` | Section background |
| `--ink` | `#1f2d3d` | `#212121` | Body text |

### Typography

Keep the current serif fonts (`Playfair Display`, `Lora`) for the historical/editorial feel. The reference site uses sans-serif, but the serif choice is a deliberate brand decision for this project that adds warmth.

### Layout Variables

Add new layout tokens:

```css
:root {
  --sidebar-width: 280px;
  --header-topbar-height: 36px;
  --header-brand-height: 80px;
  --header-nav-height: 48px;
}
```

---

## File Plan

### New Files

| File | Purpose |
|------|---------|
| `src/components/Breadcrumb.tsx` | Breadcrumb navigation |
| `src/components/HeroSlider.tsx` | Homepage hero image slider |
| `src/components/CategorySidebar.tsx` | Vertical category navigation for listing pages |
| `src/components/Sidebar.tsx` | General sidebar container (categories, featured, quote) |

### Modified Files

| File | Change |
|------|--------|
| `src/components/SiteHeader.tsx` | Restructure to three-tier header with dropdown nav |
| `src/components/Footer.tsx` | Expand to three-column layout |
| `src/app/page.tsx` | Reorganize into hero + main/sidebar + multimedia sections |
| `src/app/articles/page.tsx` | Add left sidebar with category navigation |
| `src/app/articles/[slug]/page.tsx` | Add breadcrumb and "Read in viewer" button |
| `src/app/series/[slug]/page.tsx` | Reshape to book-cover grid layout |
| `src/app/globals.css` | Update color tokens, add header/sidebar/footer styles |

---

## Implementation Phases

### Phase 1 — Header, Footer, and Layout Skeleton
- Rebuild `SiteHeader.tsx` with three tiers and sticky nav.
- Rebuild `Footer.tsx` with three columns.
- Update CSS design tokens (colors, layout variables).
- Add `Breadcrumb.tsx`.

### Phase 2 — Homepage Redesign
- Build `HeroSlider.tsx`.
- Build `Sidebar.tsx` with category links and quote block.
- Restructure `page.tsx` into hero + main/sidebar layout.

### Phase 3 — Listing and Detail Pages
- Build `CategorySidebar.tsx`.
- Reshape `articles/page.tsx` with sidebar layout.
- Add breadcrumb and reader link to `articles/[slug]/page.tsx`.
- Reshape `series/[slug]/page.tsx` into book-cover grid.

### Phase 4 — Reader Integration
- Wire the canvas reader (from `plan-canvas-reader.md`) into the article detail page.
- Add "Đọc trên trình xem" buttons throughout the article and series UIs.

---

## Responsive Behavior

| Breakpoint | Header | Layout | Sidebar |
|------------|--------|--------|---------|
| **Desktop (≥ 1024px)** | Full three-tier header | Main + sidebar | Visible, fixed-width |
| **Tablet (768–1023px)** | Collapsed top bar, hamburger for nav | Full-width main | Hidden, toggled by button |
| **Mobile (< 768px)** | Logo only + hamburger menu | Single column | Hidden, slide-in drawer |

The sidebar becomes a **slide-in drawer** on mobile, triggered by a hamburger button in the header. The hero slider switches from auto-play to manual-swipe on touch devices.
