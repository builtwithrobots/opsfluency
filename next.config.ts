import type { NextConfig } from "next";
import { createRequire } from "module";

// next-pwa v5 is CommonJS — use createRequire to import from an ESM config.
const require = createRequire(import.meta.url);
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable service worker in dev — hot reload and SW caching conflict.
  disable: process.env.NODE_ENV === "development",
  // Only cache the employee PWA routes, not the manager dashboard.
  // The manager dashboard is not designed for offline use.
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.+\/app\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "employee-pwa-pages",
        expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

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
    //   - *.supabase.co — Supabase Storage signed URLs for the SOP original file
    //     viewer (OriginalEmbed renders PDFs in an iframe, not an <object>, so
    //     object-src can stay 'none').
    value: [
      "default-src 'self'",
      // unsafe-inline + unsafe-eval required by Clerk's hosted auth components.
      // challenges.cloudflare.com is required for Clerk's Cloudflare Turnstile CAPTCHA.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.opsfluency.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com blob:",
      // script-src-elem must be set explicitly; without it some Chromium versions
      // refuse to load inline/external scripts even when script-src allows them.
      "script-src-elem 'self' 'unsafe-inline' https://clerk.opsfluency.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com blob:",
      // Clerk creates service workers from blob: URLs. worker-src must be
      // explicit because it falls back to script-src when absent, and
      // script-src alone doesn't grant blob: worker execution.
      "worker-src blob: 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com https://i.ytimg.com https://vumbnail.com https://*.loom.com",
      "font-src 'self'",
      // challenges.cloudflare.com: Turnstile CAPTCHA makes XHR calls back to Cloudflare.
      // clerk-telemetry.com: Clerk SDK telemetry endpoint.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://clerk.opsfluency.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://api.clerk.com https://api.anthropic.com https://challenges.cloudflare.com https://clerk-telemetry.com",
      // challenges.cloudflare.com: Turnstile renders the CAPTCHA widget inside a sandboxed iframe.
      "frame-src 'self' https://challenges.cloudflare.com https://*.supabase.co https://www.youtube.com https://www.youtube-nocookie.com https://www.loom.com https://player.vimeo.com https://drive.google.com https://*.sharepoint.com https://onedrive.live.com https://web.microsoftstream.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // next-pwa v5 injects a webpack config; Next.js 16 requires an explicit
  // turbopack config (even empty) to suppress the "webpack config but no
  // turbopack config" build error introduced in Next 16.
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/what-i-do",
        destination: "/services",
        permanent: true,
      },
    ];
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

export default withPWA(nextConfig);
