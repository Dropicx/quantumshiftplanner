import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planday Clone - Workforce Management System',
  description: 'Complete Workforce Management System for shift-based businesses',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
