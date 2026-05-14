import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.b-cdn.net https://iframe.mediadelivery.net https://unpkg.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net https://utfs.io https://*.ufs.sh https://*.utfs.io https://*.uploadthing.com https://lh3.googleusercontent.com data: blob:",
  "media-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net https://utfs.io https://*.ufs.sh https://*.utfs.io",
  "frame-src 'self' https://iframe.mediadelivery.net https://*.b-cdn.net https://utfs.io https://*.ufs.sh https://*.utfs.io https://*.uploadthing.com",
  "connect-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net https://api.resend.com https://*.ingest.uploadthing.com https://*.uploadthing.com https://utfs.io https://*.ufs.sh https://*.utfs.io https://unpkg.com",
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
  // pdfjs-dist optionally imports `canvas` for Node.js rendering. We only use it
  // in the browser, so stub it out so webpack doesn't try to resolve the native binding.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Friendly short URLs for the most commonly typed CMS pages. The actual
    // content lives under /p/[slug] which is the generic CMS renderer.
    return [
      { source: "/privacy", destination: "/p/privacy", permanent: true },
      { source: "/terms", destination: "/p/terms", permanent: true },
    ];
  },
};

export default nextConfig;
