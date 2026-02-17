//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // Use standalone output only for Docker builds (not Vercel)
  ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const nextConfigWithRewrites = {
  ...nextConfig,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = composePlugins(...plugins)(nextConfigWithRewrites);
