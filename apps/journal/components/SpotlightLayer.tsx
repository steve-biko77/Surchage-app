"use client";
import { useEffect } from "react";

/**
 * Pose un reflet qui suit le pointeur sur tout élément portant la classe
 * `.spot`. Un seul écouteur pour toute la page, limité à une frame, et
 * neutralisé si l'utilisateur préfère moins de mouvement.
 */
export default function SpotlightLayer() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: PointerEvent | null = null;

    const appliquer = () => {
      frame = 0;
      const e = pending;
      pending = null;
      if (!e) return;
      const cible = e.target as Element | null;
      const el = cible?.closest?.(".spot") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!frame) frame = requestAnimationFrame(appliquer);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
