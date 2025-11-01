/** @type {import('next').NextConfig} */
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
  webpack: (config) => {
    // Fix for antd and other modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

module.exports = nextConfig;