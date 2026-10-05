import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "navy" | "danger";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<Variant, string> = {
  primary: "bg-navy text-ivory hover:bg-navy-light dark:bg-ivory dark:text-navy dark:hover:bg-ivory-dark",
  secondary: "bg-ivory text-navy hover:bg-ivory-dark dark:bg-navy-light dark:text-ivory dark:hover:bg-navy",
  outline: "border border-navy text-navy hover:bg-navy hover:text-ivory dark:border-ivory dark:text-ivory dark:hover:bg-ivory dark:hover:text-navy",
  ghost: "text-navy hover:bg-navy/10 dark:text-ivory dark:hover:bg-ivory/10",
  gold: "btn-gold-shimmer text-navy font-semibold",
  navy: "bg-navy text-ivory hover:bg-navy-light",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-7 px-3 text-xs rounded-md",
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-6 text-sm rounded-lg",
  lg: "h-13 px-8 text-base rounded-xl",
  xl: "h-15 px-10 text-lg rounded-xl",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    isLoading,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
  } = props;

  const cls = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-gold disabled:opacity-50 disabled:cursor-not-allowed select-none",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={cls} target={props.target} rel={props.rel} onClick={props.onClick}>
        {content}
      </Link>
    );
  }

  const { disabled, variant: _, size: __, isLoading: ___, leftIcon: ____, rightIcon: _____, fullWidth: ______, className: _______, children: ________, ...rest } = props as ButtonAsButton;
  return (
    <button className={cls} disabled={disabled || isLoading} {...rest}>
      {content}
    </button>
  );
}

