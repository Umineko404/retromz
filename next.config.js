/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'upload.wikimedia.org',
      'images.launchbox-app.com',
      'static.wikia.nocookie.net',
      'nintendo.fandom.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable static optimization
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
