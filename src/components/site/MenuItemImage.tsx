import Image from "next/image";
import { cn } from "@/lib/cn";
import type { MenuImage } from "@/server/queries/public/menu";
import { FoodPlaceholder } from "./FoodPlaceholder";

type Props = {
  image: MenuImage | null;
  name: string;
  sizes: string;
  /** Ảnh đầu trang (trên màn hình đầu tiên) nên tải ngay để không bị chậm */
  priority?: boolean;
  className?: string;
};

/** Khung ảnh tỉ lệ 4:5 (dọc, kiểu tạp chí), ảnh phủ kín khung; không có ảnh thì hiện hình giữ chỗ. */
export function MenuItemImage({ image, name, sizes, priority = false, className }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-cream-deep sm:aspect-[4/5]",
        className,
      )}
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.alt ?? name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <FoodPlaceholder />
      )}
    </div>
  );
}
