'use client'

import React from 'react'

interface DashboardIllustrationProps {
  className?: string
}

export function DashboardIllustration({ className = '' }: DashboardIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="800" height="600" fill="url(#gradient-bg)" />
      
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="gradient-bg" x1="0" y1="0" x2="800" y2="600">
          <stop offset="0%" stopColor="#667eea" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#764ba2" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gradient-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        <linearGradient id="gradient-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f093fb" />
          <stop offset="100%" stopColor="#f5576c" />
        </linearGradient>
        <linearGradient id="gradient-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>
      </defs>

      {/* Dashboard Monitor */}
      <g transform="translate(150, 100)">
        {/* Monitor Frame */}
        <rect x="0" y="0" width="500" height="350" rx="10" fill="#1F2937" stroke="#374151" strokeWidth="2" />
        <rect x="10" y="10" width="480" height="300" rx="5" fill="#111827" />
        
        {/* Monitor Stand */}
        <rect x="220" y="350" width="60" height="80" fill="#374151" />
        <rect x="180" y="430" width="140" height="10" rx="5" fill="#4B5563" />

        {/* Dashboard Elements */}
        {/* Chart 1 - Bar Chart */}
        <g transform="translate(30, 40)">
          <rect x="0" y="60" width="20" height="80" rx="3" fill="url(#gradient-1)" opacity="0.8" />
          <rect x="30" y="40" width="20" height="100" rx="3" fill="url(#gradient-1)" opacity="0.8" />
          <rect x="60" y="50" width="20" height="90" rx="3" fill="url(#gradient-1)" opacity="0.8" />
          <rect x="90" y="30" width="20" height="110" rx="3" fill="url(#gradient-1)" opacity="0.8" />
        </g>

        {/* Chart 2 - Line Chart */}
        <g transform="translate(180, 40)">
          <polyline
            points="0,100 30,80 60,90 90,60 120,70 150,40"
            fill="none"
            stroke="url(#gradient-2)"
            strokeWidth="3"
          />
          <circle cx="0" cy="100" r="4" fill="url(#gradient-2)" />
          <circle cx="30" cy="80" r="4" fill="url(#gradient-2)" />
          <circle cx="60" cy="90" r="4" fill="url(#gradient-2)" />
          <circle cx="90" cy="60" r="4" fill="url(#gradient-2)" />
          <circle cx="120" cy="70" r="4" fill="url(#gradient-2)" />
          <circle cx="150" cy="40" r="4" fill="url(#gradient-2)" />
        </g>

        {/* Stats Cards */}
        <g transform="translate(30, 180)">
          <rect x="0" y="0" width="100" height="60" rx="5" fill="url(#gradient-1)" opacity="0.3" />
          <text x="10" y="25" fill="#fff" fontSize="20" fontWeight="bold">250</text>
          <text x="10" y="45" fill="#E5E7EB" fontSize="10">Employees</text>
        </g>

        <g transform="translate(150, 180)">
          <rect x="0" y="0" width="100" height="60" rx="5" fill="url(#gradient-2)" opacity="0.3" />
          <text x="10" y="25" fill="#fff" fontSize="20" fontWeight="bold">15</text>
          <text x="10" y="45" fill="#E5E7EB" fontSize="10">Departments</text>
        </g>

        <g transform="translate(270, 180)">
          <rect x="0" y="0" width="100" height="60" rx="5" fill="url(#gradient-3)" opacity="0.3" />
          <text x="10" y="25" fill="#fff" fontSize="20" fontWeight="bold">48</text>
          <text x="10" y="45" fill="#E5E7EB" fontSize="10">Requests</text>
        </g>
      </g>

      {/* Decorative Elements */}
      {/* Floating Icons */}
      <g opacity="0.4">
        {/* User Icon */}
        <circle cx="100" cy="200" r="25" fill="url(#gradient-1)" opacity="0.2" />
        <path
          d="M 100 195 A 8 8 0 1 1 100 195.01 M 100 203 A 12 12 0 0 1 88 215 L 112 215 A 12 12 0 0 1 100 203"
          fill="url(#gradient-1)"
          transform="translate(0, -5)"
        />

        {/* Chart Icon */}
        <circle cx="700" cy="150" r="25" fill="url(#gradient-2)" opacity="0.2" />
        <rect x="688" y="160" width="4" height="10" rx="1" fill="url(#gradient-2)" />
        <rect x="695" y="155" width="4" height="15" rx="1" fill="url(#gradient-2)" />
        <rect x="702" y="150" width="4" height="20" rx="1" fill="url(#gradient-2)" />
        <rect x="709" y="145" width="4" height="25" rx="1" fill="url(#gradient-2)" />

        {/* Document Icon */}
        <circle cx="120" cy="480" r="20" fill="url(#gradient-3)" opacity="0.2" />
        <rect x="110" y="470" width="20" height="25" rx="2" fill="none" stroke="url(#gradient-3)" strokeWidth="2" />
        <line x1="113" y1="475" x2="127" y2="475" stroke="url(#gradient-3)" strokeWidth="1.5" />
        <line x1="113" y1="480" x2="127" y2="480" stroke="url(#gradient-3)" strokeWidth="1.5" />
        <line x1="113" y1="485" x2="122" y2="485" stroke="url(#gradient-3)" strokeWidth="1.5" />

        {/* Dollar Icon */}
        <circle cx="680" cy="480" r="20" fill="url(#gradient-1)" opacity="0.2" />
        <text x="673" y="490" fill="url(#gradient-1)" fontSize="24" fontWeight="bold">$</text>
      </g>

      {/* Animated Dots */}
      <g className="animate-pulse">
        <circle cx="50" cy="100" r="3" fill="#667eea" opacity="0.6" />
        <circle cx="750" cy="500" r="3" fill="#f5576c" opacity="0.6" />
        <circle cx="400" cy="50" r="3" fill="#00f2fe" opacity="0.6" />
      </g>
    </svg>
  )
}

export function AnalyticsIllustration({ className = '' }: AnalyticsIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="analytics-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Pie Chart */}
      <g transform="translate(100, 150)">
        <circle cx="0" cy="0" r="80" fill="none" stroke="#E5E7EB" strokeWidth="40" strokeDasharray="251.2" />
        <circle
          cx="0"
          cy="0"
          r="80"
          fill="none"
          stroke="url(#analytics-gradient)"
          strokeWidth="40"
          strokeDasharray="150 251.2"
          transform="rotate(-90)"
        />
      </g>

      {/* Rising Arrow */}
      <g transform="translate(280, 100)">
        <polyline
          points="0,100 20,80 40,90 60,60 80,50"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
        />
        <polygon points="80,50 75,55 85,55" fill="#10B981" />
      </g>
    </svg>
  )
}

interface AnalyticsIllustrationProps {
  className?: string
}
