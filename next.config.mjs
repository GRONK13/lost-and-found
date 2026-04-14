/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
