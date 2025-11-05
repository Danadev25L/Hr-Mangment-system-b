import React from 'react'

interface AnnouncementsIllustrationProps {
  className?: string
}

export const AnnouncementsIllustration: React.FC<AnnouncementsIllustrationProps> = ({ 
  className = "w-24 h-24" 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="announcementGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="announcementGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="announcementGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id="announcementShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" floodColor="#F59E0B"/>
        </filter>
      </defs>
      
      {/* Background Circle */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#announcementGradient1)"
      />
      
      {/* Megaphone Body */}
      <g filter="url(#announcementShadow)">
        {/* Megaphone Cone */}
        <path
          d="M 60 80 L 60 120 L 100 140 L 100 60 Z"
          fill="url(#announcementGradient2)"
          stroke="#D97706"
          strokeWidth="2"
        />
        
        {/* Megaphone Front */}
        <ellipse
          cx="100"
          cy="100"
          rx="15"
          ry="40"
          fill="url(#announcementGradient3)"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        
        {/* Megaphone Handle */}
        <rect
          x="55"
          y="115"
          width="20"
          height="35"
          rx="8"
          fill="url(#announcementGradient2)"
          stroke="#D97706"
          strokeWidth="2"
        />
        
        {/* Inner Circle Detail */}
        <ellipse
          cx="100"
          cy="100"
          rx="8"
          ry="30"
          fill="#FBBF24"
          opacity="0.5"
        />
      </g>
      
      {/* Sound Waves */}
      <g opacity="0.6">
        <path
          d="M 120 70 Q 135 70 145 80"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 120 90 Q 145 90 160 95"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 120 110 Q 145 110 160 105"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 120 130 Q 135 130 145 120"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* Notification Dots */}
      <circle cx="140" cy="60" r="6" fill="#FCD34D">
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="155" cy="75" r="5" fill="#FBBF24">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="165" cy="95" r="6" fill="#F59E0B">
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}
