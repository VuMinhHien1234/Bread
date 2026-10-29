import { shopConfig } from "./shop-config";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Dữ liệu có cấu trúc schema.org (Restaurant) cho Google; không có đánh giá hay giá bán trực tuyến. */
export function buildRestaurantJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: shopConfig.name,
    description: shopConfig.tagline,
    url: siteUrl,
    telephone: shopConfig.phone,
    address: { "@type": "PostalAddress", streetAddress: shopConfig.address, addressCountry: "VN" },
    hasMenu: `${siteUrl}/thuc-don`,
    servesCuisine: "Vietnamese",
    openingHoursSpecification: shopConfig.openingHours.map((rule) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: rule.days.map((d) => DAY_NAMES[d]),
      opens: rule.open,
      closes: rule.close,
    })),
  };
}
