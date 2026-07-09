function Logo({ size = 'lg', showText = true }) {
  const sizes = {
    sm: { icon: 'w-10 h-10', text: 'text-lg' },
    md: { icon: 'w-14 h-14', text: 'text-xl' },
    lg: { icon: 'w-20 h-20', text: 'text-3xl' },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${s.icon} relative`}>
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#logoGrad)" opacity="0.15" />
          <circle cx="40" cy="40" r="34" stroke="url(#logoGrad)" strokeWidth="3" fill="white" />
          <path d="M25 48c0-8 7-15 15-15s15 7 15 15" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="30" cy="32" r="3" fill="#06b6d4" />
          <circle cx="40" cy="28" r="3" fill="#8b5cf6" />
          <circle cx="50" cy="32" r="3" fill="#f43f5e" />
          <path d="M22 52h36" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="28" y="52" width="6" height="8" rx="1" fill="#06b6d4" opacity="0.7" />
          <rect x="37" y="52" width="6" height="8" rx="1" fill="#8b5cf6" opacity="0.7" />
          <rect x="46" y="52" width="6" height="8" rx="1" fill="#f43f5e" opacity="0.7" />
        </svg>
      </div>
      {showText && (
        <div className="text-center">
          <h1 className={`${s.text} font-extrabold bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 bg-clip-text text-transparent`}>
            TableReserve
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Restaurant Reservation</p>
        </div>
      )}
    </div>
  );
}

export default Logo;
