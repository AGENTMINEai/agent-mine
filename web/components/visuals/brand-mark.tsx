export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bm-fill" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE3B8" />
          <stop offset="48%" stopColor="#FFB454" />
          <stop offset="100%" stopColor="#E89A34" />
        </linearGradient>
      </defs>
      <path d="M16 2.4 28.4 9.6v12.8L16 29.6 3.6 22.4V9.6L16 2.4Z" fill="url(#bm-fill)" />
      <path d="M16 8.6 22.6 12.5v7.8L16 24.2 9.4 20.3v-7.8L16 8.6Z" fill="#120C04" fillOpacity="0.9" />
      <circle cx="16" cy="16.4" r="2.1" fill="#FFE3B8" />
      <circle cx="16" cy="16.4" r="4.6" fill="#FFD9A3" fillOpacity="0.18" />
    </svg>
  );
}
