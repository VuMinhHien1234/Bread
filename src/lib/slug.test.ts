import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("bỏ dấu tiếng Việt và đổi đ thành d", () => {
    expect(slugify("Bánh mì thịt nướng")).toBe("banh-mi-thit-nuong");
    expect(slugify("Đặc biệt")).toBe("dac-biet");
  });

  it("gộp ký tự lạ và khoảng trắng thừa thành một dấu gạch", () => {
    expect(slugify("  Cà phê  sữa / đá!! ")).toBe("ca-phe-sua-da");
  });

  it("trả chuỗi rỗng khi không còn ký tự hợp lệ", () => {
    expect(slugify("!!!")).toBe("");
  });
});
