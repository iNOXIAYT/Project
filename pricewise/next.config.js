/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      serverComponentsExternalPackages: ['mongoose']
    },
    
  },
  images: {
    domains: ['m.media-amazon.com']
  }
}

module.exports = nextConfig