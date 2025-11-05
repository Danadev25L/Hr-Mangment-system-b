export const ApplicationsIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="100" cy="100" r="80" fill="url(#appGradient1)" opacity="0.1"/>
    <circle cx="100" cy="100" r="60" fill="url(#appGradient2)" opacity="0.15"/>
    
    {/* Document stack */}
    <rect x="60" y="50" width="80" height="100" rx="8" fill="url(#appGradient3)" opacity="0.9"/>
    <rect x="55" y="55" width="80" height="100" rx="8" fill="url(#appGradient4)" opacity="0.85"/>
    <rect x="50" y="60" width="80" height="100" rx="8" fill="url(#appGradient5)"/>
    
    {/* Document lines */}
    <line x1="65" y1="85" x2="115" y2="85" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
    <line x1="65" y1="100" x2="105" y2="100" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <line x1="65" y1="115" x2="110" y2="115" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <line x1="65" y1="130" x2="100" y2="130" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    
    {/* Checkmark / approval icon */}
    <circle cx="125" cy="135" r="20" fill="#10B981" opacity="0.9"/>
    <path d="M115 135 L122 142 L135 128" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Decorative elements */}
    <circle cx="160" cy="50" r="5" fill="#fff" opacity="0.6"/>
    <circle cx="40" cy="70" r="4" fill="#fff" opacity="0.5"/>
    <circle cx="155" cy="150" r="6" fill="#fff" opacity="0.7"/>
    
    <defs>
      <linearGradient id="appGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <linearGradient id="appGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0EA5E9"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
      <linearGradient id="appGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8"/>
        <stop offset="100%" stopColor="#0EA5E9"/>
      </linearGradient>
      <linearGradient id="appGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
      <linearGradient id="appGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4"/>
        <stop offset="100%" stopColor="#0284C7"/>
      </linearGradient>
    </defs>
  </svg>
)
