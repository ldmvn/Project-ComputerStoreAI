import type { Metadata } from 'next';
import './globals.css';
import ThemeInitializer from '@/components/layout/ThemeInitializer';
import { themeInitScript } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'DUCMANH PC',
  description: 'Cửa hàng PC & Laptop chính hãng',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
