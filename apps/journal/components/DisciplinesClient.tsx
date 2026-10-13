"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { IconCheck, IconFlame } from "./icons";

type Jour = { date: string; fait: boolean };

type DisciplineVM = {
  id: string;
  nom: string;
  icone: string;
  couleur: string;
  streak: number;
  niveauFlamme: 0 | 1 | 2 | 3;
  faitAujourdhui: boolean;
  historique30: Jour[];
};

function libelleJour(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const DOWS = ["L", "M", "M", "J", "V", "S", "D"];
const DOWS_LONG = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** Jour de semaine le plus souvent manqué sur la période (0 = lundi). */
function jourLePlusManque(jours: Jour[]): { nom: string; manques: number } | null {
  const manques = [0, 0, 0, 0, 0, 0, 0];
  for (const j of jours) {
    if (j.fait) continue;
    const d = new Date(j.date + "T00:00:00");
    manques[(d.getDay() + 6) % 7] += 1;
  }
  let pire = 0;
  for (let i = 1; i < 7; i++) if (manques[i] > manques[pire]) pire = i;
  if (manques[pire] === 0) return null;
  return { nom: DOWS_LONG[pire], manques: manques[pire] };
}

/**
 * Calendrier des 30 derniers jours relâché au survol de la carte.
 * Trois choses le séparent d'une grille statique : les colonnes sont
 * alignées sur les jours de la semaine (on voit donc quel jour on saute),
 * la révélation remonte depuis aujourd'hui vers le passé, et une seule
 * infobulle glisse d'un jour à l'autre au lieu d'une par case.
 */
function Calendrier({ jours, couleur }: { jours: Jour[]; couleur: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; fleche: number; texte: string } | null>(null);
  const [visible, setVisible] = useState(false);

  function survoler(e: React.MouseEvent<HTMLDivElement>, j: Jour) {
    const sq = e.currentTarget;
    const grille = sq.parentElement;
    if (!grille) return;
    const centre = sq.offsetLeft + sq.offsetWidth / 2;
    // L'infobulle ne doit pas dépasser de la carte : on la borne, et la
    // pointe se décale pour continuer à viser le bon jour.
    const marge = 56;
    const x = Math.min(Math.max(centre, marge), grille.offsetWidth - marge);
    setTip({
      x,
      y: sq.offsetTop + sq.offsetHeight,
      fleche: centre - x,
      texte: `${libelleJour(j.date)} · ${j.fait ? "validé" : "non validé"}`,
    });
    setVisible(true);
  }

  const total = jours.filter((j) => j.fait).length;
  const manque = jourLePlusManque(jours);

  // Décalage pour que la première case tombe dans la bonne colonne.
  const premier = new Date(jours[0].date + "T00:00:00");
  const vides = (premier.getDay() + 6) % 7;

  return (
    <div className="disc-cal">
      <div className="disc-cal-inner">
        <div className="disc-cal-pad">
          <div className="disc-cal-head">
            <span className="disc-cal-title">30 derniers jours</span>
            <span className="disc-cal-sub">{total} validés</span>
          </div>
          <div className="disc-cal-body">
            <div>
              <div className="disc-cal-dows" aria-hidden>
                {DOWS.map((d, i) => (
                  <span className="disc-cal-dow" key={i}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="disc-cal-grid" onMouseLeave={() => setVisible(false)}>
                {Array.from({ length: vides }, (_, i) => (
                  <div className="disc-cal-sq vide" key={`v${i}`} style={{ animationDelay: "0ms" }} />
                ))}
                {jours.map((j, i) => (
                  <div
                    key={j.date}
                    className="disc-cal-sq"
                    style={{
                      // La cascade part d'aujourd'hui (dernière case) et remonte.
                      animationDelay: `${(jours.length - 1 - i) * 11}ms`,
                      background: j.fait ? couleur : undefined,
                      boxShadow: j.fait ? `0 2px 6px -2px ${couleur}99` : undefined,
                    }}
                    onMouseEnter={(e) => survoler(e, j)}
                  />
                ))}
                {tip && (
                  <div
                    className={`disc-tip ${visible ? "on" : ""}`}
                    style={{
                      transform: `translate(calc(${tip.x}px - 50%), calc(${tip.y}px + 7px))`,
                      ["--arrow" as string]: `calc(50% + ${tip.fleche}px)`,
                    }}
                  >
                    {tip.texte}
                  </div>
                )}
              </div>
            </div>

            {/* La lecture que l'alignement hebdomadaire rend possible. */}
            <div className="disc-read">
              <div className="disc-read-item">
                <div className="k">Régularité</div>
                <div className="v">
                  {Math.round((total / jours.length) * 100)}% <small>sur 30 jours</small>
                </div>
              </div>
              <div className="disc-read-item">
                <div className="k">Jour le plus manqué</div>
                <div className="v">
                  {manque ? (
                    <>
                      {manque.nom} <small>· {manque.manques} fois</small>
                    </>
                  ) : (
                    <>
                      aucun <small>· rien manqué</small>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisciplinesClient({ disciplines }: { disciplines: DisciplineVM[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [pendingNoteFor, setPendingNoteFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const prevStreaks = useRef<Record<string, number>>({});
  const [popped, setPopped] = useState<Set<string>>(new Set());

  useEffect(() => {
    const augmentes = new Set<string>();
    for (const d of disciplines) {
      const precedent = prevStreaks.current[d.id];
      if (precedent !== undefined && d.streak > precedent) augmentes.add(d.id);
      prevStreaks.current[d.id] = d.streak;
    }
    if (augmentes.size > 0) {
      setPopped(augmentes);
      const t = setTimeout(() => setPopped(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [disciplines]);

  async function toggle(d: DisciplineVM, note?: string) {
    setPending(d.id);
    await fetch(`/api/disciplines/${d.id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || null }),
    });
    if (!d.faitAujourdhui) showToast(`${d.nom} — validé`);
    setPending(null);
    setPendingNoteFor(null);
    setNoteDraft("");
    router.refresh();
  }

  function onClickPrincipal(d: DisciplineVM) {
    if (d.faitAujourdhui) {
      toggle(d);
      return;
    }
    if (pendingNoteFor === d.id) {
      setPendingNoteFor(null);
      setNoteDraft("");
      return;
    }
    setPendingNoteFor(d.id);
    setNoteDraft("");
  }

  if (disciplines.length === 0) {
    return (
      <section className="panel panel-pad-lg">
        <div className="empty">
          <IconFlame />
          Aucune discipline configurée pour l&apos;instant.
        </div>
      </section>
    );
  }

  return (
    <div className="grid g-2">
      {disciplines.map((d) => {
        const quinzaine = d.historique30.slice(-14);
        return (
          <section className="disc-card spot" key={d.id}>
            <div className="disc-top">
              <div className="disc-left">
                <div
                  className="disc-icon"
                  style={{ background: `${d.couleur}1a`, boxShadow: `inset 0 0 0 1px ${d.couleur}33` }}
                >
                  {d.icone}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="disc-name">{d.nom}</div>
                  <div className={`disc-streak ${popped.has(d.id) ? "pop" : ""}`} style={{ color: d.couleur }}>
                    <IconFlame style={{ width: 13, height: 13 }} />
                    {d.streak === 0 ? "aucune série" : `${d.streak} jour${d.streak > 1 ? "s" : ""} d'affilée`}
                  </div>
                </div>
              </div>

              <button
                className="disc-check"
                disabled={pending === d.id}
                style={
                  d.faitAujourdhui
                    ? { background: d.couleur, color: "#fff", boxShadow: `0 6px 14px -6px ${d.couleur}` }
                    : pendingNoteFor === d.id
                      ? { background: "var(--surface-3)", color: "var(--ink-2)" }
                      : { background: `${d.couleur}14`, color: d.couleur, boxShadow: `inset 0 0 0 1px ${d.couleur}33` }
                }
                onClick={() => onClickPrincipal(d)}
              >
                {d.faitAujourdhui ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <IconCheck style={{ width: 14, height: 14 }} /> Fait
                  </span>
                ) : pendingNoteFor === d.id ? (
                  "Annuler"
                ) : (
                  "Valider aujourd'hui"
                )}
              </button>
            </div>

            {pendingNoteFor === d.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
                <textarea
                  placeholder="Un mot sur cette session ? (optionnel)"
                  rows={2}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn"
                  style={{ flexShrink: 0, alignSelf: "stretch" }}
                  disabled={pending === d.id}
                  onClick={() => toggle(d, noteDraft.trim())}
                >
                  Valider
                </button>
              </div>
            )}

            <div>
              <div className="disc-heat">
                {quinzaine.map((j) => (
                  <div
                    className="disc-sq"
                    key={j.date}
                    style={j.fait ? { background: d.couleur, boxShadow: `0 2px 6px -2px ${d.couleur}99` } : undefined}
                    title={libelleJour(j.date)}
                  />
                ))}
              </div>
              <div className="disc-heat-legend">
                <span>14 derniers jours</span>
                <span>{quinzaine.filter((j) => j.fait).length} validés</span>
              </div>
            </div>

            <Calendrier jours={d.historique30} couleur={d.couleur} />
          </section>
        );
      })}
    </div>
  );
}
