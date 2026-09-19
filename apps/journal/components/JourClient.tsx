"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type Tache = {
  id: string;
  date: string;
  texte: string;
  heure: string | null;
  fait: boolean;
  objectifId: string | null;
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

  const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function allerAu(d: string) {
    router.push(`/jour?date=${d}`);
  }

  async function toggle(id: string) {
    setJustToggled(id);
    setTimeout(() => setJustToggled((cur) => (cur === id ? null : cur)), 320);
    await fetch(`/api/taches/${id}`, { method: "PATCH" });
    router.refresh();
  }

  async function supprimer(id: string) {
    await fetch(`/api/taches/${id}`, { method: "DELETE" });
    router.refresh();
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

  function TaskRow({ t }: { t: Tache }) {
    const obj = objectifs.find((o) => o.id === t.objectifId);
    return (
      <div className={`task ${t.fait ? "done" : ""}`}>
        <div className={`chk ${justToggled === t.id ? "chk-pop" : ""}`} onClick={() => toggle(t.id)}>
          {t.fait ? "✓" : ""}
        </div>
        <div className="txt">
          {t.texte}
          {obj && <span className="obj-tag">🎯 {obj.nom}</span>}
        </div>
        {t.heure && <div className="heure">{t.heure}</div>}
        <button className="del" onClick={() => supprimer(t.id)}>×</button>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="day-nav">
          <button onClick={() => allerAu(prevDate)}>‹</button>
          <div className="day-label">
            {label}
            <span className="sub">{date === today ? "Aujourd'hui" : ""}</span>
          </div>
          <button onClick={() => allerAu(nextDate)}>›</button>
        </div>

        <div className="mode-toggle">
          <button className={`mode-btn ${mode === "checklist" ? "active" : ""}`} onClick={() => setMode("checklist")}>
            Checklist
          </button>
          <button className={`mode-btn ${mode === "planning" ? "active" : ""}`} onClick={() => setMode("planning")}>
            Emploi du temps
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="empty">Aucune tâche ce jour.</div>
        ) : mode === "checklist" ? (
          <div>
            {sorted.map((t) => (
              <TaskRow key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <div>
            {sorted.filter((t) => !t.heure).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                  Sans horaire
                </div>
                {sorted.filter((t) => !t.heure).map((t) => (
                  <TaskRow key={t.id} t={t} />
                ))}
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
      </div>

      <div className="card">
        <h2>
          Note du jour
          <span className="note-status">{noteSaved ? "" : "…"}</span>
        </h2>
        <textarea
          className="note-textarea"
          placeholder="Comment s'est passée cette journée ?"
          rows={3}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={onNoteBlur}
        />
      </div>

      <div className="card">
        <h2>Ajouter une tâche</h2>
        <div className="row">
          <div className="field" style={{ flex: 3 }}>
            <label htmlFor="t-texte">Description</label>
            <input
              id="t-texte"
              type="text"
              placeholder="Ex : appeler le comptable"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
          </div>
          <div className="field small">
            <label htmlFor="t-heure">Heure (opt.)</label>
            <input id="t-heure" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="t-objectif">Objectif lié (opt.)</label>
            <select id="t-objectif" value={objectifId} onChange={(e) => setObjectifId(e.target.value)}>
              <option value="">— aucun —</option>
              {objectifs.map((o) => (
                <option key={o.id} value={o.id}>{o.nom}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={ajouter} disabled={saving}>
          {saving ? "Ajout…" : "Ajouter la tâche"}
        </button>
      </div>
    </>
  );
}
