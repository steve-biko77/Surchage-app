// Accès au tracé anatomique. Seul endroit qui connaît la forme du fichier
// source ; le rendu (CorpsSvg) et le cadrage s'appuient tous deux dessus, et
// aucun des deux n'importe l'autre.
//
// Tracé : Open-Muscle-Map (MIT, PerspicaciousGuy) — cf. ./omm/LICENSE.
// Les fichiers sont copiés dans le dépôt plutôt que tirés d'un paquet : le
// projet amont est très jeune, et une anatomie qui disparaîtrait du jour au
// lendemain n'est pas une dépendance acceptable.

import donnees from "./omm/corps-masculin.json";
import { REGIONS_INERTES, REGION_LABELS, baseDeRegion, type BaseRegion } from "../domain/anatomie";

export type Vue = "face" | "dos";
export type Fenetre = [number, number, number, number];
export type Boite = { x: number; y: number; w: number; h: number };

export type Chemin = { d: string; fill?: string | null; transform?: string | null };
export type Forme = {
  id: string;
  view: string;
  transform?: string | null;
  paths: Chemin[];
  r: {
    m: string;
    side: string;
    kind: string;
    sel: boolean;
    sub: string | null;
    /** [x1, y1, x2, y2] dans les coordonnées de la fenêtre. */
    bounds: [number, number, number, number];
  } | null;
};

export type Degrade = {
  id: string;
  x1: string; y1: string; x2: string; y2: string;
  stops: Array<{ offset: string; color: string }>;
};

const DONNEES = donnees as unknown as {
  viewBoxes: Record<string, string>;
  gradients: Degrade[];
  shapes: Forme[];
};

/** "face" et "dos" côté app, "front" et "rear" côté tracé. */
const VUE_SOURCE: Record<Vue, string> = { face: "front", dos: "rear" };

/** Boîte du tracé pour chaque vue : les deux corps y sont côte à côte. */
export const VIEWBOX: Record<Vue, Fenetre> = {
  face: DONNEES.viewBoxes.front.split(" ").map(Number) as Fenetre,
  dos: DONNEES.viewBoxes.rear.split(" ").map(Number) as Fenetre,
};

export const FORMES: Record<Vue, Forme[]> = {
  face: DONNEES.shapes.filter((s) => s.view === VUE_SOURCE.face),
  dos: DONNEES.shapes.filter((s) => s.view === VUE_SOURCE.dos),
};

export const DEGRADES = DONNEES.gradients;

/**
 * Inerte : tout ce qui n'est pas un muscle entraînable — silhouette,
 * articulations, tendons, fascia. On fait confiance au tracé (`selectable`)
 * plutôt qu'à une liste tenue à la main ; la liste locale n'écarte en plus
 * que ce que le domaine ignore encore.
 */
export function estInerte(s: Forme): boolean {
  if (!s.r || !s.r.sel) return true;
  const base = baseDeRegion(s.r.m);
  return REGIONS_INERTES.has(base) || !REGION_LABELS[base];
}

/** Muscles vivants visibles sur chaque vue, dérivé du tracé lui-même. */
export const PAR_VUE: Record<Vue, Set<BaseRegion>> = {
  face: new Set(FORMES.face.filter((s) => !estInerte(s)).map((s) => baseDeRegion(s.r!.m))),
  dos: new Set(FORMES.dos.filter((s) => !estInerte(s)).map((s) => baseDeRegion(s.r!.m))),
};

/** Vue qui montre le plus de muscles de l'ensemble donné. */
export function meilleureVue(regions: Iterable<BaseRegion>): Vue {
  let f = 0;
  let d = 0;
  for (const r of regions) {
    if (PAR_VUE.face.has(r)) f += 1;
    if (PAR_VUE.dos.has(r)) d += 1;
  }
  return d > f ? "dos" : "face";
}

/** Vrai si au moins un muscle de l'ensemble est visible sur cette vue. */
export function vueMontre(vue: Vue, regions: Iterable<BaseRegion>): boolean {
  for (const r of regions) if (PAR_VUE[vue].has(r)) return true;
  return false;
}

/**
 * Boîte couvrant les muscles donnés sur une vue.
 *
 * Les bornes viennent du tracé lui-même : chaque forme porte les siennes.
 * L'ancien tracé obligeait à parcourir les chemins pour les déduire, ce qui
 * n'est plus nécessaire — une source de bug en moins.
 */
export function boiteDeRegions(vue: Vue, regions: Iterable<BaseRegion>): Boite | null {
  const cibles = new Set(regions);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  let vu = false;
  for (const s of FORMES[vue]) {
    if (!s.r || estInerte(s)) continue;
    if (!cibles.has(baseDeRegion(s.r.m))) continue;
    const [a, b, c, d] = s.r.bounds;
    if (a < x1) x1 = a;
    if (b < y1) y1 = b;
    if (c > x2) x2 = c;
    if (d > y2) y2 = d;
    vu = true;
  }
  return vu ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
}
