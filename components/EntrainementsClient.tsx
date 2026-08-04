"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, X, ChevronUp, ChevronDown, Save, Trash2, GripVertical, CalendarPlus, Check,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import MuscleSilhouette from "./MuscleSilhouette";

type Exercice = {
  id: string;
  nom: string;
  groupeMusculaire: string;
  typeCharge: string;
  programmeId: string | null;
  repPlancher: number;
  repPlafond: number;
};
type Programme = { id: string; nom: string };
type Modele = { nom: string; exerciceIds: string[] };

const GROUPES = ["dos", "biceps", "triceps", "epaules", "pectoraux", "jambes", "avant-bras", "abdominaux", "mollets"];
const TYPES_CHARGE = [
  { value: "haltere", label: "Haltère" },
  { value: "poulie", label: "Poulie" },
  { value: "barre", label: "Barre" },
  { value: "poids_du_corps", label: "Poids du corps" },
];
const MODELES_KEY = "surcharge_modeles_seance";
const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function prochainsJours(n: number) {
  const jours = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    jours.push({
      iso: d.toISOString().slice(0, 10),
      label: JOURS_COURTS[d.getDay()],
      numero: d.getDate(),
      estAujourdhui: i === 0,
    });
  }
  return jours;
}

export default function EntrainementsClient({ exercices, programmes }: { exercices: Exercice[]; programmes: Programme[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtreGroupe, setFiltreGroupe] = useState("tous");
  const [composition, setComposition] = useState<string[]>([]);
  const [nomSeance, setNomSeance] = useState("");
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dropCibleIso, setDropCibleIso] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [showNouvelExercice, setShowNouvelExercice] = useState(false);
  const [nomExo, setNomExo] = useState("");
  const [groupeExo, setGroupeExo] = useState(GROUPES[0]);
  const [typeChargeExo, setTypeChargeExo] = useState("haltere");
  const [programmeExo, setProgrammeExo] = useState("");
  const [creationEnCours, setCreationEnCours] = useState(false);

  const exerciceParId = useMemo(() => new Map(exercices.map((e) => [e.id, e])), [exercices]);
  const jours = useMemo(() => prochainsJours(14), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MODELES_KEY);
      if (raw) setModeles(JSON.parse(raw));
    } catch {
      // localStorage indisponible ou corrompu : on ignore, la fonctionnalite modeles reste vide
    }
  }, []);

  function sauverModeles(next: Modele[]) {
    setModeles(next);
    localStorage.setItem(MODELES_KEY, JSON.stringify(next));
  }

  const exercicesFiltres = exercices.filter((e) => {
    const matchGroupe = filtreGroupe === "tous" || e.groupeMusculaire === filtreGroupe;
    const matchRecherche = e.nom.toLowerCase().includes(recherche.toLowerCase());
    return matchGroupe && matchRecherche;
  });

  function ajouter(id: string) {
    setComposition((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function retirer(id: string) {
    setComposition((prev) => prev.filter((x) => x !== id));
  }
  function deplacer(index: number, direction: -1 | 1) {
    setComposition((prev) => {
      const next = [...prev];
      const cible = index + direction;
      if (cible < 0 || cible >= next.length) return prev;
      [next[index], next[cible]] = [next[cible], next[index]];
      return next;
    });
  }

  function enregistrerModele() {
    if (composition.length === 0) return;
    sauverModeles([...modeles, { nom: nomSeance || "Séance sans nom", exerciceIds: composition }]);
    setConfirmation("Modèle enregistré (sur cet appareil).");
    setTimeout(() => setConfirmation(null), 2500);
  }
  function chargerModele(m: Modele) {
    setNomSeance(m.nom);
    setComposition(m.exerciceIds.filter((id) => exerciceParId.has(id)));
  }
  function supprimerModele(i: number) {
    sauverModeles(modeles.filter((_, idx) => idx !== i));
  }

  async function planifier(iso: string) {
    if (composition.length === 0) return;
    await fetch("/api/seances-planifiees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: iso, nom: nomSeance || "Séance", exerciceIds: composition }),
    });
    setConfirmation(`Planifiée pour le ${iso}.`);
    setTimeout(() => setConfirmation(null), 2500);
    router.refresh();
  }

  async function creerExercice() {
    if (!nomExo) return;
    setCreationEnCours(true);
    await fetch("/api/exercices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nomExo,
        programmeId: programmeExo || null,
        groupeMusculaire: groupeExo,
        typeCharge: typeChargeExo,
      }),
    });
    setNomExo("");
    setCreationEnCours(false);
    setShowNouvelExercice(false);
    router.refresh();
  }

  return (
    <div>
      {confirmation && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--success)]/40 bg-[#0f2a1a] px-3 py-2 text-sm text-[var(--success)]">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> {confirmation}
        </div>
      )}

      {/* Seance en cours */}
      <Card
        className={`mb-4 border-[#3B82C4]/40 transition-shadow ${dragActive ? "ring-2 ring-[#3B82C4]" : ""}`}
        draggable={composition.length > 0}
        onDragStart={() => setDragActive(true)}
        onDragEnd={() => { setDragActive(false); setDropCibleIso(null); }}
      >
        <CardContent className="pt-4">
          <label className="sr-only" htmlFor="nom-seance">Nom de la séance</label>
          <input
            id="nom-seance"
            placeholder="Nom de la séance en cours"
            value={nomSeance}
            onChange={(e) => setNomSeance(e.target.value)}
            className="mb-3 w-full text-sm font-medium"
          />

          {composition.length === 0 ? (
            <p className="text-sm text-[var(--grey)]">
              Ajoute des exercices depuis la liste ci-dessous pour composer une séance.
            </p>
          ) : (
            <ul className="mb-1">
              {composition.map((id, i) => {
                const exo = exerciceParId.get(id);
                if (!exo) return null;
                return (
                  <li key={id} className="flex items-center gap-2 border-b border-[var(--card-border)] py-2 last:border-0">
                    <GripVertical className="h-4 w-4 shrink-0 text-[var(--grey)]" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm">{i + 1}. {exo.nom}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} className="rounded p-1 text-[var(--grey)] hover:text-[var(--chalk)] disabled:opacity-30" aria-label="Monter">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => deplacer(i, 1)} disabled={i === composition.length - 1} className="rounded p-1 text-[var(--grey)] hover:text-[var(--chalk)] disabled:opacity-30" aria-label="Descendre">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => retirer(id)} className="rounded p-1 text-[var(--grey)] hover:text-[var(--danger)]" aria-label="Retirer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {composition.length > 0 && (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={enregistrerModele} className="flex-1">
                <Save className="h-3.5 w-3.5" /> Enregistrer comme modèle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setComposition([])} className="text-[var(--grey)]">
                Vider
              </Button>
            </div>
          )}
          <p className="mt-2 text-[10px] text-[var(--grey)]">
            <GripVertical className="mb-0.5 inline h-3 w-3" aria-hidden="true" /> Glisse cette carte sur un jour ci-dessous (souris), ou touche directement un jour pour planifier.
          </p>
        </CardContent>
      </Card>

      {/* Modeles locaux */}
      {modeles.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--grey)]">Mes modèles</h3>
          <div className="flex flex-wrap gap-2">
            {modeles.map((m, i) => (
              <div key={i} className="flex items-center gap-1 rounded-full border border-[var(--steel)] py-1 pl-3 pr-1 text-xs">
                <button type="button" onClick={() => chargerModele(m)} className="text-[var(--chalk)]">{m.nom}</button>
                <button type="button" onClick={() => supprimerModele(i)} className="rounded-full p-1 text-[var(--grey)] hover:text-[var(--danger)]" aria-label={`Supprimer le modèle ${m.nom}`}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planification 14 jours */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--grey)]">Planifier sur les 14 prochains jours</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {jours.map((j) => (
            <button
              key={j.iso}
              type="button"
              disabled={composition.length === 0}
              onClick={() => planifier(j.iso)}
              onDragOver={(e) => { e.preventDefault(); setDropCibleIso(j.iso); }}
              onDragLeave={() => setDropCibleIso((cur) => (cur === j.iso ? null : cur))}
              onDrop={(e) => { e.preventDefault(); planifier(j.iso); setDragActive(false); setDropCibleIso(null); }}
              className={`flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs transition-colors disabled:opacity-40 ${
                dropCibleIso === j.iso ? "border-[#3B82C4] bg-[#122233]" : "border-[var(--card-border)] bg-[var(--bg-card)]"
              } ${j.estAujourdhui ? "border-[#FF5A1F]/60" : ""}`}
            >
              <span className="uppercase text-[var(--grey)]">{j.label}</span>
              <span className="font-heading text-lg font-bold">{j.numero}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referentiel d'exercices */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--grey)]" aria-hidden="true" />
          <input
            placeholder="Rechercher un exercice…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowNouvelExercice((v) => !v)} aria-label="Nouvel exercice">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        <Button variant={filtreGroupe === "tous" ? "pill" : "ghost"} size="sm" onClick={() => setFiltreGroupe("tous")} className={filtreGroupe === "tous" ? "border-[#FF5A1F] text-[#FF5A1F]" : ""}>
          Tous
        </Button>
        {GROUPES.map((g) => (
          <Button
            key={g}
            variant={filtreGroupe === g ? "pill" : "ghost"}
            size="sm"
            onClick={() => setFiltreGroupe(g)}
            className={`shrink-0 capitalize ${filtreGroupe === g ? "border-[#FF5A1F] text-[#FF5A1F]" : ""}`}
          >
            {g}
          </Button>
        ))}
      </div>

      {showNouvelExercice && (
        <Card className="mb-3 border-[#FF5A1F]/40">
          <CardContent className="pt-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#FF5A1F]">Nouvel exercice</h3>
            <input placeholder="Nom de l'exercice" value={nomExo} onChange={(e) => setNomExo(e.target.value)} className="mb-2 w-full text-sm" />
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="groupe-exo">Groupe musculaire</label>
                <select id="groupe-exo" value={groupeExo} onChange={(e) => setGroupeExo(e.target.value)} className="w-full text-sm capitalize">
                  {GROUPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="type-charge-exo">Type de charge</label>
                <select id="type-charge-exo" value={typeChargeExo} onChange={(e) => setTypeChargeExo(e.target.value)} className="w-full text-sm">
                  {TYPES_CHARGE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="programme-exo">Programme (optionnel)</label>
              <select id="programme-exo" value={programmeExo} onChange={(e) => setProgrammeExo(e.target.value)} className="w-full text-sm">
                <option value="">Aucun</option>
                {programmes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <Button onClick={creerExercice} disabled={creationEnCours || !nomExo} className="w-full">
              {creationEnCours ? "Création…" : "Créer l'exercice"}
            </Button>
          </CardContent>
        </Card>
      )}

      {exercicesFiltres.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--grey)]">Aucun exercice ne correspond.</p>
      )}
      {exercicesFiltres.map((e) => {
        const dejaAjoute = composition.includes(e.id);
        return (
          <Card key={e.id} className={`mb-2 ${dejaAjoute ? "border-[#FF5A1F]/50" : ""}`}>
            <div className="flex items-center gap-3 p-3">
              <MuscleSilhouette groupe={e.groupeMusculaire} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.nom}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge>{e.groupeMusculaire}</Badge>
                  <Badge variant="info">{TYPES_CHARGE.find((t) => t.value === e.typeCharge)?.label ?? e.typeCharge}</Badge>
                </div>
              </div>
              <Button
                variant={dejaAjoute ? "ghost" : "outline"}
                size="icon"
                onClick={() => (dejaAjoute ? retirer(e.id) : ajouter(e.id))}
                aria-label={dejaAjoute ? `Retirer ${e.nom}` : `Ajouter ${e.nom}`}
              >
                {dejaAjoute ? <X className="h-4 w-4 text-[var(--danger)]" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        );
      })}

      {composition.length > 0 && (
        <div className="sticky bottom-20 mt-4 flex justify-center">
          <Badge variant="accent" className="px-4 py-2 text-xs shadow-lg">
            <CalendarPlus className="h-3.5 w-3.5" /> {composition.length} exercice{composition.length > 1 ? "s" : ""} en séance
          </Badge>
        </div>
      )}
    </div>
  );
}
