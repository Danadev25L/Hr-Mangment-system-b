export const HolidaysIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <circle cx="100" cy="100" r="85" fill="url(#holidayGradient1)" opacity="0.1"/>
    
    {/* Calendar base */}
    <rect x="50" y="50" width="100" height="100" rx="12" fill="url(#holidayGradient2)"/>
    
    {/* Calendar header */}
    <rect x="50" y="50" width="100" height="25" rx="12" fill="url(#holidayGradient3)"/>
    <rect x="50" y="62.5" width="100" height="12.5" fill="url(#holidayGradient3)"/>
    
    {/* Binding rings */}
    <circle cx="70" cy="50" r="5" fill="#fff" opacity="0.8"/>
    <circle cx="100" cy="50" r="5" fill="#fff" opacity="0.8"/>
    <circle cx="130" cy="50" r="5" fill="#fff" opacity="0.8"/>
    
    {/* Calendar grid */}
    <rect x="60" y="85" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="80" y="85" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="100" y="85" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="120" y="85" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    
    <rect x="60" y="102" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="80" y="102" width="15" height="12" rx="2" fill="#10B981" opacity="0.8"/>
    <rect x="100" y="102" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="120" y="102" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    
    <rect x="60" y="119" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="80" y="119" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="100" y="119" width="15" height="12" rx="2" fill="#10B981" opacity="0.8"/>
    <rect x="120" y="119" width="15" height="12" rx="2" fill="#fff" opacity="0.5"/>
    
    {/* Decorative stars */}
    <path d="M170 60 L172 65 L177 65 L173 68 L175 73 L170 70 L165 73 L167 68 L163 65 L168 65 Z" fill="#FCD34D" opacity="0.8"/>
    <path d="M35 90 L37 94 L41 94 L38 97 L40 101 L35 98 L30 101 L32 97 L29 94 L33 94 Z" fill="#FCD34D" opacity="0.6"/>
    
    <defs>
      <linearGradient id="holidayGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981"/>
        <stop offset="100%" stopColor="#059669"/>
      </linearGradient>
      <linearGradient id="holidayGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#f0f9ff"/>
      </linearGradient>
      <linearGradient id="holidayGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399"/>
        <stop offset="100%" stopColor="#10B981"/>
      </linearGradient>
    </defs>
  </svg>
)
