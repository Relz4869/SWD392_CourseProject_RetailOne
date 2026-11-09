/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep a running development server independent from production build checks.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};

export default nextConfig;

