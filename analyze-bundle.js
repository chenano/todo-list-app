const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add bundle analyzer in production builds when ANALYZE=true
    if (process.env.ANALYZE === 'true' && !isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }

    // Optimize chunks for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for stable dependencies
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // React chunk
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 30,
          },
          // UI library chunk
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority)[\\/]/,
            priority: 25,
          },
          // Date utilities chunk
          date: {
            name: 'date',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
            priority: 25,
          },
          // Virtual scrolling chunk
          virtual: {
            name: 'virtual',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react-window|react-window-infinite-loader)[\\/]/,
            priority: 25,
          },
        },
      };
    }

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,
    // Optimize CSS
    optimizeCss: true,
    // Enable SWC minification
    swcMinify: true,
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compress responses
  compress: true,

  // Enable static optimization
  trailingSlash: false,

  // Optimize fonts
  optimizeFonts: true,

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Remove console logs in production
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

module.exports = nextConfig;