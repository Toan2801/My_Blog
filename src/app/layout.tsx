import type { Metadata } from 'next';
import './globals.css';
import './discord-theme.css';
import './auth.css';
import { getSiteConfig } from '@/lib/data';
import ReadingProgress from '@/components/ReadingProgress';
import AuthProvider from '@/components/AuthProvider';
import DiscordShell from '@/components/DiscordShell';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: { default: config.blogTitle, template: `%s · ${config.blogTitle}` },
    description: config.blogDescription,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <AuthProvider>
          <ReadingProgress />
          <DiscordShell config={config}>
            {children}
          </DiscordShell>
        </AuthProvider>
      </body>
    </html>
  );
}
