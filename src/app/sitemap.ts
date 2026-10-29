import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getAllMenuSlugs } from "@/server/queries/public";

// Danh sách món lấy từ DB nên không dựng lúc build.
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/thuc-don",
  "/dat-mon",
  "/lien-he",
  "/gioi-thieu",
  "/chinh-sach-bao-mat",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const slugs = await getAllMenuSlugs().catch(() => []);
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path}` })),
    ...slugs.map((item) => ({ url: `${base}/thuc-don/${item}` })),
  ];
}
