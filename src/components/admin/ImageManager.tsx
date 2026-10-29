"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Ảnh đang xem ở khung lớn: ảnh được chọn, nếu không thì ảnh chính / ảnh đầu tiên
  const selectedIndex = Math.max(
    0,
    images.findIndex((image) => image.id === selectedId),
  );
  const fallbackIndex = images.findIndex((image) => image.isPrimary);
  const viewIndex = selectedId ? selectedIndex : Math.max(0, fallbackIndex);
  const viewing = images[viewIndex];

  const fileButton = (
    <Button
      variant={images.length === 0 ? "primary" : "secondary"}
      isLoading={isUploading}
      onClick={() => fileInput.current?.click()}
    >
      {isUploading ? "Đang tải lên…" : "Thêm ảnh"}
    </Button>
  );

  return (
    <section
      aria-labelledby="anh-mon"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-5"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileInput}
        id="image-files"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="anh-mon" className="text-xl">
            Ảnh món {images.length > 0 ? `(${images.length})` : null}
          </h2>
          <p className="text-sm text-text-muted">
            JPG, PNG hoặc WebP, tối đa 5 MB. Kéo thả ảnh vào đây hoặc bấm Thêm ảnh.
          </p>
        </div>
        {images.length > 0 ? fileButton : null}
      </div>

      {viewing ? (
        <>
          {/* Khung lớn: ảnh đang xem + các nút sửa ngay bên dưới */}
          <div
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-card bg-border/40",
              isDragging && "ring-4 ring-primary/40",
            )}
          >
            <Image
              src={viewing.url}
              alt={viewing.alt ?? "Ảnh món"}
              fill
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover"
            />
            {viewing.isPrimary ? (
              <span className="absolute left-3 top-3 rounded-full bg-accent-green px-3 py-1 text-xs font-semibold text-primary-foreground">
                Ảnh chính · hiện trên thực đơn
              </span>
            ) : null}
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-ivory">
              {viewIndex + 1} / {images.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewing.isPrimary ? null : (
              <Button
                variant="primary"
                disabled={isPending}
                onClick={() =>
                  void run(() => setPrimaryImage({ id: viewing.id }), "Đã đặt ảnh chính")
                }
              >
                Đặt làm ảnh chính
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={viewIndex === 0 || isPending}
              aria-label="Đưa ảnh lên trước"
              onClick={() => move(viewIndex, -1)}
            >
              ← Lên trước
            </Button>
            <Button
              variant="secondary"
              disabled={viewIndex === images.length - 1 || isPending}
              aria-label="Đưa ảnh ra sau"
              onClick={() => move(viewIndex, 1)}
            >
              Ra sau →
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              className="ml-auto"
              onClick={() => setDeleting(viewing)}
            >
              Xóa ảnh này
            </Button>
          </div>

          {images.length > 1 ? (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Chọn ảnh để xem">
              {images.map((image, index) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(image.id)}
                    aria-label={`Xem ảnh ${index + 1}${image.isPrimary ? " (ảnh chính)" : ""}`}
                    aria-pressed={index === viewIndex}
                    className={cn(
                      "relative block aspect-square w-full overflow-hidden rounded-button border-2 bg-border/40",
                      index === viewIndex ? "border-primary" : "border-transparent opacity-70",
                    )}
                  >
                    <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
                    {image.isPrimary ? (
                      <span className="absolute inset-x-0 bottom-0 bg-accent-green py-0.5 text-center text-[0.625rem] font-semibold text-primary-foreground">
                        Chính
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div
          className={cn(
            "flex min-h-64 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 text-center",
            isDragging ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <p className="font-heading text-2xl">Món chưa có ảnh</p>
          <p className="max-w-xs text-sm text-text-muted">
            Kéo thả ảnh vào khung này, hoặc bấm nút bên dưới. Ảnh đầu tiên sẽ là ảnh chính.
          </p>
          {fileButton}
        </div>
      )}

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Xóa ảnh?">
        <p className="mb-4">Ảnh sẽ bị xóa khỏi món và khỏi kho ảnh.</p>
        <Button
          variant="danger"
          isLoading={isPending}
          onClick={async () => {
            if (!deleting) return;
            const result = await run(() => deleteMenuItemImage({ id: deleting.id }), "Đã xóa ảnh");
            if (result.ok) {
              setDeleting(null);
              setSelectedId(null);
            }
          }}
        >
          Xóa ảnh
        </Button>
      </Dialog>
    </section>
  );
}
