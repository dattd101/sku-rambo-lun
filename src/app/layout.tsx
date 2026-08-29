import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SlugStick Mini',
  description: 'Mini run-and-gun stickman game built with Next.js 15 and Phaser 3.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
