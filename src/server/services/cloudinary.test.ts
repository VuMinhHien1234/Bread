import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

// `server-only` chỉ chạy được trong Next.js; test chạy ngoài Next nên giả lập nó.
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

const { signCloudinaryParams } = await import("./cloudinary");

describe("signCloudinaryParams", () => {
  it("sắp xếp tham số theo tên rồi băm SHA-1 cùng secret", () => {
    const expected = createHash("sha1")
      .update("folder=menu&timestamp=1700000000SECRET")
      .digest("hex");
    // Cố ý đưa tham số sai thứ tự để kiểm tra việc sắp xếp
    expect(signCloudinaryParams({ timestamp: 1700000000, folder: "menu" }, "SECRET")).toBe(
      expected,
    );
  });

  it("đổi secret thì chữ ký đổi", () => {
    const params = { folder: "menu", timestamp: 1 };
    expect(signCloudinaryParams(params, "A")).not.toBe(signCloudinaryParams(params, "B"));
  });
});
