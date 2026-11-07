import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tesla Solar Report",
    short_name: "Solar Report",
    icons: [
      { src: "/favicon.ico", sizes: "48x48 32x32 16x16", type: "image/x-icon" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    start_url: "/",
    display: "standalone",
    theme_color: "#0E1116",
    background_color: "#0E1116",
  };
}
