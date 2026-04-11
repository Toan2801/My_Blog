import Link from 'next/link';
import { SiteConfig } from '@/lib/types';

export default function Footer({ config }: { config: SiteConfig }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand">{config.blogTitle}</div>
            <p className="footer-desc">{config.blogDescription}</p>
          </div>
          <div>
            <div className="footer-heading">Điều Hướng</div>
            <ul className="footer-links">
              <li><Link href="/">Trang Chủ</Link></li>
              <li><Link href="/articles">Bài Viết</Link></li>
              <li><Link href="/contact">Liên Hệ</Link></li>
              <li><Link href="/admin" style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: 'var(--space-2)', display: 'block' }}>Quản trị</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Chủ Đề</div>
            <ul className="footer-links">
              {config.categories.slice(0, 4).map(cat => (
                <li key={cat}>
                  <Link href={`/articles?category=${encodeURIComponent(cat)}`}>{cat}</Link>
                </li>
              ))}
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
