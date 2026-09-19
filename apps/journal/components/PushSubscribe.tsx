"use client";
import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";

const DISMISS_KEY = "journal_push_prompt_dismissed";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribe() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (Notification.permission !== "default") return; // deja accepte ou refuse ailleurs
    setVisible(true);
  }, []);

  async function activer() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notifications refusées — tu peux les activer plus tard dans les réglages du navigateur.");
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        showToast("Configuration push manquante.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      localStorage.setItem(DISMISS_KEY, "1");
      showToast("Rappels activés !");
      setVisible(false);
    } catch {
      showToast("Impossible d'activer les rappels.");
    } finally {
      setBusy(false);
    }
  }

  function plusTard() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="onboarding-banner">
      <div className="onboarding-icon">🔔</div>
      <div className="onboarding-text">
        <strong>Active les rappels</strong>
        <p>On te relance tant que ta journée n&apos;est pas remplie — jamais si tu as déjà avancé.</p>
      </div>
      <div className="onboarding-actions">
        <button className="onboarding-btn ghost" onClick={plusTard} disabled={busy}>
          Plus tard
        </button>
        <button className="onboarding-btn" onClick={activer} disabled={busy}>
          {busy ? "…" : "Activer"}
        </button>
      </div>
    </div>
  );
}
