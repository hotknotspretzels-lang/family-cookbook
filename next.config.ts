import type { NextConfig } from "next";

function supabaseImagePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    return [
      {
        protocol: url.protocol.slice(0, -1) as "https" | "http",
        hostname: url.hostname,
        pathname: "/storage/v1/object/public/recipe-photos/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/recipe-photos/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/recipe-photos/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/storage/v1/object/public/recipe-photos/**",
      },
      ...(supabaseImagePattern() ?? []),
    ],
  },
};

export default nextConfig;
