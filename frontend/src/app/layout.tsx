import type { Metadata } from 'next';
import Providers from './providers';
import React from 'react';

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
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: '"Inter", sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
