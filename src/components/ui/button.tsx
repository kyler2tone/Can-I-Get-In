import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & ComponentProps<"button">;

const variants = {
  primary: "border-brand bg-brand text-white hover:bg-brand-strong active:bg-brand-strong",
  secondary: "border-line bg-surface text-foreground hover:border-brand hover:text-brand-strong active:border-brand active:bg-sky-soft",
  ghost: "border-transparent bg-transparent text-brand-strong hover:bg-white/60 active:bg-sky-soft",
};

const interactionClasses =
  "focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px motion-reduce:active:translate-y-0";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${interactionClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${interactionClasses} ${variants[variant]} ${className}`}
      href={href}
    >
      {children}
    </Link>
  );
}
