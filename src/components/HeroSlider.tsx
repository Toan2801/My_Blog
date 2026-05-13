'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  title: string;
  slug: string;
  category?: string;
  excerpt: string;
  coverImage?: string | null;
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent(i => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="hero-slider">
      <div
        className="hero-slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div className="hero-slide" key={slide.slug}>
            {slide.coverImage && (
              <img src={slide.coverImage} alt="" className="hero-slide-bg" />
            )}
            <div className="hero-slide-content">
              {slide.category && <span className="hero-slide-badge">{slide.category}</span>}
              <h2 className="hero-slide-title">
                <Link href={`/articles/${slide.slug}`}>{slide.title}</Link>
              </h2>
              {slide.excerpt && (
                <p className="hero-slide-excerpt">{slide.excerpt}</p>
              )}
              <Link href={`/articles/${slide.slug}`} className="btn-reader">
                Đọc bài viết →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="hero-slider-controls">
            <button className="hero-slider-btn" onClick={prev} aria-label="Previous">‹</button>
            <button className="hero-slider-btn" onClick={next} aria-label="Next">›</button>
          </div>
          <div className="hero-slider-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`hero-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
