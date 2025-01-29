/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/drive-storage/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3-us.googleusercontent.com',
        port: '',
        pathname: '/docsdf/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4-us.googleusercontent.com',
        port: '',
        pathname: '/docsdf/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5-us.googleusercontent.com',
        port: '',
        pathname: '/docsdf/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6-us.googleusercontent.com',
        port: '',
        pathname: '/docsdf/**',
      },
      {
        protocol: 'https',
        hostname: 'lh7-us.googleusercontent.com',
        port: '',
        pathname: '/docsdf/**',
      },
    ],
  },
}

module.exports = nextConfig
