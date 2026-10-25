"use client";

// Rendu bas niveau du corps. Unique source de vérité anatomique de l'app :
// la carte d'accueil, la fiche d'exercice et les vignettes passent toutes par
// ici, pour qu'il n'existe qu'une seule anatomie et une seule échelle.
//
// Tracé : body-muscles (Apache-2.0, Ivan Vulović) — cf. NOTICE.

import { FRONT_MUSCLES, BACK_MUSCLES } from "body-muscles";
import {
  REGION_LABELS,
  REGIONS_INERTES,
  baseDeRegion,
  type BaseRegion,
  type NiveauVolume,
} from "@/lib/domain/anatomie";

export type Vue = "face" | "dos";

/** Boîte du tracé source, mesurée sur l'œuvre : les deux corps y sont côte à côte. */
export const VIEWBOX: Record<Vue, [number, number, number, number]> = {
  face: [0, 0, 31.5, 92.6],
  dos: [36.4, 0, 32.2, 92.6],
};

const REGIONS: Record<Vue, Array<{ id: string; path: string }>> = {
  face: FRONT_MUSCLES as Array<{ id: string; path: string }>,
  dos: BACK_MUSCLES as Array<{ id: string; path: string }>,
};

export function estInerte(id: string): boolean {
  const base = baseDeRegion(id);
  return REGIONS_INERTES.has(base) || !REGION_LABELS[base];
}

export type CorpsSvgProps = {
  vue: Vue;
  /** Palier 0..4 par portion. */
  intensites: Record<BaseRegion, NiveauVolume>;
  /** Portions mises en avant, rendues dans la teinte de surlignage. */
  surlignes?: Set<BaseRegion>;
  /** Identifiant unique : les dégradés et filtres SVG sont référencés par id. */
  uid: string;
  /** Hauteur CSS du SVG. */
  hauteur?: string | number;
  /** Cascade d'apparition à l'affichage. */
  anime?: boolean;
  /** Halo sur les portions au palier maximum. */
  halo?: boolean;
  /** Rend les portions focusables et cliquables. */
  interactif?: boolean;
  rendreAttributs?: (region: { id: string; base: BaseRegion }) => React.SVGProps<SVGPathElement>;
  titre?: string;
  /**
   * Fenêtre affichée, en coordonnées du tracé. Par défaut le corps entier.
   * La passer réduite revient à approcher la zone, comme on amène une carte
   * du monde sur un pays : même tracé, même échelle, on cadre seulement.
   */
  fenetre?: [number, number, number, number];
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
  const liste = REGIONS[vue];
  const gid = `${uid}-${vue}`;

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
        {/* Une seule source de lumière pour tout le corps : en
            objectBoundingBox, chaque facette recevrait sa propre rampe
            et l'ensemble se rayerait. */}
        <linearGradient
          id={`lum-${gid}`}
          gradientUnits="userSpaceOnUse"
          x1={vx - vw * 0.1}
          y1={vy}
          x2={vx + vw * 1.2}
          y2={vy + vh * 0.9}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#000814" stopOpacity="0.32" />
        </linearGradient>
        {halo && (
          <filter id={`halo-${gid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Socle dilaté : soude les facettes et supprime les vides noirs
          que laissent les interstices du tracé. */}
      <g
        fill="var(--anat-socle)"
        stroke="var(--anat-socle)"
        strokeWidth={0.85}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {liste.map((r) => (
          <path key={`s-${r.id}`} d={r.path} />
        ))}
      </g>

      {/* Facettes : porteuses de la donnée et de l'interaction. */}
      <g stroke="var(--anat-couture)" strokeWidth={0.075} strokeLinejoin="round">
        {liste.map((r, i) => {
          const base = baseDeRegion(r.id);
          const inerte = estInerte(r.id);
          const niveau = inerte ? 0 : intensites[base] ?? 0;
          const actif = !inerte && (surlignes?.has(base) ?? false);
          const extra = !inerte && interactif && rendreAttributs ? rendreAttributs({ id: r.id, base }) : {};
          return (
            <path
              key={r.id}
              d={r.path}
              data-region={r.id}
              className={`anat-part${inerte ? " inerte" : ""}${actif ? " actif" : ""}`}
              style={{
                fill: inerte ? "var(--anat-inerte)" : `var(--anat-${niveau})`,
                ...(anime ? { animationDelay: `${Math.min(i * 14, 560)}ms` } : { animation: "none" }),
              }}
              {...extra}
            />
          );
        })}
      </g>

      {halo && (
        <g stroke="none" filter={`url(#halo-${gid})`} pointerEvents="none">
          {liste
            .filter((r) => !estInerte(r.id) && (intensites[baseDeRegion(r.id)] ?? 0) >= 4)
            .map((r) => (
              <path key={`h-${r.id}`} d={r.path} fill="var(--anat-4)" opacity={0.5} />
            ))}
        </g>
      )}

      {/* Lumière : au-dessus, mais transparente aux clics. */}
      <g stroke="none" pointerEvents="none">
        {liste.map((r) => (
          <path key={`l-${r.id}`} d={r.path} fill={`url(#lum-${gid})`} />
        ))}
      </g>
    </svg>
  );
}

/** Portions visibles sur chaque vue, dérivé du tracé lui-même. */
const PAR_VUE: Record<Vue, Set<BaseRegion>> = {
  face: new Set(FRONT_MUSCLES.map((r) => baseDeRegion(r.id))),
  dos: new Set(BACK_MUSCLES.map((r) => baseDeRegion(r.id))),
};

/** Vue qui montre le plus de portions de l'ensemble donné. */
export function meilleureVue(regions: Iterable<BaseRegion>): Vue {
  let f = 0;
  let d = 0;
  for (const r of regions) {
    if (PAR_VUE.face.has(r)) f += 1;
    if (PAR_VUE.dos.has(r)) d += 1;
  }
  return d > f ? "dos" : "face";
}

/** Vrai si au moins une portion de l'ensemble est visible sur cette vue. */
export function vueMontre(vue: Vue, regions: Iterable<BaseRegion>): boolean {
  for (const r of regions) if (PAR_VUE[vue].has(r)) return true;
  return false;
}
