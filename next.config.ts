/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  env: {
    TZ: 'America/Sao_Paulo',
  },
};

module.exports = nextConfig;
