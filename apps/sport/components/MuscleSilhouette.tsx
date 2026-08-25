"use client";

import Model, { type Muscle } from "react-body-highlighter";

/** Correspondance groupeMusculaire (FR, domaine) -> muscles reels du modele anatomique */
export const GROUPE_VERS_MUSCLES: Record<string, { view: "anterior" | "posterior"; muscles: Muscle[] }> = {
  dos: { view: "posterior", muscles: ["trapezius", "upper-back", "lower-back"] },
  biceps: { view: "anterior", muscles: ["biceps"] },
  triceps: { view: "posterior", muscles: ["triceps"] },
  epaules: { view: "anterior", muscles: ["front-deltoids"] },
  pectoraux: { view: "anterior", muscles: ["chest"] },
  jambes: { view: "anterior", muscles: ["quadriceps", "abductors"] },
  "avant-bras": { view: "anterior", muscles: ["forearm"] },
  abdominaux: { view: "anterior", muscles: ["abs", "obliques"] },
  mollets: { view: "posterior", muscles: ["calves"] },
};

export default function MuscleSilhouette({ groupe }: { groupe: string }) {
  const config = GROUPE_VERS_MUSCLES[groupe];

  if (!config) {
    return <div className="h-20 w-14 shrink-0 rounded-lg bg-[var(--bg-card-2)]" aria-hidden="true" />;
  }

  return (
    <div
      className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg"
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(255,90,31,0.12), transparent 70%)",
      }}
      role="img"
      aria-label={`Silhouette du groupe musculaire ${groupe}`}
    >
      <Model
        type={config.view}
        data={[{ name: groupe, muscles: config.muscles, frequency: 1 }]}
        bodyColor="#343742"
        highlightedColors={["#FF5A1F"]}
        style={{ width: "100%", height: "100%" }}
        svgStyle={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
