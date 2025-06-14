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

  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
