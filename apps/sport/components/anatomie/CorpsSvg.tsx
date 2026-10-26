"use client";

// Rendu bas niveau du corps. Unique source de vérité visuelle de l'app : la
// carte d'accueil, la fiche d'exercice et les vignettes passent toutes par
// ici, pour qu'il n'existe qu'une seule anatomie et une seule échelle.
//
// Les données du tracé vivent dans lib/anatomie/trace.ts — ce fichier ne fait
// que les dessiner. Chaque forme porte son propre `transform` et ses chemins
// le leur : on les rend tels quels, sans les aplatir, pour pouvoir mettre la
// source à jour sans retoucher le code.

import { useMemo } from "react";
import {
  DEGRADES,
  FORMES,
  VIEWBOX,
  estInerte,
  type Fenetre,
  type Vue,
} from "@/lib/anatomie/trace";
import { baseDeRegion, type BaseRegion, type NiveauVolume } from "@/lib/domain/anatomie";

export { VIEWBOX, meilleureVue, vueMontre, estInerte } from "@/lib/anatomie/trace";
export type { Vue } from "@/lib/anatomie/trace";

export type CorpsSvgProps = {
  vue: Vue;
  /** Palier 0..4 par muscle. */
  intensites: Record<BaseRegion, NiveauVolume>;
  /** Muscles mis en avant, rendus dans la teinte de surlignage. */
  surlignes?: Set<BaseRegion>;
  /** Identifiant unique : les dégradés et filtres SVG sont référencés par id. */
  uid: string;
  /** Hauteur CSS du SVG. */
  hauteur?: string | number;
  /** Cascade d'apparition à l'affichage. */
  anime?: boolean;
  /** Halo sur les muscles au palier maximum. */
  halo?: boolean;
  /** Rend les muscles focusables et cliquables. */
  interactif?: boolean;
  rendreAttributs?: (region: { id: string; base: BaseRegion }) => React.SVGProps<SVGPathElement>;
  titre?: string;
  /**
   * Fenêtre affichée, en coordonnées du tracé. Par défaut le corps entier.
   * La passer réduite revient à approcher la zone, comme on amène une carte
   * du monde sur un pays : même tracé, même échelle, on cadre seulement.
   */
  fenetre?: Fenetre;
  /** Occupe toute la boîte parente au lieu de se dimensionner sur sa hauteur. */
  remplir?: boolean;
  /** Accès direct au `<svg>`, pour animer la fenêtre sans repasser par React. */
  svgRef?: React.Ref<SVGSVGElement>;
};

export default function CorpsSvg({
  vue,
  intensites,
  surlignes,
  uid,
  hauteur = "100%",
  anime = false,
  halo = true,
  interactif = false,
  rendreAttributs,
  titre,
  fenetre,
  remplir = false,
  svgRef,
}: CorpsSvgProps) {
  // La lumière reste calée sur le corps entier, pas sur la fenêtre : recadrer
  // ne doit pas déplacer la source lumineuse.
  const [vx, vy, vw, vh] = VIEWBOX[vue];
  const cadre = fenetre ?? VIEWBOX[vue];
  const formes = FORMES[vue];
  const gid = `${uid}-${vue}`;

  // Les dégradés du tracé habillent la silhouette (tête, mains, pieds). Leurs
  // identifiants sont réécrits par instance : plusieurs corps coexistent sur
  // une même page, et deux `<defs>` au même id se marchent dessus.
  const degrades = useMemo(
    () => DEGRADES.filter((g) => formes.some((s) => s.paths.some((p) => p.fill === `url(#${g.id})`))),
    [formes]
  );
  const reecrire = (fill?: string | null) =>
    fill && fill.startsWith("url(#") ? fill.replace("url(#", `url(#${gid}-`) : fill ?? undefined;

  const vivants = formes.filter((s) => !estInerte(s));

  return (
    <svg
      ref={svgRef}
      viewBox={cadre.join(" ")}
      preserveAspectRatio="xMidYMid meet"
      style={
        remplir
          ? { width: "100%", height: "100%", overflow: "hidden" }
          : { height: hauteur, width: "auto", overflow: "visible" }
      }
      role="img"
      aria-label={titre ?? `Carte musculaire, vue ${vue === "face" ? "de face" : "de dos"}`}
    >
      <defs>
        {degrades.map((g) => (
          <linearGradient key={g.id} id={`${gid}-${g.id}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
            {g.stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        ))}

        {/* Une seule source de lumière pour tout le corps : en
            objectBoundingBox, chaque muscle recevrait sa propre rampe et
            l'ensemble se rayerait. */}
        <linearGradient
          id={`lum-${gid}`}
          gradientUnits="userSpaceOnUse"
          x1={vx - vw * 0.1}
          y1={vy}
          x2={vx + vw * 1.2}
          y2={vy + vh * 0.9}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#000814" stopOpacity="0.3" />
        </linearGradient>

        {halo && (
          <filter id={`halo-${gid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {formes.map((s, i) => {
        const silhouette = !s.r;
        const inerte = estInerte(s);
        const base = s.r ? baseDeRegion(s.r.m) : "";
        const niveau = inerte ? 0 : intensites[base] ?? 0;
        const actif = !inerte && (surlignes?.has(base) ?? false);
        const extra = !inerte && interactif && rendreAttributs ? rendreAttributs({ id: s.id, base }) : {};

        // La silhouette garde les teintes du tracé : c'est elle qui donne au
        // corps sa matière. Les muscles portent la donnée et sont repeints par
        // palier. Les inertes (tendons, rotules) sont neutralisés.
        const remplissage = silhouette
          ? undefined
          : inerte
            ? "var(--anat-inerte)"
            : `var(--anat-${niveau})`;

        return (
          <g
            key={s.id}
            transform={s.transform ?? undefined}
            className={silhouette ? undefined : `anat-part${inerte ? " inerte" : ""}${actif ? " actif" : ""}`}
            style={silhouette ? undefined : anime ? { animationDelay: `${Math.min(i * 12, 520)}ms` } : { animation: "none" }}
            data-region={s.r?.m}
          >
            {s.paths.map((p, j) => (
              <path
                key={j}
                d={p.d}
                transform={p.transform ?? undefined}
                fill={remplissage ?? reecrire(p.fill)}
                {...extra}
              />
            ))}
          </g>
        );
      })}

      {halo && (
        <g filter={`url(#halo-${gid})`} pointerEvents="none">
          {vivants
            .filter((s) => (intensites[baseDeRegion(s.r!.m)] ?? 0) >= 4)
            .map((s) => (
              <g key={`h-${s.id}`} transform={s.transform ?? undefined}>
                {s.paths.map((p, j) => (
                  <path key={j} d={p.d} transform={p.transform ?? undefined} fill="var(--anat-4)" opacity={0.4} />
                ))}
              </g>
            ))}
        </g>
      )}

      {/* Lumière : au-dessus, mais transparente aux clics. */}
      <g pointerEvents="none">
        {formes.map((s) => (
          <g key={`l-${s.id}`} transform={s.transform ?? undefined}>
            {s.paths.map((p, j) => (
              <path key={j} d={p.d} transform={p.transform ?? undefined} fill={`url(#lum-${gid})`} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
