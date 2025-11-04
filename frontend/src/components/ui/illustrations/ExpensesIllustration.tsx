export const ExpensesIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <circle cx="100" cy="100" r="85" fill="url(#expenseGradient1)" opacity="0.1"/>
    
    {/* Wallet */}
    <rect x="55" y="70" width="90" height="70" rx="10" fill="url(#expenseGradient2)"/>
    <rect x="55" y="70" width="90" height="20" rx="10" fill="url(#expenseGradient3)"/>
    <rect x="55" y="80" width="90" height="10" fill="url(#expenseGradient3)"/>
    
    {/* Card slot */}
    <rect x="65" y="100" width="50" height="30" rx="4" fill="#fff" opacity="0.3"/>
    <rect x="70" y="105" width="40" height="4" rx="2" fill="#fff" opacity="0.6"/>
    <rect x="70" y="113" width="30" height="3" rx="1.5" fill="#fff" opacity="0.5"/>
    <rect x="70" y="120" width="25" height="3" rx="1.5" fill="#fff" opacity="0.5"/>
    
    {/* Coins */}
    <circle cx="135" cy="105" r="12" fill="url(#coinGradient1)"/>
    <circle cx="135" cy="105" r="8" fill="url(#coinGradient2)"/>
    <text x="135" y="110" fontSize="10" fontWeight="bold" fill="#fff" textAnchor="middle">$</text>
    
    <circle cx="125" cy="125" r="10" fill="url(#coinGradient1)" opacity="0.9"/>
    <circle cx="125" cy="125" r="7" fill="url(#coinGradient2)" opacity="0.9"/>
    <text x="125" y="129" fontSize="8" fontWeight="bold" fill="#fff" textAnchor="middle">$</text>
    
    {/* Decorative elements */}
    <circle cx="40" cy="80" r="5" fill="#F59E0B" opacity="0.4"/>
    <circle cx="160" cy="130" r="6" fill="#F59E0B" opacity="0.3"/>
    
    <defs>
      <linearGradient id="expenseGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#D97706"/>
      </linearGradient>
      <linearGradient id="expenseGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24"/>
        <stop offset="100%" stopColor="#F59E0B"/>
      </linearGradient>
      <linearGradient id="expenseGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#D97706"/>
      </linearGradient>
      <linearGradient id="coinGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D"/>
        <stop offset="100%" stopColor="#FBBF24"/>
      </linearGradient>
      <linearGradient id="coinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#D97706"/>
      </linearGradient>
    </defs>
  </svg>
)
