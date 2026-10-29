import Image from "next/image";
import { shopConfig } from "@/lib/shop-config";

/**
 * Khung bên phải hero: ảnh thật nếu có `shopConfig.heroImage`,
 * nếu chưa có thì là khung vòm viền đồng thau với ổ bánh vẽ nét mảnh.
 */
export function HeroArt({ caption }: { caption: string }) {
  return (
    <figure className="relative mx-auto w-full max-w-[15rem] sm:max-w-sm lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-brass/50 p-3">
        <div className="relative size-full overflow-hidden rounded-t-full bg-primary/60">
          {shopConfig.heroImage ? (
            <Image
              src={shopConfig.heroImage}
              alt={`Bánh mì của ${shopConfig.name}`}
              fill
              priority
              sizes="(min-width: 1024px) 420px, 80vw"
              className="object-cover"
            />
          ) : (
            <svg
              viewBox="0 0 300 375"
              className="absolute inset-0 size-full text-brass"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="hero-glow" cx="50%" cy="58%" r="55%">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="300" height="375" fill="url(#hero-glow)" />
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path
                  strokeWidth="1.4"
                  d="M52 236c0-40 44-70 98-70s98 30 98 70c0 9-7 16-16 16H68c-9 0-16-7-16-16z"
                />
                <path
                  strokeWidth="1.4"
                  d="M98 200l14 24M138 188l10 30M178 192l12 26M212 206l8 16"
                />
                <path
                  strokeWidth="0.8"
                  opacity="0.6"
                  d="M70 274h160M96 290h108"
                  strokeDasharray="1 6"
                />
                <path
                  strokeWidth="0.8"
                  opacity="0.55"
                  d="M150 70v26M150 120v6M122 84l6 18M178 84l-6 18"
                />
              </g>
            </svg>
          )}
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-brass">
        <span className="h-px w-6 bg-brass/60" aria-hidden="true" />
        {caption}
        <span className="h-px w-6 bg-brass/60" aria-hidden="true" />
      </figcaption>
    </figure>
  );
}
