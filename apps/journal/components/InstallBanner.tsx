"use client";
import { useEffect, useState } from "react";

const DISMISS_KEY = "journal_install_prompt_dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "autre" {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "autre";
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "autre">("autre");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return; // deja installee, inutile
    if (localStorage.getItem(DISMISS_KEY)) return;
    const p = detectPlatform();
    if (p === "autre") return; // pas d'instructions utiles sur desktop
    setPlatform(p);
    setVisible(true);
  }, []);

  function fermer() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="onboarding-banner">
      <div className="onboarding-icon">📲</div>
      <div className="onboarding-text">
        <strong>Ajoute Journal à ton écran d&apos;accueil</strong>
        <p>
          {platform === "ios"
            ? "Bouton Partager (le carré avec la flèche) → « Sur l'écran d'accueil »."
            : "Menu ⋮ du navigateur → « Ajouter à l'écran d'accueil » ou « Installer l'application »."}
        </p>
      </div>
      <div className="onboarding-actions">
        <button className="onboarding-btn" onClick={fermer}>
          Compris
        </button>
      </div>
    </div>
  );
}
