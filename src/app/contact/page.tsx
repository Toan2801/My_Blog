import {
  EnvelopeIcon,
  QrCodeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { getSiteConfig } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Liên Hệ' };

export default async function ContactPage() {
  const config = await getSiteConfig();
  const { donation } = config;

  return (
    <>


      <div className="container" style={{ marginTop: 'var(--space-6)' }}>

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
                  <UserCircleIcon style={{ width: 18, height: 18 }} />
                  <a href={config.facebook} target="_blank" rel="noopener noreferrer">Facebook cá nhân</a>
                </div>
              )}
              {config.authorEmail && (
                <div className="contact-item">
                  <EnvelopeIcon style={{ width: 18, height: 18 }} />
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
                    <QrCodeIcon style={{ width: 32, height: 32 }} />
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
