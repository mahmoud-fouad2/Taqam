import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    const securityHeaders: Array<{ key: string; value: string }> = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];

    if (isProd) {
      securityHeaders.push(
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        {
          key: "Permissions-Policy",
          value: [
            "camera=()",
            "microphone=()",
            "payment=()",
            "usb=()",
            "accelerometer=()",
            "gyroscope=()",
            "magnetometer=()",
          ].join(", "),
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https:",
            "style-src 'self' 'unsafe-inline' https:",
            // unsafe-eval removed; only kept for development builds if needed
            "script-src 'self' 'unsafe-inline' https:",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https://www.google.com https://recaptcha.google.com",
            "upgrade-insecure-requests",
          ].join("; "),
        }
      );

      // Only set HSTS when served over HTTPS.
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ma-fo.info",
      },
      // Add your R2 custom domain here
      ...(process.env.R2_PUBLIC_DOMAIN
        ? [{ protocol: "https" as const, hostname: process.env.R2_PUBLIC_DOMAIN }]
        : []),
    ]
  }
};

const nextConfigWithIntl = withNextIntl(nextConfig);

const nextConfigWithAnalyzer = withBundleAnalyzer(nextConfigWithIntl);

export default withSentryConfig(nextConfigWithAnalyzer, {
  silent: true,
});

