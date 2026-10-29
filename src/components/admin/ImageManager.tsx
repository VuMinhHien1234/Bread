"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary-upload";
import {
  addMenuItemImage,
  deleteMenuItemImage,
  getUploadSignature,
  reorderImages,
  setPrimaryImage,
} from "@/server/actions/admin/images";
import { useAdminAction } from "./use-admin-action";

export type ImageRow = { id: string; url: string; alt: string | null; isPrimary: boolean };

export function ImageManager({ menuItemId, images }: { menuItemId: string; images: ImageRow[] }) {
  const { run, isPending } = useAdminAction();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleting, setDeleting] = useState<ImageRow | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const problem = validateImageFile(file);
        if (problem) {
          toast(`${file.name}: ${problem}`, "error");
          continue;
        }
        const signature = await getUploadSignature();
        if (!signature.ok) {
          toast(signature.error, "error");
          break;
        }
        try {
          const uploaded = await uploadToCloudinary(file, signature.data);
          await run(
            () =>
              addMenuItemImage({
                menuItemId,
                publicId: uploaded.publicId,
                url: uploaded.url,
                width: uploaded.width,
                height: uploaded.height,
              }),
            "Đã thêm ảnh",
          );
        } catch (error) {
          toast(error instanceof Error ? error.message : "Tải ảnh lên không thành công.", "error");
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    const ids = images.map((image) => image.id);
    const target = index + direction;
    const [moved] = ids.splice(index, 1);
    if (moved === undefined || target < 0 || target > ids.length) return;
    ids.splice(target, 0, moved);
    void run(() => reorderImages({ parentId: menuItemId, ids }));
  }

  return (
    <section aria-labelledby="anh-mon" className="flex flex-col gap-3">
      <h2 id="anh-mon" className="text-xl">
        Ảnh món
      </h2>
      <div>
        <input
          ref={fileInput}
          id="image-files"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          variant="secondary"
          isLoading={isUploading}
          onClick={() => fileInput.current?.click()}
        >
          Thêm ảnh
        </Button>
        <p className="mt-1 text-sm text-text-muted">
          JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh. Ảnh đầu tiên là ảnh chính.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="text-text-muted">Món chưa có ảnh.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-button bg-border/40">
                <Image
                  src={image.url}
                  alt={image.alt ?? "Ảnh món"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              {image.isPrimary ? (
                <p className="text-center text-sm font-semibold text-accent-green">Ảnh chính</p>
              ) : (
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={() =>
                    void run(() => setPrimaryImage({ id: image.id }), "Đã đặt ảnh chính")
                  }
                >
                  Đặt làm ảnh chính
                </Button>
              )}
              <div className="flex justify-between gap-1">
                <Button
                  variant="ghost"
                  disabled={index === 0 || isPending}
                  aria-label="Đưa ảnh lên trước"
                  onClick={() => move(index, -1)}
                >
                  ←
                </Button>
                <Button variant="ghost" disabled={isPending} onClick={() => setDeleting(image)}>
                  Xóa
                </Button>
                <Button
                  variant="ghost"
                  disabled={index === images.length - 1 || isPending}
                  aria-label="Đưa ảnh ra sau"
                  onClick={() => move(index, 1)}
                >
                  →
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Xóa ảnh?">
        <p className="mb-4">Ảnh sẽ bị xóa khỏi món và khỏi kho ảnh.</p>
        <Button
          variant="danger"
          isLoading={isPending}
          onClick={async () => {
            if (!deleting) return;
            const result = await run(() => deleteMenuItemImage({ id: deleting.id }), "Đã xóa ảnh");
            if (result.ok) setDeleting(null);
          }}
        >
          Xóa ảnh
        </Button>
      </Dialog>
    </section>
  );
}
