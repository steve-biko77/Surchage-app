"use client";

// Carte musculaire interactive — pièce maîtresse de l'app.
// Le rendu du corps vit dans anatomie/CorpsSvg ; ici on ajoute la bascule
// face/dos en rotation 3D, le survol, la sélection et l'infobulle.

import { useCallback, useId, useMemo, useState } from "react";
import CorpsSvg, { VIEWBOX, type Vue } from "./anatomie/CorpsSvg";
import { boiteDeRegions } from "@/lib/anatomie/trace";
import {
  REGION_LABELS,
  REGION_VERS_GROUPE,
  GROUPE_LABELS,
  GROUPE_VERS_REGIONS,
  LIBELLES_NIVEAU,
  baseDeRegion,
  type BaseRegion,
  type NiveauVolume,
} from "@/lib/domain/anatomie";
import type { GroupeMusculaire } from "@/lib/domain/types";

type Infobulle = { x: number; y: number; titre: string; sous: string } | null;

export type AnatomyMapProps = {
  /** Palier 0..4 par portion, calculé depuis les séries réelles. */
  intensites: Record<BaseRegion, NiveauVolume>;
  /** Groupe mis en avant (survol d'une ligne de la liste, par exemple). */
  groupeActif?: GroupeMusculaire | null;
  onSelectGroupe?: (groupe: GroupeMusculaire | null) => void;
};

export default function AnatomyMap({
  intensites,
  groupeActif = null,
  onSelectGroupe,
}: AnatomyMapProps) {
  const [vue, setVue] = useState<Vue>("face");
  const [survol, setSurvol] = useState<BaseRegion | null>(null);
  const [bulle, setBulle] = useState<Infobulle>(null);
  const uid = useId().replace(/:/g, "");

  // Portions à surligner : celles du groupe actif, plus celle sous le curseur.
  const surlignes = useMemo(() => {
    const s = new Set<BaseRegion>();
    if (groupeActif) for (const r of GROUPE_VERS_REGIONS[groupeActif] ?? []) s.add(r);
    if (survol) s.add(survol);
    return s;
  }, [groupeActif, survol]);

  const survoler = useCallback(
    (base: BaseRegion, v: Vue) => {
      if (!base || !REGION_LABELS[base]) return;
      // Les bornes viennent du tracé, pas d'un `getBBox()` sur le chemin
      // survolé : chaque forme porte son propre `transform`, donc sa boîte
      // mesurée est dans un repère local et placerait la bulle n'importe où.
      // Et ce sont les bornes du MUSCLE entier, pas d'une de ses portions.
      const boite = boiteDeRegions(v, [base]);
      if (!boite) return;
      const [vx, vy, vw, vh] = VIEWBOX[v];
      setSurvol(base);
      setBulle({
        // En % du viewBox : l'infobulle suit le muscle à toute taille.
        x: ((boite.x + boite.w / 2 - vx) / vw) * 100,
        y: ((boite.y - vy) / vh) * 100,
        titre: REGION_LABELS[base],
        sous: LIBELLES_NIVEAU[intensites[base] ?? 0],
      });
    },
    [intensites]
  );

  const quitter = useCallback(() => {
    setSurvol(null);
    setBulle(null);
  }, []);

  const choisir = useCallback(
    (base: BaseRegion) => {
      const g = REGION_VERS_GROUPE[base];
      if (g && onSelectGroupe) onSelectGroupe(g);
    },
    [onSelectGroupe]
  );

  const attributs = (v: Vue) => ({ base }: { base: BaseRegion }) => {
    const niveau = intensites[base] ?? 0;
    const groupe = REGION_VERS_GROUPE[base];
    return {
      tabIndex: 0,
      role: "button",
      "aria-label": `${REGION_LABELS[base]} — ${LIBELLES_NIVEAU[niveau]}. Groupe ${GROUPE_LABELS[groupe] ?? ""}`,
      onMouseEnter: () => survoler(base, v),
      onFocus: () => survoler(base, v),
      onBlur: quitter,
      onClick: () => choisir(base),
      onKeyDown: (e: React.KeyboardEvent<SVGPathElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choisir(base);
        }
      },
    };
  };

  return (
    <div className="anat">
      <div className="anat-scene">
        <div className={`anat-pivot${vue === "dos" ? " retourne" : ""}`}>
          <div className="anat-face" onMouseLeave={quitter} aria-hidden={vue !== "face"}>
            <CorpsSvg
              vue="face"
              uid={uid}
              intensites={intensites}
              surlignes={surlignes}
              anime
              interactif
              rendreAttributs={attributs("face")}
            />
          </div>
          <div className="anat-face arriere" onMouseLeave={quitter} aria-hidden={vue !== "dos"}>
            <CorpsSvg
              vue="dos"
              uid={uid}
              intensites={intensites}
              surlignes={surlignes}
              anime
              interactif
              rendreAttributs={attributs("dos")}
            />
          </div>
        </div>

        {bulle && (
          <div className="anat-bulle" style={{ left: `${bulle.x}%`, top: `${bulle.y}%` }} role="status">
            <b>{bulle.titre}</b>
            <span>{bulle.sous}</span>
          </div>
        )}
      </div>

      {/* Sous le corps : en haut à droite, la bascule recouvrait la tête. */}
      <div className="anat-bascule" role="group" aria-label="Orientation de la carte">
        {(["face", "dos"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={vue === v ? "on" : undefined}
            aria-pressed={vue === v}
            onClick={() => {
              setVue(v);
              quitter();
            }}
          >
            {v === "face" ? "Face" : "Dos"}
          </button>
        ))}
      </div>
    </div>
  );
}
