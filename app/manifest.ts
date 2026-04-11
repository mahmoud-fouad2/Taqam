import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taqam | طاقم",
    short_name: "Taqam",
    description: "Saudi HR, payroll, attendance, and workforce operations platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ar-SA",
    dir: "rtl",
    icons: [
      {
        src: "/icons/favicon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/favicon-256.png",
        sizes: "256x256",
        type: "image/png"
      },
      {
        src: "/icons/mark-light-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
