"use client";

// Le corps qui s'approche de la zone travaillée.
//
// On part du corps entier, puis on vient sur les muscles de l'exercice, comme
// une carte du monde qu'on amène sur un pays : on comprend d'abord OÙ, ensuite
// QUOI. Sans ce départ large, un cadrage sur des quadriceps ne dit pas de quoi
// il s'agit.
//
// La fenêtre est écrite directement sur l'attribut `viewBox` à chaque image :
// passer par un état React redessinerait les 267 tracés du corps soixante fois
// par seconde pour ne changer que quatre nombres.

import { useEffect, useRef } from "react";
import CorpsSvg, { VIEWBOX, type CorpsSvgProps, type Vue } from "./CorpsSvg";
import type { Fenetre } from "@/lib/domain/cadrage";

const DUREE = 820;
const ATTENTE = 220;

type Props = Omit<CorpsSvgProps, "fenetre" | "svgRef"> & {
  vue: Vue;
  /** Fenêtre d'arrivée. Égale au corps entier, rien ne bouge. */
  cible: Fenetre;
};

export default function CorpsZoom({ cible, vue, ...reste }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const cle = cible.join(" ");

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const depart = VIEWBOX[vue];
    const arrivee = cible;
    const poser = (f: readonly number[]) => svg.setAttribute("viewBox", f.join(" "));

    const immobile = depart.every((v, i) => Math.abs(v - arrivee[i]) < 0.01);
    const reduit =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (immobile || reduit) {
      poser(arrivee);
      return;
    }

    poser(depart);
    let image = 0;
    let debut = 0;

    const pas = (t: number) => {
      if (!debut) debut = t;
      const ecoule = t - debut - ATTENTE;
      if (ecoule < 0) {
        image = requestAnimationFrame(pas);
        return;
      }
      const p = Math.min(1, ecoule / DUREE);
      // Sortie cubique : l'approche ralentit en arrivant, comme un zoom de
      // carte qui se pose.
      const e = 1 - Math.pow(1 - p, 3);
      poser(depart.map((v, i) => v + (arrivee[i] - v) * e));
      if (p < 1) image = requestAnimationFrame(pas);
    };

    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, vue]);

  // `fenetre` porte la cible pour le rendu serveur et le cas « mouvement
  // réduit » : sans JS, on voit directement la zone cadrée.
  return <CorpsSvg {...reste} vue={vue} fenetre={cible} svgRef={ref} />;
}
