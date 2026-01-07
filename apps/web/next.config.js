/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/core", "@repo/database", "@repo/ui"],
    output: "standalone",
    typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
