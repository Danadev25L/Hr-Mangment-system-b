export const NotificationsIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="100" cy="100" r="80" fill="url(#notifGradient1)" opacity="0.1"/>
    <circle cx="100" cy="100" r="60" fill="url(#notifGradient2)" opacity="0.15"/>
    
    {/* Bell body */}
    <path 
      d="M100 50 C85 50 75 60 75 75 L75 95 C75 105 70 110 65 115 L135 115 C130 110 125 105 125 95 L125 75 C125 60 115 50 100 50 Z" 
      fill="url(#notifGradient3)"
    />
    
    {/* Bell clapper */}
    <circle cx="100" cy="120" r="6" fill="url(#notifGradient4)"/>
    
    {/* Bell top */}
    <rect x="95" y="45" width="10" height="8" rx="2" fill="url(#notifGradient3)"/>
    
    {/* Notification badge */}
    <circle cx="125" cy="65" r="15" fill="url(#notifGradient5)"/>
    <text x="125" y="70" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">3</text>
    
    {/* Sound waves */}
    <path 
      d="M140 60 Q150 55 155 60" 
      stroke="url(#notifGradient3)" 
      strokeWidth="3" 
      fill="none" 
      opacity="0.6"
      strokeLinecap="round"
    />
    <path 
      d="M140 75 Q155 75 160 85" 
      stroke="url(#notifGradient3)" 
      strokeWidth="3" 
      fill="none" 
      opacity="0.6"
      strokeLinecap="round"
    />
    <path 
      d="M60 60 Q50 55 45 60" 
      stroke="url(#notifGradient3)" 
      strokeWidth="3" 
      fill="none" 
      opacity="0.6"
      strokeLinecap="round"
    />
    <path 
      d="M60 75 Q45 75 40 85" 
      stroke="url(#notifGradient3)" 
      strokeWidth="3" 
      fill="none" 
      opacity="0.6"
      strokeLinecap="round"
    />
    
    {/* Message bubbles */}
    <circle cx="140" cy="130" r="8" fill="#fff" opacity="0.7"/>
    <circle cx="60" cy="125" r="6" fill="#fff" opacity="0.6"/>
    <circle cx="160" cy="100" r="5" fill="#fff" opacity="0.5"/>
    
    {/* Decorative dots */}
    <circle cx="40" cy="140" r="4" fill="url(#notifGradient5)" opacity="0.7"/>
    <circle cx="150" cy="145" r="5" fill="url(#notifGradient5)" opacity="0.6"/>
    
    <defs>
      <linearGradient id="notifGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
      <linearGradient id="notifGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="notifGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <linearGradient id="notifGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="notifGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
  </svg>
)
