"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Bascule segmentée dont le curseur mesure réellement l'option active
 * puis glisse jusqu'à elle. Un calage à 50 % se décale dès que deux
 * libellés n'ont pas la même longueur — ici la géométrie est lue dans
 * le DOM, donc le curseur tombe juste quel que soit le texte.
 */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  full = false,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  const mesurer = () => {
    const box = ref.current;
    const actif = box?.querySelector<HTMLButtonElement>(`[data-seg="${value}"]`);
    if (!box || !actif) return;
    setThumb({ x: actif.offsetLeft, w: actif.offsetWidth });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mesurer, [value, options]);

  useEffect(() => {
    const box = ref.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(mesurer);
    ro.observe(box);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div ref={ref} className={`seg ${full ? "seg-full" : ""}`} role="radiogroup" aria-label={ariaLabel}>
      {thumb && (
        <span
          className="seg-thumb"
          aria-hidden
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-seg={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={`seg-btn ${value === o.value ? "active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
