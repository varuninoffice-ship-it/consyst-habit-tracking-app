/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // ── Service worker ────────────────────────────────────────────────────
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },

      // ── Security headers — applied to every route ─────────────────────────
      {
        source: "/(.*)",
        headers: [
          // Prevent framing (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },

          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Restrict referrer info to same-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Disable browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },

          // Force HTTPS for 1 year (only active once you have a real domain + TLS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },

          // Content Security Policy
          // - default-src 'self' — block all unlisted sources by default
          // - script-src 'self' 'unsafe-inline' — Next.js requires inline scripts for hydration
          // - style-src 'self' 'unsafe-inline' — Tailwind emits inline styles
          // - img-src allows Supabase Storage (avatars) and data URIs
          // - connect-src allows Supabase API calls from the browser
          // - font-src allows Google Fonts used by Next.js font loader
          // - frame-ancestors 'none' — belt-and-suspenders alongside X-Frame-Options
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
