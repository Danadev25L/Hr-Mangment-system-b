/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18next/request.ts');

const nextConfig = {
  // Enhanced module resolution
  transpilePackages: ['antd', '@ant-design/icons'],
  experimental: {
    esmExternals: 'loose'
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