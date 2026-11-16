import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "K-TECH MEDIA NETWORK",
    short_name: "K-TECH MEDIA",
    description: "Connecting People Through Information.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#E8001D",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png", purpose: "any" }],
  };
}
