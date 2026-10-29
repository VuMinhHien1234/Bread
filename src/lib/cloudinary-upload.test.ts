import { describe, expect, it, vi } from "vitest";
import { MAX_IMAGE_BYTES, uploadToCloudinary, validateImageFile } from "./cloudinary-upload";

const signature = {
  cloudName: "demo",
  apiKey: "key",
  timestamp: 1_700_000_000,
  folder: "banh-mi",
  allowedFormats: "jpg,png,webp",
  signature: "abc123",
};

describe("validateImageFile", () => {
  it("nhận jpg, png, webp trong giới hạn 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImageFile({ type, size: 1000 })).toBeNull();
    }
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
  });

  it("từ chối định dạng khác và ảnh quá lớn", () => {
    expect(validateImageFile({ type: "image/gif", size: 1000 })).toContain("JPG");
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).toContain("JPG");
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toContain("5 MB");
  });
});

describe("uploadToCloudinary", () => {
  const file = new File(["x"], "banh-mi.jpg", { type: "image/jpeg" });

  it("gửi đúng các tham số đã ký và trả thông tin ảnh", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          public_id: "banh-mi/a",
          secure_url: "https://res.cloudinary.com/demo/a.jpg",
          width: 800,
          height: 600,
        }),
        { status: 200 },
      ),
    );
    const result = await uploadToCloudinary(file, signature, fetchFn);

    expect(result).toEqual({
      publicId: "banh-mi/a",
      url: "https://res.cloudinary.com/demo/a.jpg",
      width: 800,
      height: 600,
    });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const body = init.body as FormData;
    expect(body.get("signature")).toBe("abc123");
    expect(body.get("folder")).toBe("banh-mi");
    expect(body.get("allowed_formats")).toBe("jpg,png,webp");
    expect(body.get("timestamp")).toBe("1700000000");
    expect(body.get("api_key")).toBe("key");
    expect(body.has("api_secret")).toBe(false);
  });

  it("báo lỗi khi Cloudinary từ chối", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Invalid Signature" } }), { status: 401 }),
      );
    await expect(uploadToCloudinary(file, signature, fetchFn)).rejects.toThrow("Invalid Signature");
  });
});
