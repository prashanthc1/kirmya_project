import React from 'react';

/**
 * The Kirmya mark: an ascending K. Kept as a component rather than an <img> so it
 * inherits crisp rendering at any size and needs no network request on error pages,
 * which may be shown when the app is already struggling.
 *
 * Matches app/icon.svg — keep the two in sync if the mark changes.
 */
export default function BrandMark({
  size = 40,
  title = 'Kirmya',
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      <rect width="64" height="64" rx="15" fill="#4F46E5" />
      <g
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 18 V46" />
        <path d="M22 33 L46 15" />
        <path d="M22 33 L44 47" />
      </g>
    </svg>
  );
}
