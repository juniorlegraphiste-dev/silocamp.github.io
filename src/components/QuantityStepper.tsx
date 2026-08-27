/**
 * QuantityStepper — sélecteur de quantité − / valeur / + accessible.
 * Contrôlé : la logique (panier) est gérée par le parent.
 */
import { cn } from "@/utils/cn";

export function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  min = 0,
  max = 10,
  className,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center text-lg leading-none text-cream transition-colors hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-25";

  return (
    <div
      className={cn(
        "inline-flex select-none items-center rounded-full border border-gold-400/25 bg-ink-900/70",
        className
      )}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
        className={btn}
      >
        −
      </button>
      <span
        className="w-8 text-center font-display text-xl font-semibold tabular-nums text-cream"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className={btn}
      >
        +
      </button>
    </div>
  );
}
