"use client";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "journal_opening_played";

/**
 * Le geste signature de l'app : une porte de nuit qui s'ouvre sur l'aube,
 * une fois par session. Représente l'ouverture de l'esprit au moment où
 * on ouvre son journal. Sautée instantanément si l'utilisateur préfère
 * moins de mouvement, ou si elle a déjà joué cette session ; passable
 * au clic/touche/clavier à tout moment.
 */
export default function OpeningSequence() {
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduit) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return;
    }
    setVisible(true);
    const t1 = setTimeout(() => setOpening(true), 950);
    const t2 = setTimeout(() => fermer(), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fermer() {
    if (closedRef.current) return;
    closedRef.current = true;
    setOpening(true);
    setLeaving(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    setTimeout(() => setVisible(false), 1200);
  }

  if (!visible) return null;

  return (
    <div
      className={`opening-overlay ${opening ? "opening" : ""} ${leaving ? "leaving" : ""}`}
      onClick={fermer}
      onKeyDown={fermer}
      role="button"
      tabIndex={0}
      aria-label="Passer l'animation d'ouverture"
    >
      <div className="opening-panel left" />
      <div className="opening-panel right" />
      <div className="opening-word">
        Journal
        <span>ouvre ta journée</span>
      </div>
    </div>
  );
}
