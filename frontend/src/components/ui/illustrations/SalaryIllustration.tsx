export function SalaryIllustration({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="salaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Money bag */}
      <ellipse
        cx="100"
        cy="145"
        rx="45"
        ry="50"
        fill="url(#salaryGradient)"
        opacity="0.9"
      />
      
      {/* Bag tie/string */}
      <path
        d="M 80 100 Q 90 90 100 90 Q 110 90 120 100"
        stroke="url(#salaryGradient)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Dollar sign on bag */}
      <text
        x="100"
        y="155"
        fontSize="40"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        $
      </text>

      {/* Floating coins */}
      <g opacity="0.9">
        {/* Coin 1 */}
        <circle cx="50" cy="70" r="15" fill="url(#coinGradient)" />
        <text
          x="50"
          y="76"
          fontSize="16"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          $
        </text>
        
        {/* Coin 2 */}
        <circle cx="150" cy="60" r="18" fill="url(#coinGradient)" />
        <text
          x="150"
          y="67"
          fontSize="20"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          $
        </text>
        
        {/* Coin 3 */}
        <circle cx="130" cy="120" r="12" fill="url(#coinGradient)" />
        <text
          x="130"
          y="125"
          fontSize="14"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          $
        </text>
      </g>

      {/* Sparkles */}
      <g fill="#FCD34D" opacity="0.8">
        <circle cx="35" cy="110" r="3">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="165" cy="100" r="3">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="70" cy="40" r="2.5">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="170" cy="140" r="2.5">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            begin="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Animation for coins */}
      <animateTransform
        href="#coinGradient"
        attributeName="transform"
        type="rotate"
        from="0 100 100"
        to="360 100 100"
        dur="20s"
        repeatCount="indefinite"
      />
    </svg>
  )
}
