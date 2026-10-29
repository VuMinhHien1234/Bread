import type { UploadSignature } from "@/server/services/cloudinary";

/** Giới hạn ảnh món: 5 MB, chỉ jpg / png / webp (khớp `allowed_formats` trong chữ ký upload). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Trả thông báo lỗi tiếng Việt, hoặc null nếu tệp dùng được. */
export function validateImageFile(file: { size: number; type: string }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Chỉ nhận ảnh JPG, PNG hoặc WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Ảnh quá lớn, tối đa 5 MB.";
  return null;
}

export type UploadedImage = { publicId: string; url: string; width: number; height: number };

type CloudinaryResponse = {
  public_id?: string;
  secure_url?: string;
  width?: number;
  height?: number;
  error?: { message?: string };
};

/**
 * Tải ảnh thẳng từ trình duyệt lên Cloudinary bằng chữ ký do server cấp.
 * Các tham số gửi lên phải đúng với tham số đã ký (folder, allowed_formats, timestamp).
 */
export async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
  fetchFn: typeof fetch = fetch,
): Promise<UploadedImage> {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signature.apiKey);
  body.append("timestamp", String(signature.timestamp));
  body.append("folder", signature.folder);
  body.append("allowed_formats", signature.allowedFormats);
  body.append("signature", signature.signature);

  const response = await fetchFn(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: "POST", body },
  );
  const result = (await response.json()) as CloudinaryResponse;
  if (!response.ok || !result.public_id || !result.secure_url || !result.width || !result.height) {
    throw new Error(result.error?.message ?? "Tải ảnh lên không thành công.");
  }
  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  };
}
