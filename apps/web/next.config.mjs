const backendUrl = new URL(
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"
);

const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL)
  : null;

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.medusajs.com",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: backendUrl.protocol.replace(":", ""),
        hostname: backendUrl.hostname,
        ...(backendUrl.port ? { port: backendUrl.port } : {}),
      },
      ...(mediaUrl
        ? [{ protocol: mediaUrl.protocol.replace(":", ""), hostname: mediaUrl.hostname }]
        : []),
    ],
  },
};

export default nextConfig;
