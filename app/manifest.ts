import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oficiando",
    short_name: "Oficiando",
    description:
      "Marketplace de servicios del hogar en Argentina. Gratis, directo, sin comisiones.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7f4",
    theme_color: "#e8622a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
