import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts"],
  },
  {
    // Quy tắc CODING-RULES mục 3, 7, 14
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Script dòng lệnh cần in kết quả ra màn hình cho người dùng
    files: ["scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
