/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18next/request.ts');

const nextConfig = {
  // Enhanced module resolution
  transpilePackages: ['antd', '@ant-design/icons'],
  experimental: {
    esmExternals: 'loose',
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: ['antd', '@ant-design/icons', 'recharts'], // Tree-shake heavy packages
  },

  // Performance optimizations
  reactStrictMode: false, // Disable for production performance
  swcMinify: true, // Use SWC for faster minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },

  // Optimize images and fonts
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Reduce bundle size
  modularizeImports: {
    '@ant-design/icons': {
      transform: '@ant-design/icons/{{member}}',
    },
  },

  // API proxy to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*', // Proxy to backend
      },
    ];
  },

  // Webpack configuration for better module resolution
  webpack: (config, { dev, isServer }) => {
    // Fix for antd and other modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Disable WebSocket in development
    if (dev && !isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    return config;
  },
};

module.exports = withNextIntl(nextConfig);