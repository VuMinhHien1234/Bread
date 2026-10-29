import "server-only";
import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const UPLOAD_ALLOWED_FORMATS = "jpg,png,webp";

/**
 * Ký tham số theo quy tắc của Cloudinary: sắp xếp tên tham số theo thứ tự chữ cái,
 * nối dạng `k=v&k=v`, cộng API secret rồi băm SHA-1.
 */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");
}

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

/**
 * Chữ ký cho phép trình duyệt tải ảnh trực tiếp lên Cloudinary mà không biết API secret.
 * Chữ ký khóa cứng thư mục và định dạng, nên không dùng để tải lên chỗ khác được.
 */
export function createUploadSignature(now: Date = new Date()): UploadSignature {
  const env = getServerEnv();
  const timestamp = Math.floor(now.getTime() / 1000);
  const signature = signCloudinaryParams(
    { allowed_formats: UPLOAD_ALLOWED_FORMATS, folder: env.CLOUDINARY_FOLDER, timestamp },
    env.CLOUDINARY_API_SECRET,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder: env.CLOUDINARY_FOLDER,
    allowedFormats: UPLOAD_ALLOWED_FORMATS,
    signature,
  };
}

/** Xóa ảnh trên Cloudinary. Trả false nếu Cloudinary từ chối; gọi từ server action, không dùng trigger DB. */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  const env = getServerEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams(
    { public_id: publicId, timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body },
  );
  if (!response.ok) return false;
  const result = (await response.json()) as { result?: string };
  return result.result === "ok" || result.result === "not found";
}
