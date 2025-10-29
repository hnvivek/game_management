import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure allowed dev origins to prevent cross-origin warnings
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  
  // Webpack configuration optimized for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Enable proper file watching for hot reload
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change
        ignored: /node_modules/, // Only ignore node_modules
      };
      
      // Ensure proper hot module replacement
      config.cache = false; // Disable cache in development for nodemon compatibility
    }
    return config;
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimental features for better development experience
  experimental: {
    // Enable faster refresh
    forceSwcTransforms: true,
  },
};

export default nextConfig;
