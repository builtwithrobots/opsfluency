// v1.0.1
// Marketing Button primitive. Three variants (primary, secondary, ghost),
// three sizes (sm, md, lg), with loading and disabled states. Every size
// clears the 44x44 WCAG touch target. Uses MASTER section 6 button tokens.
//
// Separate from components/ui/button.tsx (Catalyst dashboard kit) so the
// marketing surface stays self-contained.
//
// Supports rendering as <button> or as an anchor (next/link) when `href`
// is passed. The tap-scale animation lives on an outer motion.span wrapper
// so the inner element keeps native React event types and ref semantics.

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-dim)] disabled:bg-[var(--color-brand)] disabled:opacity-50",
  secondary:
    "bg-transparent text-dc-text border border-dc-edge-2 hover:bg-dc-raised hover:border-dc-text-3 disabled:opacity-50",
  ghost:
    "bg-transparent text-dc-text-2 hover:bg-dc-raised hover:text-dc-text disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "min-h-11 px-4 py-2 text-sm gap-1.5",
  md: "min-h-11 px-5 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-6 py-3 text-base gap-2",
};

const BASE_CLASSES =
  "relative inline-flex items-center justify-center rounded-md font-semibold " +
  "whitespace-nowrap transition-colors " +
  "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-disabled:opacity-50 " +
  "select-none";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

function Content({
  loading,
  leadingIcon,
  trailingIcon,
  children,
}: Pick<CommonProps, "loading" | "leadingIcon" | "trailingIcon" | "children">) {
  return (
    <>
      {loading ? (
        <Spinner />
      ) : leadingIcon ? (
        <span aria-hidden="true" className="inline-flex">
          {leadingIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {!loading && trailingIcon ? (
        <span aria-hidden="true" className="inline-flex">
          {trailingIcon}
        </span>
      ) : null}
    </>
  );
}

const tapWrapperClass = (fullWidth: boolean) =>
  fullWidth ? "inline-flex w-full" : "inline-flex";

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const classes = [
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      fullWidth ? "w-full" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...anchorProps } = rest as ButtonAsLink;
      return (
        <motion.span whileTap={{ scale: 0.98 }} className={tapWrapperClass(fullWidth)}>
          <Link
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={classes}
            aria-busy={loading || undefined}
            {...anchorProps}
          >
            <Content
              loading={loading}
              leadingIcon={leadingIcon}
              trailingIcon={trailingIcon}
            >
              {children}
            </Content>
          </Link>
        </motion.span>
      );
    }

    const { disabled, ...buttonProps } = rest as ButtonAsButton;
    return (
      <motion.span whileTap={{ scale: 0.98 }} className={tapWrapperClass(fullWidth)}>
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          className={classes}
          {...buttonProps}
        >
          <Content
            loading={loading}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
          >
            {children}
          </Content>
        </button>
      </motion.span>
    );
  },
);
