import React from 'react';

// Official AgriGen Leaf Logo SVG
export const AgriGenLeaf = ({ className = "w-6 h-6", glow = true }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]' : ''}`}
  >
    <path
      d="M26.5 4.5C26.5 4.5 17.5 5 11 11.5C4.5 18 4 27.5 4 27.5C4 27.5 13.5 27 20 20.5C26.5 14 26.5 4.5 26.5 4.5Z"
      fill="#6B9080"
    />
    <path
      d="M26.5 4.5C21 10 14 18 4 27.5"
      stroke="#CCE3DE"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M17 14C19 12 22 10.5 24 9.5"
      stroke="#CCE3DE"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M12 19C10.5 21 8.5 23 7 24"
      stroke="#CCE3DE"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

// AgriVerse Brand Component (Logo + AGRI VERSE text + Tagline)
export const AgriGenBrand = ({ showTagline = true, size = 'default' }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2.5">
      <div className={`${size === 'large' ? 'w-9 h-9' : 'w-8 h-8'} rounded-xl bg-black border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-sm`}>
        <img
          src="/assets/kare-tech-logo.png"
          alt="KARE Tech AgriVerse"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
      <span className={`font-black tracking-wider uppercase ${size === 'large' ? 'text-2xl' : 'text-xl'} text-white`}>
        AGRI<span className="text-[#6B9080]">VERSE</span>
      </span>
    </div>
    {showTagline && (
      <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] font-medium tracking-[0.22em] text-slate-400 uppercase">
        <span>PEOPLE</span>
        <span className="text-[#6B9080]">•</span>
        <span>IDEAS</span>
        <span className="text-[#6B9080]">•</span>
        <span>IMPACT</span>
      </div>
    )}
  </div>
);

// UI Icons matching image copy 8.png specification
export const IconUser = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconId = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h3" />
    <path d="M7 11h10" />
    <path d="M7 15h6" />
    <circle cx="16" cy="7" r="1" fill="currentColor" />
  </svg>
);

export const IconBook = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </svg>
);

export const IconGroup = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconHome = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconCalendar = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const IconMale = ({ className = "w-5 h-5 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="10" cy="14" r="5" />
    <line x1="19" y1="5" x2="13.6" y2="10.4" />
    <polyline points="14 5 19 5 19 10" />
  </svg>
);

export const IconFemale = ({ className = "w-5 h-5 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="5" />
    <line x1="12" y1="14" x2="12" y2="21" />
    <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" />
  </svg>
);

export const IconOther = ({ className = "w-5 h-5 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="16" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const IconLock = ({ className = "w-3.5 h-3.5 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const IconArrow = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconRocket = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

export const IconPhone = ({ className = "w-4 h-4 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
