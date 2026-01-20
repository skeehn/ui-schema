import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UISchema + Next.js Example',
  description: 'Example integration of UISchema with Next.js and Vercel AI SDK'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
