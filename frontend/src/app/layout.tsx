import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Providers from './providers';
import React from 'react';


export const metadata: Metadata = {
  title: 'Kirmya - Restart Your Career With Confidence | Jobs, Freelance Work & Career Recovery',
  description:
    'Kirmya is a free career platform built for professionals recovering from job loss or seeking career growth. Find jobs, join communities, receive referrals, and build your resume.',
  keywords: [
    'Job Search',
    'Career Recovery',
    'Employee Referrals',
    'Resume Optimizer',
    'Resume Builder',
    'Freelance Jobs',
    'Facilities Management Jobs',
    'Tech Careers',
  ],
  authors: [{ name: 'Kirmya Technologies' }],
  creator: 'Kirmya Technologies',
  publisher: 'Kirmya Technologies',
  metadataBase: new URL('https://kirmya.com'),
  alternates: {
    canonical: 'https://kirmya.com',
  },
  openGraph: {
    title: 'Kirmya - Restart Your Career With Confidence',
    description:
      'A free career platform helping people find jobs, join communities, get referrals, and recover careers faster.',
    url: 'https://kirmya.com',
    siteName: 'Kirmya',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://kirmya.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kirmya Career Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kirmya - Restart Your Career With Confidence',
    description:
      'Find jobs, join communities, get employee referrals, and accelerate your career.',
    creator: '@kirmya',
    images: ['https://kirmya.com/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const savedMode = (await cookies()).get('kirmya-theme-mode')?.value;
  const initialMode = savedMode === 'dark' ? 'dark' : 'light';
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {/*
          Inlined rather than themed: MUI's styles are injected on the client, so a
          themed skip link would render unstyled — and therefore visible — during the
          server paint. These rules ship with the HTML.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
.skip-link{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.skip-link:focus{position:fixed;top:12px;left:12px;width:auto;height:auto;margin:0;padding:12px 20px;clip:auto;clip-path:none;overflow:visible;z-index:1600;background:#0066cc;color:#fff;font-family:system-ui,sans-serif;font-size:.95rem;font-weight:600;text-decoration:none;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);outline:2px solid #fff;outline-offset:2px}
#main-content{scroll-margin-top:96px}
#main-content:focus{outline:none}
`.trim(),
          }}
        />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Providers initialMode={initialMode}>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
