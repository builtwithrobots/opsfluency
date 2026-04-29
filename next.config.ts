import type { NextConfig } from "next";

const securityHeaders = [
  // Enables browser-side DNS prefetching for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS: enforce HTTPS for 2 years, including subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent clickjacking — allow framing only from same origin (Clerk hosted UI)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send origin only on cross-origin requests; no path/query leakage
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera=(self) allows the worker PWA QR scanner to access the camera.
  // Restricting to (self) means embedded iframes cannot request camera access.
  // microphone and geolocation remain blocked — OpsFluency has no use for them.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    // unsafe-inline and unsafe-eval are required by Clerk's hosted auth
    // components and cannot be removed without breaking the auth flow.
    // Tighten once Clerk provides a nonce-based CSP guide.
    //
    // Clerk domain notes:
    //   - clerk.opsfluency.com  → custom frontend API domain (serves clerk.browser.js)
    //   - clerk.accounts.dev / *.clerk.accounts.dev → dev/fallback instances
    // Both must be in script-src and connect-src or Clerk silently fails to load.
    //
    // frame-src notes:
    //   - 'self' — emulator page renders worker PWA in a same-origin iframe
    //   - YouTube — external URL QR codes; youtube-nocookie.com is privacy-preserving
    //   - Loom — screen-recording walkthroughs common in SOP content
    //   - Vimeo — professional training video hosting
    //   - Google Drive — PDF/slide/video embeds from Drive
    //   - *.sharepoint.com — covers OneDrive for Business AND Microsoft Stream
    //     (Stream is now SharePoint-embedded); onedrive.live.com covers personal OneDrive
    //   - web.microsoftstream.com — legacy Stream URLs still in circulation
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.opsfluency.com https://clerk.accounts.dev https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com https://i.ytimg.com https://vumbnail.com https://*.loom.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://clerk.opsfluency.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://api.anthropic.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.loom.com https://player.vimeo.com https://drive.google.com https://*.sharepoint.com https://onedrive.live.com https://web.microsoftstream.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
