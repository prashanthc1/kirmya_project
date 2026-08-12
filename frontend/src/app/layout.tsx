import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import React from 'react';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Kirmya - Restart Your Career With Confidence | AI Career Recovery & Professional Network',
  description:
    'Kirmya is a free professional networking and AI-powered career platform built for professionals recovering from job loss or seeking career growth. Find jobs, build connections, receive referrals, and optimize your resume.',
  keywords: [
    'Job Search',
    'Career Recovery',
    'AI Career Assistant',
    'Professional Networking',
    'Employee Referrals',
    'Resume Optimizer',
    'ATS Resume Scanner',
    'Interview Coaching',
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
      'A free professional network helping people find jobs, build connections, improve skills, and recover careers faster with AI guidance.',
    url: 'https://kirmya.com',
    siteName: 'Kirmya',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://kirmya.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kirmya AI Career Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kirmya - Restart Your Career With Confidence',
    description:
      'Find jobs, build connections, get employee referrals, and accelerate your career with AI guidance.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
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
.skip-link:focus{position:fixed;top:12px;left:12px;width:auto;height:auto;margin:0;padding:12px 20px;clip:auto;clip-path:none;overflow:visible;z-index:1600;background:#4f46e5;color:#fff;font-family:var(--font-sans),sans-serif;font-size:.95rem;font-weight:600;text-decoration:none;border-radius:10px;box-shadow:0 8px 24px rgba(15,23,42,.35);outline:2px solid #f8fafc;outline-offset:2px}
#main-content{scroll-margin-top:96px}
#main-content:focus{outline:none}
`.trim(),
          }}
        />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Providers>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
