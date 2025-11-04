/**
 * Theme Configuration
 * Central configuration for colors, spacing, shadows, and other design tokens
 */

export const theme = {
  // Color Gradients
  gradients: {
    blue: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    purple: 'linear-gradient(135deg, rgb(147 51 234) 0%, rgb(126 34 206) 100%)',
    green: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
    orange: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(234 88 12) 100%)',
    red: 'linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)',
    cyan: 'linear-gradient(135deg, rgb(6 182 212) 0%, rgb(14 165 233) 100%)',
    indigo: 'linear-gradient(135deg, rgb(99 102 241) 0%, rgb(79 70 229) 100%)',
    emerald: 'linear-gradient(135deg, rgb(16 185 129) 0%, rgb(5 150 105) 100%)',
  },

  // Border Gradients (for left borders)
  borderGradients: {
    blue: 'linear-gradient(to bottom, rgb(59 130 246), rgb(37 99 235))',
    purple: 'linear-gradient(to bottom, rgb(147 51 234), rgb(126 34 206))',
    green: 'linear-gradient(to bottom, rgb(34 197 94), rgb(22 163 74))',
    orange: 'linear-gradient(to bottom, rgb(249 115 22), rgb(234 88 12))',
    red: 'linear-gradient(to bottom, rgb(239 68 68), rgb(220 38 38))',
    cyan: 'linear-gradient(to bottom, rgb(6 182 212), rgb(14 165 233))',
    indigo: 'linear-gradient(to bottom, rgb(99 102 241), rgb(79 70 229))',
  },

  // Solid Colors
  colors: {
    primary: {
      50: 'rgb(239 246 255)',
      100: 'rgb(219 234 254)',
      200: 'rgb(191 219 254)',
      300: 'rgb(147 197 253)',
      400: 'rgb(96 165 250)',
      500: 'rgb(59 130 246)',
      600: 'rgb(37 99 235)',
      700: 'rgb(29 78 216)',
      800: 'rgb(30 64 175)',
      900: 'rgb(30 58 138)',
    },
    gray: {
      50: 'rgb(249 250 251)',
      100: 'rgb(243 244 246)',
      200: 'rgb(229 231 235)',
      300: 'rgb(209 213 219)',
      400: 'rgb(156 163 175)',
      500: 'rgb(107 114 128)',
      600: 'rgb(75 85 99)',
      700: 'rgb(55 65 81)',
      800: 'rgb(31 41 55)',
      900: 'rgb(17 24 39)',
    },
    success: {
      light: 'rgb(187 247 208)',
      main: 'rgb(34 197 94)',
      dark: 'rgb(21 128 61)',
    },
    warning: {
      light: 'rgb(254 215 170)',
      main: 'rgb(249 115 22)',
      dark: 'rgb(194 65 12)',
    },
    error: {
      light: 'rgb(254 202 202)',
      main: 'rgb(239 68 68)',
      dark: 'rgb(185 28 28)',
    },
    info: {
      light: 'rgb(191 219 254)',
      main: 'rgb(59 130 246)',
      dark: 'rgb(29 78 216)',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.625rem',  // 10px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    colored: {
      blue: '0 8px 16px rgba(59, 130, 246, 0.3)',
      purple: '0 8px 16px rgba(147, 51, 234, 0.3)',
      green: '0 8px 16px rgba(34, 197, 94, 0.3)',
      orange: '0 8px 16px rgba(249, 115, 22, 0.3)',
      red: '0 8px 16px rgba(239, 68, 68, 0.3)',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '500ms ease',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
}

// Helper function to get gradient CSS
export const getGradient = (color: keyof typeof theme.gradients) => {
  return theme.gradients[color]
}

// Helper function to get border gradient CSS
export const getBorderGradient = (color: keyof typeof theme.borderGradients) => {
  return theme.borderGradients[color]
}

// Breakpoints for responsive design
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
