import { getSiteConfig } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Liên Hệ' };

export default function ContactPage() {
  const config = getSiteConfig();
  const { donation } = config;

  return (
    <>
      {/* Hero Header - Matching Homepage and All Pages */}
      <section className="hero">
        {config.heroImage && (
          <div className="hero-bg">
            <img src={config.heroImage} alt="Background" />
            <div className="hero-overlay" />
          </div>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title">{config.blogTitle}</h1>
          <div className="hero-divider" />
          <p className="hero-description" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.8)' }}>
            {config.blogDescription}
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-8)' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 className="page-title" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>Liên hệ</h1>
          <div style={{ width: '40px', height: '2px', background: 'var(--gold)', margin: '16px auto' }} />
        </div>

        <div className="contact-layout">
          {/* Left: Author */}
          <div>
            <div className="author-card">
              <div className="author-avatar-placeholder">
                {config.authorName.charAt(0)}
              </div>
              <h2 className="author-name">{config.authorName}</h2>
              <p className="author-bio">{config.authorBio}</p>
            </div>

            <hr className="divider" />

            <div className="contact-block">
              <p className="section-label">Thông Tin Liên Lạc</p>
              {config.facebook && (
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  <a href={config.facebook} target="_blank" rel="noopener noreferrer">Facebook cá nhân</a>
                </div>
              )}
              {config.authorEmail && (
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  <a href={`mailto:${config.authorEmail}`}>{config.authorEmail}</a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Donation */}
          <div>
            <div className="donation-block">
              <p className="section-label">Ủng Hộ Tác Giả</p>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 'var(--space-3)' }}>
                Donate
              </h3>
              <p className="donation-text">{donation.text}</p>

              <div style={{ marginTop: 'var(--space-5)' }}>
                {donation.qrImage ? (
                  <img
                    src={donation.qrImage}
                    alt="QR Code ủng hộ"
                    className="qr-image"
                  />
                ) : (
                  <div className="qr-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="2" height="2" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="19" width="7" height="2" /></svg>
                    <span>QR Code chưa được cài đặt</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Admin có thể upload tại /admin</span>
                  </div>
                )}
              </div>

              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: 'var(--space-4)', lineHeight: 1.6 }}>
                Nếu thấy những bài viết của tôi có giá trị, hãy vui lòng donate 1 (hoặc 100) li cafe để tôi có động lực viết tiếp. Bằng cách quét vào mã QR dưới đây.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
