export function CookbookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="18" fill="#8c3b2c" />
      <rect x="18" y="12" width="32" height="40" rx="4" fill="#fff8ee" />
      <rect x="14" y="12" width="7" height="40" rx="2" fill="#5c2a22" />
      <path
        d="M33 27c1.6-3.2 6.4-3.2 6.4 0 0 3.4-6.4 7.6-6.4 7.6S26.6 30.4 26.6 27c0-3.2 4.8-3.2 6.4 0Z"
        fill="#8c3b2c"
      />
    </svg>
  );
}
