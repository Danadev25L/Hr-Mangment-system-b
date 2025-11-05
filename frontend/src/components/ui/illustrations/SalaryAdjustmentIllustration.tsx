export const SalaryAdjustmentIllustration = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle with Gradient */}
      <defs>
        <linearGradient id="salaryAdjustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="sliderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="1" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Main Background Circle */}
      <circle cx="100" cy="100" r="90" fill="url(#salaryAdjustGradient)" opacity="0.1" />
      
      {/* Document/Paper Background */}
      <rect x="50" y="40" width="100" height="130" rx="8" fill="white" stroke="url(#salaryAdjustGradient)" strokeWidth="3" />
      
      {/* Document Lines */}
      <line x1="65" y1="60" x2="110" y2="60" stroke="#10B981" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="65" y1="75" x2="135" y2="75" stroke="#10B981" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="65" y1="90" x2="135" y2="90" stroke="#10B981" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      
      {/* Adjustment Sliders */}
      {/* Slider 1 */}
      <rect x="65" y="105" width="70" height="6" rx="3" fill="#E5E7EB" />
      <rect x="65" y="105" width="45" height="6" rx="3" fill="url(#sliderGradient)" />
      <circle cx="110" cy="108" r="8" fill="#10B981" stroke="white" strokeWidth="2" />
      
      {/* Slider 2 */}
      <rect x="65" y="125" width="70" height="6" rx="3" fill="#E5E7EB" />
      <rect x="65" y="125" width="55" height="6" rx="3" fill="url(#sliderGradient)" />
      <circle cx="120" cy="128" r="8" fill="#059669" stroke="white" strokeWidth="2" />
      
      {/* Slider 3 */}
      <rect x="65" y="145" width="70" height="6" rx="3" fill="#E5E7EB" />
      <rect x="65" y="145" width="35" height="6" rx="3" fill="url(#sliderGradient)" />
      <circle cx="100" cy="148" r="8" fill="#10B981" stroke="white" strokeWidth="2" />
      
      {/* Dollar Sign with Circle */}
      <circle cx="130" cy="50" r="22" fill="url(#salaryAdjustGradient)" />
      <text x="130" y="60" fontSize="28" fontWeight="bold" fill="white" textAnchor="middle">$</text>
      
      {/* Up/Down Arrows */}
      <g transform="translate(55, 50)">
        {/* Up Arrow */}
        <path d="M 0 8 L 5 0 L 10 8" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Down Arrow */}
        <path d="M 0 12 L 5 20 L 10 12" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      
      {/* Plus/Minus Icons */}
      {/* Plus */}
      <g transform="translate(60, 160)">
        <circle cx="0" cy="0" r="6" fill="#34D399" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Minus */}
      <g transform="translate(130, 160)">
        <circle cx="0" cy="0" r="6" fill="#F87171" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Decorative Coins */}
      <circle cx="170" cy="120" r="8" fill="#FBBF24" opacity="0.6" />
      <circle cx="180" cy="135" r="6" fill="#F59E0B" opacity="0.6" />
      <circle cx="165" cy="145" r="7" fill="#FBBF24" opacity="0.6" />
      
      {/* Settings Gear Icon (small) */}
      <g transform="translate(70, 35)">
        <circle cx="0" cy="0" r="5" fill="none" stroke="#10B981" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="2" fill="#10B981" />
        <line x1="0" y1="-7" x2="0" y2="-5" stroke="#10B981" strokeWidth="1.5" />
        <line x1="0" y1="5" x2="0" y2="7" stroke="#10B981" strokeWidth="1.5" />
        <line x1="-7" y1="0" x2="-5" y2="0" stroke="#10B981" strokeWidth="1.5" />
        <line x1="5" y1="0" x2="7" y2="0" stroke="#10B981" strokeWidth="1.5" />
      </g>
    </svg>
  )
}
