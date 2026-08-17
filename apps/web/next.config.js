/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['alfredo-condimental-amare.ngrok-free.dev'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.twimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t.me",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
