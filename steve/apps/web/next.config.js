/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

module.exports = nextConfig;
