export const EmployeesIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="100" cy="100" r="80" fill="url(#employeeGradient1)" opacity="0.1"/>
    <circle cx="100" cy="100" r="60" fill="url(#employeeGradient2)" opacity="0.15"/>
    
    {/* Main person 1 */}
    <circle cx="80" cy="70" r="18" fill="url(#employeeGradient3)"/>
    <path d="M50 130 C50 110 65 100 80 100 C95 100 110 110 110 130" fill="url(#employeeGradient3)" opacity="0.9"/>
    
    {/* Main person 2 */}
    <circle cx="120" cy="75" r="20" fill="url(#employeeGradient4)"/>
    <path d="M90 135 C90 113 103 102 120 102 C137 102 150 113 150 135" fill="url(#employeeGradient4)" opacity="0.9"/>
    
    {/* Main person 3 */}
    <circle cx="100" cy="95" r="16" fill="url(#employeeGradient5)"/>
    <path d="M75 145 C75 128 85 120 100 120 C115 120 125 128 125 145" fill="url(#employeeGradient5)" opacity="0.9"/>
    
    {/* Decorative elements */}
    <circle cx="160" cy="50" r="6" fill="#fff" opacity="0.6"/>
    <circle cx="40" cy="60" r="4" fill="#fff" opacity="0.5"/>
    <circle cx="150" cy="140" r="5" fill="#fff" opacity="0.7"/>
    
    <defs>
      <linearGradient id="employeeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
      <linearGradient id="employeeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="employeeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <linearGradient id="employeeGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="employeeGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
  </svg>
)
