/**
 * Countdown — compte à rebours jusqu'à une date cible.
 * Affiche Jours / Heures / Minutes / Secondes dans des cartes.
 */
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

function getRemaining(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1_000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  target,
  className,
}: {
  target: string;
  className?: string;
}) {
  const targetTime = new Date(target).getTime();
  const [time, setTime] = useState(() => getRemaining(targetTime));

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining(targetTime)), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const units = [
    { label: "Jours", value: pad(time.days) },
    { label: "Heures", value: pad(time.hours) },
    { label: "Minutes", value: pad(time.minutes) },
    { label: "Secondes", value: pad(time.seconds) },
  ];

  return (
    <div
      className={cn("flex flex-wrap items-stretch gap-3 sm:gap-4", className)}
      role="timer"
      aria-live="polite"
      aria-label={`Compte à rebours : ${time.days} jours, ${time.hours} heures, ${time.minutes} minutes, ${time.seconds} secondes`}
    >
      {units.map((u) => (
        <div
          key={u.label}
          className="glass flex min-w-[78px] flex-col items-center rounded-2xl px-4 py-3 sm:min-w-[96px] sm:px-6 sm:py-4"
        >
          <span className="font-display text-4xl font-semibold tabular-nums text-gold-200 sm:text-5xl">
            {u.value}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cream-faint sm:text-xs">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
