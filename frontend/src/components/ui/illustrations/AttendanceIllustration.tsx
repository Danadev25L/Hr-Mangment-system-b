export const AttendanceIllustration = ({ className = "w-32 h-32" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <circle cx="100" cy="100" r="85" fill="url(#attendanceGradient1)" opacity="0.1"/>
    
    {/* Clock face */}
    <circle cx="100" cy="100" r="50" fill="url(#attendanceGradient2)"/>
    <circle cx="100" cy="100" r="45" fill="#fff" opacity="0.9"/>
    
    {/* Clock markers */}
    <circle cx="100" cy="58" r="3" fill="url(#attendanceGradient3)"/>
    <circle cx="100" cy="142" r="3" fill="url(#attendanceGradient3)"/>
    <circle cx="142" cy="100" r="3" fill="url(#attendanceGradient3)"/>
    <circle cx="58" cy="100" r="3" fill="url(#attendanceGradient3)"/>
    
    {/* Clock hands */}
    <line x1="100" y1="100" x2="100" y2="75" stroke="url(#attendanceGradient3)" strokeWidth="3" strokeLinecap="round"/>
    <line x1="100" y1="100" x2="118" y2="100" stroke="url(#attendanceGradient3)" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="100" cy="100" r="5" fill="url(#attendanceGradient3)"/>
    
    {/* Checkmark */}
    <circle cx="135" cy="70" r="18" fill="url(#checkGradient)"/>
    <path d="M127 70 L132 75 L143 64" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    
    {/* Decorative elements */}
    <circle cx="45" cy="60" r="4" fill="#06B6D4" opacity="0.4"/>
    <circle cx="155" cy="140" r="5" fill="#06B6D4" opacity="0.3"/>
    
    <defs>
      <linearGradient id="attendanceGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4"/>
        <stop offset="100%" stopColor="#0891B2"/>
      </linearGradient>
      <linearGradient id="attendanceGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
      <linearGradient id="attendanceGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891B2"/>
        <stop offset="100%" stopColor="#0E7490"/>
      </linearGradient>
      <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981"/>
        <stop offset="100%" stopColor="#059669"/>
      </linearGradient>
    </defs>
  </svg>
)
