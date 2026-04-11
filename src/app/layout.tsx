import type { Metadata } from 'next';
import './globals.css';
import { getSiteConfig } from '@/lib/data';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
    <html lang="vi">
      <body>
        <Navigation title={config.blogTitle} categories={config.categories} />
        <main>{children}</main>
        <Footer config={config} />
      </body>
    </html>
  );
}
