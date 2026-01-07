/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/core", "@repo/database", "@repo/ui"],
};

export default nextConfig;
