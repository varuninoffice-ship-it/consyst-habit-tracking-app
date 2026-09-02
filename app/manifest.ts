import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Consyst — Your personal operating system",
    short_name: "Consyst",
    description:
      "Track daily habits, measure weekly progress, and build the consistency that compounds.",
    start_url: "/now",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF8",
    theme_color: "#111111",
    categories: ["productivity", "health", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/consyst-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: "any maskable" as any,
      },
    ],
  };
}
