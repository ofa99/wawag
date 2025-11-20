/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google Auth profile pictures
  },
  transpilePackages: ['firebase', 'undici'],
};

module.exports = nextConfig;
