import type { Metadata } from 'next';
import './globals.css';
import './auth.css';
import { getSiteConfig } from '@/lib/data';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import AuthProvider from '@/components/AuthProvider';

export async function generateMetadata(): Promise<Metadata> {
  const config = getSiteConfig();
  return {
    title: { default: config.blogTitle, template: `%s · ${config.blogTitle}` },
    description: config.blogDescription,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getSiteConfig();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <AuthProvider>
          <ReadingProgress />
          <SiteHeader config={config} />
          <main>{children}</main>
          <Footer config={config} />
        </AuthProvider>
      </body>
    </html>
  );
}
