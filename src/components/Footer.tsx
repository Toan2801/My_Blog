import Link from 'next/link';
import { SiteConfig } from '@/lib/types';

export default function Footer({ config }: { config: SiteConfig }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-heading">Điều hướng</div>
            <ul className="footer-links">
              <li><Link href="/">Trang Chủ</Link></li>
              <li><Link href="/articles">Bài Viết</Link></li>
              <li><Link href="/translations">Bài Dịch</Link></li>
              <li><Link href="/videos">Video</Link></li>
              <li><Link href="/contact">Liên Hệ</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Chủ Đề</div>
            <ul className="footer-links">
              {config.categories.map(cat => (
                <li key={cat}>
                  <Link href={`/articles?category=${encodeURIComponent(cat)}`}>{cat}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="footer-heading">Tác giả</div>
            <ul className="footer-links">
              <li><span style={{ color: 'rgba(253,248,240,0.9)', fontWeight: 600 }}>{config.authorName}</span></li>
              {config.authorEmail && <li><a href={`mailto:${config.authorEmail}`}>{config.authorEmail}</a></li>}
              {config.facebook && (
                <li><a href={config.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>
              )}
              <li><Link href="/contact">Liên hệ tác giả</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {config.blogTitle} · {config.authorName} · Bảo lưu mọi quyền</p>
        </div>
      </div>
    </footer>
  );
}
