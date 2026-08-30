import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rambo Lùn',
  description: 'Mini arcade run-and-gun game built with Next.js 15 and Phaser 3.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
