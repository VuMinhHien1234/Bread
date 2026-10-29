import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ADMIN_BASE, ADMIN_LOGIN_PATH, ADMIN_SEGMENT, adminPath } from "./admin-path";

const root = fileURLToPath(new URL("../..", import.meta.url));

describe("đường dẫn quản trị", () => {
  it("không dùng /admin dễ đoán", () => {
    expect(ADMIN_SEGMENT).not.toBe("admin");
    expect(ADMIN_BASE).toBe(`/${ADMIN_SEGMENT}`);
  });

  it("ghép đường dẫn con", () => {
    expect(adminPath()).toBe(ADMIN_BASE);
    expect(adminPath("mon/moi")).toBe(`${ADMIN_BASE}/mon/moi`);
    expect(adminPath("/lien-he")).toBe(`${ADMIN_BASE}/lien-he`);
    expect(ADMIN_LOGIN_PATH).toBe(`${ADMIN_BASE}/dang-nhap`);
  });

  it("thư mục trang trong src/app trùng với ADMIN_SEGMENT", () => {
    expect(existsSync(`${root}/src/app/${ADMIN_SEGMENT}/dang-nhap/page.tsx`)).toBe(true);
    expect(existsSync(`${root}/src/app/admin`)).toBe(false);
  });

  it("matcher trong proxy.ts trùng với ADMIN_SEGMENT", () => {
    const proxy = readFileSync(`${root}/src/proxy.ts`, "utf8");
    expect(proxy).toContain(`matcher: ["/${ADMIN_SEGMENT}/:path*"]`);
  });

  it("robots.txt không làm lộ đường dẫn quản trị", () => {
    const robots = readFileSync(`${root}/src/app/robots.ts`, "utf8");
    expect(robots).not.toContain(ADMIN_SEGMENT);
    expect(robots).not.toContain("/admin");
  });
});
