/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/eigen',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/eigen',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb"
    }
  }
};

export default nextConfig;
