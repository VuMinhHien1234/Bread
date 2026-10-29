import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "light";
export type ButtonSize = "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
  gold: "bg-brass text-ink hover:bg-ivory",
  light: "border border-ivory/60 bg-transparent text-ivory hover:bg-ivory hover:text-ink",
  ghost: "bg-transparent text-text hover:bg-border/50",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
};

// min-h-11 = 44px: vùng bấm tối thiểu trên điện thoại
const sizeClass: Record<ButtonSize, string> = {
  md: "min-h-11 px-6 text-[0.8125rem]",
  lg: "min-h-13 px-8 text-sm",
};

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-button font-semibold uppercase tracking-[0.14em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(buttonBaseClass, variantClass[variant], sizeClass[size]);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Đang gửi: tắt nút để không bấm hai lần */
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(buttonClassName(variant, size), className)}
      {...rest}
    >
      {children}
    </button>
  );
}
