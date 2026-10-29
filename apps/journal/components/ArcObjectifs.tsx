"use client";

// Les objectifs sur un arc — des cartes qui roulent sur un très grand cercle,
// celle qu'on regarde droite à son sommet, les autres inclinées tangentiellement
// à la courbe.
//
// Tout le dessin tient dans UNE rotation par carte. Chaque carte pivote autour
// du centre du cercle, placé loin sous la scène :
//
//     transform-origin: 50% calc(100% + rayon)
//     transform: rotate((i - position) * PAS)
//
// La position sur la courbe et l'inclinaison tombent ensemble — une carte qui
// tourne autour d'un point éloigné suit forcément le cercle, et s'incline
// forcément de l'angle parcouru. Aucune trigonométrie par carte, aucun sinus,
// aucun cosinus : la seule chose calculée est un angle, et c'est une
// soustraction.
//
// L'arc ne porte que l'identification : nom, avancement, rythme tenu. Les
// commandes vivent dans la fiche en dessous, à plat. Un champ de saisie dans
// une carte inclinée se vise mal — la rotation est pour l'œil, pas pour le
// pouce.

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

/**
 * Angle entre deux cartes voisines. Volontairement petit par rapport au rayon :
 * les cartes doivent se chevaucher le long de la courbe. Trop d'angle et
 * l'arc se transforme en file de cartes espacees, la courbe ne se lit plus.
 */
const PAS = 8;
/**
 * Cartes dessinées de chaque côté. Au-delà on n'en met pas : elles seraient
 * hors du cadre de toute façon, l'arc est simplement coupé — il continue
 * au-delà du bord, comme une roue dont on ne voit qu'un secteur.
 */
const VOISINS = 3;

/** Cadence de la rotation libre. */
const CADENCE = 3800;
/** Silence observé après une action avant de reprendre la rotation. */
const REPRISE = 9000;

export default function ArcObjectifs({
  objectifs,
  actif,
  onActif,
  gele = false,
}: {
  objectifs: CarteObjectif[];
  actif: number;
  onActif: (i: number) => void;
  /** Suspend la rotation — typiquement quand on saisit dans la fiche. */
  gele?: boolean;
}) {
  // Position flottante : l'index actif au repos, décalé d'une fraction pendant
  // le glissement pour que l'arc suive le doigt au lieu de sauter à la relâche.
  const [glisse, setGlisse] = useState(0);
  // La rotation s'arrête dès qu'on agit, et reprend après un silence. Une carte
  // qui tourne pendant qu'on vise un bouton est une carte qu'on rate.
  const [enPause, setEnPause] = useState(false);
  const sens = useRef(1);
  const repriseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cadreRef = useRef<HTMLDivElement>(null);
  const geste = useRef<{ x: number; y: number; axe: "?" | "x" | "y"; depart: number } | null>(null);

  const position = actif + glisse;
  const enGlisse = glisse !== 0;

  // Pas de recentrage ici, contrairement a un eventail : la carte active doit
  // rester DROITE A SON SOMMET, c'est ce qui definit l'arc. Au premier
  // objectif les voisines sont toutes du meme cote et l'arc est dissymetrique
  // — c'est voulu, et l'etalement tient dans le cadre meme ainsi.

  const toucher = useCallback(() => {
    setEnPause(true);
    if (repriseRef.current) clearTimeout(repriseRef.current);
    repriseRef.current = setTimeout(() => setEnPause(false), REPRISE);
  }, []);

  const aller = useCallback(
    (i: number) => {
      toucher();
      onActif(Math.max(0, Math.min(objectifs.length - 1, i)));
    },
    [objectifs.length, onActif, toucher]
  );

  // Rotation libre, en va-et-vient plutôt qu'en boucle : repasser de la
  // dernière carte à la première ferait traverser tout l'arc d'un coup. Le
  // demi-tour aux extrémités garde un mouvement continu.
  useEffect(() => {
    if (enPause || gele || objectifs.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const minuteur = setTimeout(() => {
      let suivant = actif + sens.current;
      if (suivant >= objectifs.length) { sens.current = -1; suivant = actif - 1; }
      else if (suivant < 0) { sens.current = 1; suivant = actif + 1; }
      onActif(suivant);
    }, CADENCE);
    return () => clearTimeout(minuteur);
  }, [actif, enPause, gele, objectifs.length, onActif]);

  useEffect(() => () => { if (repriseRef.current) clearTimeout(repriseRef.current); }, []);

  function debut(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    toucher();
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
    const pas = (cadreRef.current?.offsetWidth ?? 340) / 3.4;
    const brut = -dx / pas;
    const vise = g.depart + brut;
    // Résistance aux bords : on tire dans le vide au ralenti.
    const borne = vise < 0 || vise > objectifs.length - 1 ? brut * 0.3 : brut;
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
    <div className="arc">
      <div
        className="arc-scene"
        ref={cadreRef}
        tabIndex={0}
        role="listbox"
        aria-label="Objectifs"
        aria-activedescendant={`arc-${objectifs[actif]?.id}`}
        onPointerEnter={toucher}
        onPointerDown={debut}
        onPointerMove={mouvement}
        onPointerUp={fin}
        onPointerCancel={fin}
      >
        {objectifs.map((o, i) => {
          const angle = i - position;
          const loin = Math.abs(angle);
          if (loin > VOISINS + 0.5) return null;

          const estActif = Math.round(position) === i;
          const [clair, fonce] = TEINTES[i % TEINTES.length];

          return (
            <button
              key={o.id}
              id={`arc-${o.id}`}
              type="button"
              role="option"
              aria-selected={estActif}
              className={`arc-carte${estActif ? " actif" : ""}`}
              style={{
                // L'unique rotation. Position et inclinaison en découlent.
                transform: `rotate(${angle * PAS}deg)`,
                zIndex: 50 - Math.round(loin * 10),
                opacity: Math.max(0, 1 - Math.max(0, loin - VOISINS + 0.6)),
                transition: enGlisse ? "none" : undefined,
              }}
              onClick={() => aller(i)}
            >
              {/* La mise en avant de la carte active vit sur une couche
                  séparée : la rotation reste seule sur le bouton, et la
                  géométrie de l'arc ne se mélange pas à l'emphase. */}
              <span className="arc-face" style={{ background: `linear-gradient(160deg, ${clair}, ${fonce})` }}>
                <span className="arc-nom">{o.nom}</span>
                <span className="arc-sous">{o.type === "temps" ? "Temps investi" : "Métrique"}</span>
                <span className="arc-bas">
                  <span className="arc-pct">{o.progression}%</span>
                  {o.coherence != null && <span className="arc-coh">{o.coherence}% tenu</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="arc-points" role="tablist" aria-label="Choisir un objectif">
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
