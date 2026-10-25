// Boîtes englobantes des portions anatomiques, et cadrage sur un ensemble
// de muscles.
//
// À 56 px de large, un corps entier réduit le grand dorsal à une douzaine de
// pixels : on devine une tache, on ne lit rien. Le recadrage résout ça comme
// une carte du monde qu'on amène sur la France — même tracé, même échelle de
// référence, on approche simplement la zone qui porte l'information.
//
// Les boîtes sont calculées une fois au chargement du module en parcourant
// les tracés. Les cubiques sont bornées par leurs points de contrôle : la
// boîte est donc très légèrement large, ce qui ne fait qu'ajouter de la marge.

import { FRONT_MUSCLES, BACK_MUSCLES } from "body-muscles";
import { baseDeRegion, type BaseRegion } from "./anatomie";

export type Vue = "face" | "dos";
export type Boite = { x: number; y: number; w: number; h: number };

/** Nombres d'un tracé SVG, notation exponentielle comprise. */
function nombres(bloc: string): number[] {
  return (bloc.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
}

/**
 * Parcourt un tracé et retourne ses bornes. Gère M/L/H/V/C/Z dans leurs
 * deux formes — c'est tout ce que le tracé source emploie, vérifié sur
 * l'ensemble des 89 portions.
 */
function bornesDuTrace(d: string): Boite | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let x = 0, y = 0;
  let departX = 0, departY = 0;
  let vu = false;

  const point = (px: number, py: number) => {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
    vu = true;
  };

  for (const [, lettre, bloc] of d.matchAll(/([MmLlHhVvCcZz])([^MmLlHhVvCcZz]*)/g)) {
    const n = nombres(bloc);
    const rel = lettre === lettre.toLowerCase();
    switch (lettre.toUpperCase()) {
      case "M":
        for (let i = 0; i + 1 < n.length; i += 2) {
          // Un `m` en tête de tracé vaut un `M` : la spec le dit, et le tracé
          // source commence justement comme ça. Les paires suivantes d'un
          // même bloc sont des `lineto` implicites.
          const absolu = !rel || (i === 0 && !vu);
          x = absolu ? n[i] : x + n[i];
          y = absolu ? n[i + 1] : y + n[i + 1];
          if (i === 0) { departX = x; departY = y; }
          point(x, y);
        }
        break;
      case "L":
        for (let i = 0; i + 1 < n.length; i += 2) {
          x = rel ? x + n[i] : n[i];
          y = rel ? y + n[i + 1] : n[i + 1];
          point(x, y);
        }
        break;
      case "H":
        for (const v of n) { x = rel ? x + v : v; point(x, y); }
        break;
      case "V":
        for (const v of n) { y = rel ? y + v : v; point(x, y); }
        break;
      case "C":
        for (let i = 0; i + 5 < n.length; i += 6) {
          // Les deux points de contrôle bornent la courbe : suffisant pour
          // cadrer, inutile d'en chercher les extrema exacts.
          point(rel ? x + n[i] : n[i], rel ? y + n[i + 1] : n[i + 1]);
          point(rel ? x + n[i + 2] : n[i + 2], rel ? y + n[i + 3] : n[i + 3]);
          const nx = rel ? x + n[i + 4] : n[i + 4];
          const ny = rel ? y + n[i + 5] : n[i + 5];
          x = nx; y = ny;
          point(x, y);
        }
        break;
      case "Z":
        x = departX; y = departY;
        break;
    }
  }

  if (!vu) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function construire(liste: Array<{ id: string; path: string }>): Map<BaseRegion, Boite> {
  const par = new Map<BaseRegion, Boite>();
  for (const r of liste) {
    const b = bornesDuTrace(r.path);
    if (!b) continue;
    const base = baseDeRegion(r.id);
    const ex = par.get(base);
    par.set(base, ex ? union(ex, b) : b);
  }
  return par;
}

function union(a: Boite, b: Boite): Boite {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
}

const BOITES: Record<Vue, Map<BaseRegion, Boite>> = {
  face: construire(FRONT_MUSCLES as Array<{ id: string; path: string }>),
  dos: construire(BACK_MUSCLES as Array<{ id: string; path: string }>),
};

/** Boîte d'une portion sur une vue, ou null si elle n'y figure pas. */
export function boiteDeRegion(vue: Vue, region: BaseRegion): Boite | null {
  return BOITES[vue].get(region) ?? null;
}

/** Boîte couvrant toutes les portions données qui figurent sur cette vue. */
export function boiteDeRegions(vue: Vue, regions: Iterable<BaseRegion>): Boite | null {
  let acc: Boite | null = null;
  for (const r of regions) {
    const b = BOITES[vue].get(r);
    if (!b) continue;
    acc = acc ? union(acc, b) : b;
  }
  return acc;
}

export type Fenetre = [number, number, number, number];

/**
 * Fenêtre d'affichage centrée sur `boite`, exprimée comme un viewBox.
 *
 * - `marge` : part de contexte gardée autour du muscle. On ne cadre jamais
 *   au ras : il faut continuer à comprendre OÙ on regarde sur le corps.
 * - `zoomMax` : plafond d'approche, pour la même raison.
 * - `ratio` : proportions de la boîte d'accueil (largeur / hauteur). La
 *   fenêtre les adopte, sinon `preserveAspectRatio` ajoute des bandes vides
 *   et le gain de place est perdu — c'est exactement ce qui faisait qu'un
 *   corps entier n'occupait que la moitié d'une vignette.
 *
 * La fenêtre est ensuite ramenée dans les limites du corps : on ne cadre pas
 * sur du vide à côté de l'épaule.
 */
export function fenetreSur(
  complete: Fenetre,
  boite: Boite | null,
  options: { marge?: number; zoomMax?: number; ratio?: number } = {}
): Fenetre {
  const [vx, vy, vw, vh] = complete;
  if (!boite || boite.w <= 0 || boite.h <= 0) return complete;
  const { marge = 0.35, zoomMax = 3.2, ratio = vw / vh } = options;

  let w = boite.w * (1 + marge * 2);
  let h = boite.h * (1 + marge * 2);

  // Plafond d'approche.
  w = Math.max(w, vw / zoomMax);
  h = Math.max(h, vh / zoomMax);

  // Plancher : jamais plus large que le corps. Sans ça, un muscle bilatéral
  // comme les deltoïdes — large comme le corps entier, plus sa marge — donne
  // une fenêtre plus grande que le corps, donc un DÉZOOM. C'est ce qui
  // laissait les élévations latérales aussi illisibles qu'avant.
  w = Math.min(w, vw);
  h = Math.min(h, vh);

  // Mise aux proportions de la boîte d'accueil : on n'enlève jamais de
  // contenu, on complète toujours la dimension la plus courte.
  if (w / h > ratio) h = w / ratio;
  else w = h * ratio;

  // La mise aux proportions a pu repasser au-dessus du corps : on réduit les
  // deux dimensions ensemble pour ne pas déformer.
  const debord = Math.max(w / vw, h / vh);
  if (debord > 1) {
    w /= debord;
    h /= debord;
  }

  let x = boite.x + boite.w / 2 - w / 2;
  let y = boite.y + boite.h / 2 - h / 2;

  // Recentrage dans le corps quand la fenêtre y tient encore.
  if (w <= vw) x = Math.min(Math.max(x, vx), vx + vw - w);
  else x = vx + vw / 2 - w / 2;
  if (h <= vh) y = Math.min(Math.max(y, vy), vy + vh - h);
  else y = vy + vh / 2 - h / 2;

  return [x, y, w, h];
}
