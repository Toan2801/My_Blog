import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { getPublicSiteConfig } from '@/lib/public-data';
import AuthProvider from '@/components/AuthProvider';
import DiscordShell from '@/components/DiscordShell';

const hanFont = localFont({
  src: '../fonts/Jigmo.ttf',
  variable: '--font-han',
  display: 'swap',
  preload: true,
  fallback: ['serif'],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  return {
    title: { default: config.blogTitle, template: `%s · ${config.blogTitle}` },
    description: config.blogDescription,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getPublicSiteConfig();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body className={`${hanFont.variable} font-sans text-normal bg-normal`} suppressHydrationWarning>
        <AuthProvider>
          <DiscordShell config={config}>
            {children}
          </DiscordShell>
        </AuthProvider>
      </body>
    </html>
  );
}
