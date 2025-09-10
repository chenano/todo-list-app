const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 14
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = withBundleAnalyzer(nextConfig)