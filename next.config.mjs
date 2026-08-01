/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep native/heavy SDKs out of the webpack bundle — loaded at runtime in the Node.js runtime.
  // @moss-dev/moss-core ships platform .node binaries that must NOT be bundled.
  serverExternalPackages: ['@medplum/core', '@moss-dev/moss', '@moss-dev/moss-core'],
};

export default nextConfig;
