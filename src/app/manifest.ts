import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Cookbook",
    short_name: "Cookbook",
    description: "Recipes from our kitchen.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe4",
    theme_color: "#8c3b2c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
