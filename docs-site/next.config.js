/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@uischema/core', '@uischema/react', '@uischema/protocol', '@uischema/bridges', '@uischema/compressed'],
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', 'lucide-react'],
  },
  outputFileTracingRoot: require('path').join(__dirname, '../'),
}

module.exports = nextConfig
