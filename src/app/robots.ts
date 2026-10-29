import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  // Không liệt kê đường dẫn quản trị ở đây (robots.txt ai cũng đọc được); trang quản trị tự gắn noindex.
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
