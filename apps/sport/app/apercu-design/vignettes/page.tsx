// Comparatif des vignettes d'exercice : corps entier contre recadrage.
// Sert uniquement à juger le dessin dans le vrai build. Aucun lien n'y mène.
"use client";

import { useId } from "react";
import MuscleSilhouette from "@/components/MuscleSilhouette";
import CorpsSvg, { meilleureVue } from "@/components/anatomie/CorpsSvg";
import { MUSCLE_VERS_REGIONS, type BaseRegion, type NiveauVolume } from "@/lib/domain/anatomie";
import { musclesExercice } from "@/lib/domain/referentielExercices";
import type { GroupeMusculaire } from "@/lib/domain/types";

const CAS: Array<[string, GroupeMusculaire]> = [
  ["Tractions", "dos"],
  ["Rowing barre", "dos"],
  ["Développé couché barre", "pectoraux"],
  ["Élévations latérales", "epaules"],
  ["Curl marteau", "biceps"],
  ["Extension triceps à la poulie", "triceps"],
  ["Squat", "jambes"],
  ["Mollets debout", "mollets"],
  ["Gainage", "abdominaux"],
];

/** L'ancien rendu : corps entier dans la vignette, pour la comparaison. */
function Avant({ nom, groupe }: { nom: string; groupe: GroupeMusculaire }) {
  const uid = useId().replace(/:/g, "");
  const m = musclesExercice(nom, groupe);
  const map: Record<BaseRegion, NiveauVolume> = {};
  const set = new Set<BaseRegion>();
  for (const mus of m.secondaires) for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 2; set.add(r); }
  for (const mus of m.primaires) for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 4; set.add(r); }
  return (
    <div
      className="relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
      style={{ background: "radial-gradient(circle at 50% 35%, rgba(var(--accent-rgb),0.14), transparent 70%)" }}
    >
      <CorpsSvg vue={meilleureVue(set)} uid={uid} intensites={map} hauteur="76px" halo={false} />
    </div>
  );
}

export default function ApercuVignettes() {
  return (
    <div className="p-6">
      <h1 className="font-heading mb-1 text-xl font-bold">Vignettes d&apos;exercice</h1>
      <p className="mb-6 text-sm text-[var(--grey)]">
        À gauche le corps entier, à droite le recadrage sur les muscles primaires.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {CAS.map(([nom, groupe]) => (
          <div key={nom} className="rounded-xl p-3" style={{ background: "var(--bg-card)" }}>
            <p className="mb-2 truncate font-heading text-sm font-bold">{nom}</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Avant nom={nom} groupe={groupe} />
                <p className="mt-1 text-[10px] text-[var(--grey)]">avant</p>
              </div>
              <div className="text-center">
                <MuscleSilhouette groupe={groupe} nom={nom} />
                <p className="mt-1 text-[10px] text-[var(--accent-text)]">après</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
