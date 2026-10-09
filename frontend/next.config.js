/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/account', destination: '/customer/profile', permanent: true },
      { source: '/orders', destination: '/customer/profile/orders', permanent: true },
      { source: '/build-pc', destination: '/customer/build-pc', permanent: true },
      { source: '/products', destination: '/customer/products', permanent: true },
      { source: '/cart', destination: '/customer/cart', permanent: true },
      { source: '/checkout', destination: '/customer/checkout', permanent: true },
      { source: '/wishlist', destination: '/customer/wishlist', permanent: true },
      { source: '/dashboard', destination: '/admin/dashboard', permanent: true },
      { source: '/dashboard/:path+', destination: '/admin/:path+', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

module.exports = nextConfig;
