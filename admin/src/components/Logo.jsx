// The HomeCrew mark: a house with a "verified" check, on a green badge.
export function LogoMark({ className = "h-10 w-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="HomeCrew logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hcLogoGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5fa04a" />
          <stop offset="1" stopColor="#28461f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#hcLogoGrad)" />
      <path d="M12 31.5 32 14l20 17.5" fill="none" stroke="#fbfdf5" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 30v16.5a3.5 3.5 0 0 0 3.5 3.5h20a3.5 3.5 0 0 0 3.5-3.5V30" fill="none" stroke="#fbfdf5" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.5 38.5 30.5 43.5 39.5 33" fill="none" stroke="#ffd35c" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mark + wordmark + "Admin" tag
export default function Logo({ markClass = "h-9 w-9" }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <LogoMark className={markClass} />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-brand-800">
          Home<span className="text-brand-500">Crew</span>
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Admin panel</span>
      </span>
    </div>
  );
}
