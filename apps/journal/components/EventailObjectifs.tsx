"use client";

// Les objectifs en éventail — une main de cartes étalée, celle qu'on regarde
// soulevée hors de l'étalement.
//
// Ce qui fait que ça se lit comme « soulevée » et non comme « la plus proche » :
// la carte active sort de l'échelle sur laquelle ses voisines sont rangées.
// Les autres décroissent régulièrement en s'éloignant ; elle, elle saute
// au-dessus de la série. Sans ce saut, l'œil ne voit qu'un dégradé de tailles.
//
// L'éventail ne porte QUE l'identification : nom, avancement, rythme tenu. Les
// commandes vivent dans le panneau en dessous, à plat. Un champ de saisie dans
// une carte inclinée se vise mal et se lit mal — la rotation est pour l'œil,
// pas pour le pouce.

import { useCallback, useEffect, useRef, useState } from "react";

export type CarteObjectif = {
  id: string;
  nom: string;
  progression: number;
  /** 0..100, ou null si aucun rythme visé. */
  coherence: number | null;
  type: "temps" | "metrique";
};

/** Teintes des cartes, prises aux accents de l'app et cyclées. */
const TEINTES = [
  ["#1d7fe0", "#0f5fae"],
  ["#6d6ff0", "#4f51d8"],
  ["#0ea98f", "#0a8a74"],
  ["#e2912c", "#b5701a"],
  ["#de5168", "#c23a50"],
];

const ANGLE = 6;
const ECART_X = 44;
const CHUTE_Y = 11;
/**
 * Cartes étalées de chaque côté. Au-delà, elles s'empilent sur la dernière
 * position et s'effacent : sans cette borne, une liste de dix objectifs
 * projetait des cartes hors du panneau et par-dessus la fiche du dessous.
 */
const VOISINS = 3;

export default function EventailObjectifs({
  objectifs,
  actif,
  onActif,
}: {
  objectifs: CarteObjectif[];
  actif: number;
  onActif: (i: number) => void;
}) {
  // Position flottante : l'index actif pendant le repos, décalé d'une fraction
  // pendant le glissement pour que l'éventail suive le doigt au lieu de sauter
  // d'un cran à la relâche.
  const [glisse, setGlisse] = useState(0);
  const cadreRef = useRef<HTMLDivElement>(null);
  const geste = useRef<{ x: number; y: number; axe: "?" | "x" | "y"; depart: number } | null>(null);

  const position = actif + glisse;
  const enGlisse = glisse !== 0;

  // L'arc se centre, pas la carte active. Sur le premier objectif, toutes les
  // voisines partent du même côté : garder l'active au centre jetait
  // l'éventail entier vers la droite, hors du panneau. On recentre donc sur
  // le milieu de la fenêtre visible — la main de cartes reste au milieu, et
  // c'est le soulèvement qui désigne l'active, pas sa position.
  const premier = Math.max(0, Math.round(position) - VOISINS);
  const dernier = Math.min(objectifs.length - 1, Math.round(position) + VOISINS);
  const recentrage = (premier + dernier) / 2 - position;

  const aller = useCallback(
    (i: number) => onActif(Math.max(0, Math.min(objectifs.length - 1, i))),
    [objectifs.length, onActif]
  );

  function debut(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    geste.current = { x: e.clientX, y: e.clientY, axe: "?", depart: actif };
  }

  function mouvement(e: React.PointerEvent) {
    const g = geste.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.axe === "?") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axe = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axe === "y") {
        geste.current = null;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const pas = (cadreRef.current?.offsetWidth ?? 340) / 3.2;
    const brut = -dx / pas;
    // Résistance aux bords : on tire dans le vide au ralenti.
    const vise = g.depart + brut;
    const borne = vise < 0 ? brut * 0.3 : vise > objectifs.length - 1 ? brut * 0.3 : brut;
    setGlisse(borne);
  }

  function fin() {
    const g = geste.current;
    geste.current = null;
    if (!g || g.axe !== "x") {
      setGlisse(0);
      return;
    }
    aller(Math.round(actif + glisse));
    setGlisse(0);
  }

  // Flèches du clavier : l'éventail est une liste, il doit se parcourir au clavier.
  useEffect(() => {
    const cadre = cadreRef.current;
    if (!cadre) return;
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); aller(actif - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); aller(actif + 1); }
    };
    cadre.addEventListener("keydown", clavier);
    return () => cadre.removeEventListener("keydown", clavier);
  }, [actif, aller]);

  return (
    <div className="evt">
      <div
        className="evt-scene"
        ref={cadreRef}
        tabIndex={0}
        role="listbox"
        aria-label="Objectifs"
        aria-activedescendant={`evt-${objectifs[actif]?.id}`}
        onPointerDown={debut}
        onPointerMove={mouvement}
        onPointerUp={fin}
        onPointerCancel={fin}
      >
        {objectifs.map((o, i) => {
          const d = i - position;
          const loin = Math.abs(d);
          // Position bornée : l'empilement s'arrête, l'effacement prend le relais.
          const dBorne = Math.max(-VOISINS, Math.min(VOISINS, d));
          const estActif = Math.round(position) === i;
          const [clair, fonce] = TEINTES[i % TEINTES.length];

          // L'échelle des voisines décroît régulièrement ; l'active saute
          // par-dessus. C'est ce saut qui la fait lire comme soulevée.
          const echelleVoisine = 0.9 - Math.min(loin, VOISINS) * 0.045;
          const echelle = estActif ? 1.06 : echelleVoisine;
          const monte = estActif ? -26 : 0;

          return (
            <button
              key={o.id}
              id={`evt-${o.id}`}
              type="button"
              role="option"
              aria-selected={estActif}
              className={`evt-carte${estActif ? " actif" : ""}`}
              style={{
                transform: `translate(-50%, 0) translateX(${(dBorne - recentrage) * ECART_X}px) translateY(${Math.min(loin, VOISINS) * CHUTE_Y + monte}px) rotate(${dBorne * ANGLE}deg) scale(${echelle})`,
                zIndex: 50 - Math.round(loin * 10),
                opacity: loin > VOISINS ? 0 : 1,
                background: `linear-gradient(160deg, ${clair}, ${fonce})`,
                transition: enGlisse ? "none" : undefined,
                pointerEvents: loin > VOISINS ? "none" : undefined,
              }}
              onClick={() => aller(i)}
            >
              <span className="evt-nom">{o.nom}</span>
              <span className="evt-sous">{o.type === "temps" ? "Temps investi" : "Métrique"}</span>
              <span className="evt-bas">
                <span className="evt-pct">{o.progression}%</span>
                {o.coherence != null && <span className="evt-coh">{o.coherence}% tenu</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="evt-points" role="tablist" aria-label="Choisir un objectif">
        {objectifs.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={i === actif}
            aria-label={o.nom}
            className={i === actif ? "on" : ""}
            onClick={() => aller(i)}
          />
        ))}
      </div>
    </div>
  );
}
