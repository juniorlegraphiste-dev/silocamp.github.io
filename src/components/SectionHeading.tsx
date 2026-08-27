/**
 * SectionHeading — sur-titre, titre serif et sous-titre optionnel,
 * avec un filet doré décoratif. Utilisé pour ouvrir chaque section.
 */
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.32em] text-gold-300">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-4xl font-medium leading-[1.05] text-cream sm:text-5xl md:text-6xl">
        {title}
      </h2>
      <span className="rule-gold" aria-hidden />
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-cream-dim",
            centered && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
