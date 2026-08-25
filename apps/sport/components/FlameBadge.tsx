import { Flame, Minus } from "lucide-react";

export default function FlameBadge({ niveau }: { niveau: 0 | 1 | 2 | 3 }) {
  const labels = ["Éteinte", "Faible", "Stable", "Intense"];
  const flameCount = [0, 1, 2, 3][niveau];
  const glow = [
    "",
    "shadow-[0_0_10px_rgba(255,90,31,0.3)]",
    "shadow-[0_0_16px_rgba(255,90,31,0.5)]",
    "shadow-[0_0_24px_rgba(255,90,31,0.85)]",
  ][niveau];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-1.5 ${glow}`}
      title={`Niveau de flamme : ${labels[niveau]}`}
    >
      <span className="flex items-center" aria-hidden="true">
        {flameCount === 0 ? (
          <Minus className="h-4 w-4 text-[var(--grey)]" strokeWidth={2.5} />
        ) : (
          Array.from({ length: flameCount }).map((_, i) => (
            <Flame
              key={i}
              className={`h-4 w-4 -ml-1 first:ml-0 text-[#FF5A1F] ${niveau === 3 ? "animate-flicker" : ""}`}
              fill="#FF5A1F"
              strokeWidth={1.5}
            />
          ))
        )}
      </span>
      <span className="text-xs uppercase tracking-wide text-[var(--grey)]">{labels[niveau]}</span>
    </div>
  );
}
