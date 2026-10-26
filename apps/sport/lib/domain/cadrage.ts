// Cadrage de la carte musculaire sur un ensemble de muscles.
//
// À 56 px de large, un corps entier réduit le grand dorsal à une douzaine de
// pixels : on devine une tache, on ne lit rien. Le recadrage résout ça comme
// une carte du monde qu'on amène sur la France — même tracé, même échelle de
// référence, on approche simplement la zone qui porte l'information.
//
// Les boîtes viennent du tracé lui-même (lib/anatomie/trace.ts) : chaque
// forme porte les siennes. L'ancien tracé obligeait à parcourir les chemins
// pour les déduire — un parseur de moins à maintenir.

import type { Boite, Fenetre } from "@/lib/anatomie/trace";

export { boiteDeRegions, VIEWBOX } from "@/lib/anatomie/trace";
export type { Boite, Fenetre, Vue } from "@/lib/anatomie/trace";

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
  options: { marge?: number; zoomMax?: number; zoomMin?: number; ratio?: number } = {}
): Fenetre {
  const [vx, vy, vw, vh] = complete;
  if (!boite || boite.w <= 0 || boite.h <= 0) return complete;
  const { marge = 0.35, zoomMax = 3.2, zoomMin = 1, ratio = vw / vh } = options;

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

  // Plancher d'approche. Quand les muscles allumés sont éparpillés — le haut
  // du corps vu de face sur des tractions, du trapèze aux avant-bras — leur
  // boîte couvre presque tout et il ne reste aucun zoom. On resserre alors
  // jusqu'à ce plancher, quitte à rogner les extrémités (tête, mains) : un
  // corps entier minuscule n'apprend rien, un cadrage serré oui.
  const zoom = vh / h;
  if (zoom < zoomMin) {
    const f = zoom / zoomMin;
    w *= f;
    h *= f;
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
