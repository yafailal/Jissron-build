import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.b-cdn.net https://iframe.mediadelivery.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net https://*.ufs.sh https://*.utfs.io https://*.uploadthing.com https://lh3.googleusercontent.com data: blob:",
  "media-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net",
  "frame-src 'self' https://iframe.mediadelivery.net https://*.b-cdn.net",
  "connect-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net https://api.resend.com https://*.ingest.uploadthing.com https://*.uploadthing.com https://*.ufs.sh https://*.utfs.io",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=86400; includeSubDomains" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Allow SVG logos uploaded to Site Settings to render via next/image.
    // Sandboxed via CSP so SVGs can't execute scripts.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
