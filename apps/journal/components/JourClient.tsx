"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { ProgressRing } from "./charts";
import Segmented from "./Segmented";
import {
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconPen,
  IconClock,
  IconTarget,
  IconRepeat,
  IconInbox,
} from "./icons";

type Tache = {
  id: string;
  date: string;
  texte: string;
  heure: string | null;
  fait: boolean;
  objectifId: string | null;
  reporteLe: string | null;
};
type ObjectifOption = { id: string; nom: string };

export default function JourClient({
  date,
  today,
  prevDate,
  nextDate,
  taches,
  objectifs,
  noteInitiale,
}: {
  date: string;
  today: string;
  prevDate: string;
  nextDate: string;
  taches: Tache[];
  objectifs: ObjectifOption[];
  noteInitiale: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"checklist" | "planning">("checklist");
  const [texte, setTexte] = useState("");
  const [heure, setHeure] = useState("");
  const [objectifId, setObjectifId] = useState("");
  const [saving, setSaving] = useState(false);
  const [justToggled, setJustToggled] = useState<string | null>(null);

  const [note, setNote] = useState(noteInitiale);
  const [noteSaved, setNoteSaved] = useState(true);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNote(noteInitiale);
    setNoteSaved(true);
  }, [date, noteInitiale]);

  async function enregistrerNote(valeur: string) {
    await fetch("/api/notes-jour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, texte: valeur }),
    });
    setNoteSaved(true);
  }

  function onNoteChange(valeur: string) {
    setNote(valeur);
    setNoteSaved(false);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => enregistrerNote(valeur), 900);
  }

  function onNoteBlur() {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    if (!noteSaved) enregistrerNote(note);
  }

  const d = new Date(date + "T00:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const estAujourdhui = date === today;

  function allerAu(cible: string) {
    router.push(`/jour?date=${cible}`);
  }

  async function toggle(id: string) {
    setJustToggled(id);
    setTimeout(() => setJustToggled((cur) => (cur === id ? null : cur)), 460);
    await fetch(`/api/taches/${id}`, { method: "PATCH" });
    router.refresh();
  }

  async function supprimer(id: string) {
    await fetch(`/api/taches/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function ignorer(id: string) {
    await fetch(`/api/taches/${id}/ignorer`, { method: "POST" });
    showToast("Tâche ignorée");
    router.refresh();
  }

  function formatDateCourte(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  async function ajouter() {
    if (!texte.trim()) {
      showToast("Décris la tâche");
      return;
    }
    setSaving(true);
    await fetch("/api/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, texte: texte.trim(), heure: heure || null, objectifId: objectifId || null }),
    });
    setTexte("");
    setHeure("");
    setObjectifId("");
    setSaving(false);
    showToast("Tâche ajoutée");
    router.refresh();
  }

  const sorted = [...taches].sort((a, b) => (a.heure || "99:99").localeCompare(b.heure || "99:99"));
  const faites = sorted.filter((t) => t.fait).length;
  const pct = sorted.length > 0 ? Math.round((faites / sorted.length) * 100) : 0;
  const reportees = sorted.filter((t) => t.reporteLe).length;

  function TaskRow({ t }: { t: Tache }) {
    const obj = objectifs.find((o) => o.id === t.objectifId);
    return (
      <div className={`task ${t.fait ? "done" : ""}`}>
        <div
          className={`chk ${justToggled === t.id ? "chk-pop" : ""}`}
          onClick={() => toggle(t.id)}
          role="checkbox"
          aria-checked={t.fait}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(t.id);
            }
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </div>

        <div className="txt">
          {t.texte}
          {(obj || t.reporteLe) && (
            <div className="task-tags">
              {obj && (
                <span className="tag brand">
                  <IconTarget style={{ width: 11, height: 11 }} />
                  {obj.nom}
                </span>
              )}
              {t.reporteLe && (
                <span className="tag amber">
                  <IconRepeat style={{ width: 11, height: 11 }} />
                  reporté du {formatDateCourte(t.reporteLe)}
                </span>
              )}
            </div>
          )}
        </div>

        {t.heure && <div className="heure">{t.heure}</div>}

        {t.reporteLe && (
          <button className="btn btn-ghost btn-sm" onClick={() => ignorer(t.id)} title="Ne plus faire remonter">
            Ignorer
          </button>
        )}
        <button className="del" onClick={() => supprimer(t.id)} aria-label="Supprimer la tâche">
          <IconX />
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title" style={{ textTransform: "capitalize" }}>
            {label}
          </h1>
          <p className="page-sub">
            {estAujourdhui ? "Aujourd'hui" : "Journée archivée"} ·{" "}
            {sorted.length === 0 ? "aucune tâche" : `${faites} sur ${sorted.length} tâches cochées`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-icon" onClick={() => allerAu(prevDate)} aria-label="Jour précédent">
            <IconChevronLeft />
          </button>
          {!estAujourdhui && (
            <button className="btn" onClick={() => allerAu(today)}>
              Aujourd&apos;hui
            </button>
          )}
          <button className="btn btn-icon" onClick={() => allerAu(nextDate)} aria-label="Jour suivant">
            <IconChevronRight />
          </button>
        </div>
      </header>

      <div className="grid g-main">
        {/* ─── Colonne principale ─── */}
        <section className="panel panel-pad-lg spot">
          <div className="panel-head">
            <div className="chip">
              <IconCheck />
            </div>
            <div className="ph-text">
              <h2>Tâches</h2>
              <p>
                {sorted.length} au programme{reportees > 0 ? ` · ${reportees} reportée${reportees > 1 ? "s" : ""}` : ""}
              </p>
            </div>
            <div className="ph-right">
              <Segmented
                ariaLabel="Affichage des tâches"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "checklist", label: "Liste" },
                  { value: "planning", label: "Horaires" },
                ]}
              />
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="empty">
              <IconInbox />
              Rien de prévu ce jour-là. Ajoute une tâche depuis le panneau de droite.
            </div>
          ) : mode === "checklist" ? (
            <div className="task-list">
              {sorted.map((t) => (
                <TaskRow key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div className="schedule">
              {sorted.filter((t) => !t.heure).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 7 }}>
                    Sans horaire
                  </div>
                  <div className="task-list">
                    {sorted
                      .filter((t) => !t.heure)
                      .map((t) => (
                        <TaskRow key={t.id} t={t} />
                      ))}
                  </div>
                </div>
              )}
              {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
                const hh = String(h).padStart(2, "0");
                const hTaches = sorted.filter((t) => t.heure?.startsWith(hh));
                return (
                  <div className="schedule-row" key={hh}>
                    <div className="schedule-hour">{hh}:00</div>
                    <div className="schedule-line">
                      {hTaches.map((t) => (
                        <TaskRow key={t.id} t={t} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Colonne latérale ─── */}
        <div className="stack">
          <section className="panel panel-hero spot">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ProgressRing value={pct} size={86} stroke={9} color={pct >= 100 ? "#0ea98f" : "#1d7fe0"} colorSoft={pct >= 100 ? "#3ed0b6" : "#4aa3f5"}>
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em" }}>{pct}%</span>
              </ProgressRing>
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">Avancement du jour</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 5, lineHeight: 1.1 }}>
                  {faites} / {sorted.length || 0}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                  {sorted.length === 0
                    ? "aucune tâche"
                    : pct >= 100
                      ? "journée bouclée"
                      : `${sorted.length - faites} restante${sorted.length - faites > 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
          </section>

          <section className="panel spot">
            <div className="panel-head">
              <div className="chip violet">
                <IconPen />
              </div>
              <div className="ph-text">
                <h2>Note du jour</h2>
                <p>{noteSaved ? "Enregistrée automatiquement" : "Enregistrement…"}</p>
              </div>
            </div>
            <textarea
              placeholder="Comment s'est passée cette journée ?"
              rows={4}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              onBlur={onNoteBlur}
            />
          </section>

          <section className="panel spot">
            <div className="panel-head">
              <div className="chip teal">
                <IconPlus />
              </div>
              <div className="ph-text">
                <h2>Ajouter une tâche</h2>
                <p>Elle sera posée sur cette journée</p>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="t-texte">Description</label>
                <input
                  id="t-texte"
                  type="text"
                  placeholder="Ex : appeler le comptable"
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") ajouter();
                  }}
                />
              </div>
            </div>
            <div className="row">
              <div className="field small">
                <label htmlFor="t-heure">
                  <IconClock style={{ width: 11, height: 11, display: "inline", verticalAlign: "-1px" }} /> Heure
                </label>
                <input id="t-heure" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="t-objectif">Objectif lié</label>
                <select id="t-objectif" value={objectifId} onChange={(e) => setObjectifId(e.target.value)}>
                  <option value="">— aucun —</option>
                  {objectifs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={ajouter} disabled={saving}>
              <IconPlus style={{ width: 15, height: 15 }} />
              {saving ? "Ajout…" : "Ajouter la tâche"}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
