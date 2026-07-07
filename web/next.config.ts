import type { NextConfig } from "next";

// Internal single-team tool: no third-party scripts, no embedding in
// other sites, no reason to ever be indexed. `'unsafe-inline'` on
// script-src/style-src is required because this app doesn't wire up
// per-request CSP nonces (see docs/superpowers for the tradeoff) — it
// still blocks the things that matter most here: framing (clickjacking),
// arbitrary object/embed content, and non-same-origin form submission.
// `'unsafe-eval'` is added only in dev — Next.js/Turbopack's HMR and the
// dev error overlay use eval() to rebuild modules and stack traces;
// production doesn't need it and stays stricter.
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";

const cspHeader = `
  default-src 'self';
  script-src ${scriptSrc};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://i.ytimg.com https://*.ytimg.com https://*.public.blob.vercel-storage.com;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
