import type { Metadata } from 'next';
import Providers from './providers';
import React from 'react';

export const metadata: Metadata = {
  title: 'Kirmya - LinkedIn-Level Professional Profiles',
  description: 'Manage professional profiles, resume uploads, and portfolios within the Kirmya professional ecosystem.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: '"Inter", sans-serif' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
