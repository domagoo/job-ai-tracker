// app/components/Button.tsx
"use client";

import * as React from "react";

type Variant = "primary" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  variant?: Variant;
};

export default function Button({
  pending = false,
  variant = "primary",
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  const base =
    "btn-glass inline-flex items-center justify-center gap-2 select-none " +
    "transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClass = variant === "ghost" ? "btn-ghost" : "";

  return (
    <button
      {...rest}
      disabled={disabled || pending}
      {...(pending ? { "aria-busy": "true" } : {})}
      className={[base, variantClass, className].join(" ")}
    >
      {pending && <span className="spinner" aria-hidden="true" />}
      <span className={pending ? "opacity-90" : ""}>
        {pending ? "Working…" : children}
      </span>
    </button>
  );
}
