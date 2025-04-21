const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsdom', 'puppeteer', 'pdf-parse']
  },
  images: {
    domains: [
      'www.google.com', 
      'www.bing.com', 
      'source.unsplash.com', 
      'my.matterport.com', 
      'photos.zillowstatic.com', 
      'images1.loopnet.com',
      'maps.googleapis.com',
      'images.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.bing.com',
      },
      {
        protocol: 'https',
        hostname: '*.pinecone.io',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.matterport.com',
      },
      {
        protocol: 'https',
        hostname: 'photos.zillowstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images1.loopnet.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
        path: false,
        os: false,
      };
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdf-parse', 'handlebars');
    }
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

module.exports = nextConfig;