import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NickleMiner - WFMU Archive',
  description: 'Archive and playlist management for WFMU Nickel And Dime Radio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

