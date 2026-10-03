import type { Metadata } from 'next';
import './globals.css';
import '@/styles/interactions.css';

export const metadata: Metadata = {
  title: 'DUCMANH PC',
  description: 'Cửa hàng PC & Laptop chính hãng',
  icons: { icon: '/logo.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
