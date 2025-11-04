export const DepartmentsIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <circle cx="100" cy="100" r="85" fill="url(#deptGradient1)" opacity="0.1"/>
    
    {/* Building structure */}
    <rect x="60" y="60" width="80" height="90" rx="8" fill="url(#deptGradient2)" opacity="0.9"/>
    <rect x="70" y="50" width="60" height="12" rx="6" fill="url(#deptGradient3)"/>
    
    {/* Windows */}
    <rect x="75" y="75" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="95" y="75" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="115" y="75" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    
    <rect x="75" y="95" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="95" y="95" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="115" y="95" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    
    <rect x="75" y="115" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="95" y="115" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="115" y="115" width="15" height="15" rx="2" fill="#fff" opacity="0.7"/>
    
    {/* Door */}
    <rect x="90" y="135" width="20" height="15" rx="2" fill="#fff" opacity="0.8"/>
    
    {/* Decorative elements */}
    <circle cx="45" cy="70" r="5" fill="#3B82F6" opacity="0.4"/>
    <circle cx="155" cy="65" r="6" fill="#3B82F6" opacity="0.3"/>
    <circle cx="50" cy="130" r="4" fill="#3B82F6" opacity="0.5"/>
    
    <defs>
      <linearGradient id="deptGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6"/>
        <stop offset="100%" stopColor="#1D4ED8"/>
      </linearGradient>
      <linearGradient id="deptGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
      <linearGradient id="deptGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB"/>
        <stop offset="100%" stopColor="#1E40AF"/>
      </linearGradient>
    </defs>
  </svg>
)
