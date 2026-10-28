/** @type {import('next').NextConfig} */
const isExport = process.env.EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
