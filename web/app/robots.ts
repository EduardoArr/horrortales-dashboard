import type { MetadataRoute } from "next";

// Internal tool, never meant to be publicly discoverable — disallow all
// crawling regardless of what deployment URL it ends up on.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
