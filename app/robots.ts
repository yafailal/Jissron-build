import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses"],
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/checkout/",
          "/courses/*/learn",
          "/signin",
        ],
      },
    ],
    // sitemap: 'https://jissron.com/sitemap.xml',
  };
}
