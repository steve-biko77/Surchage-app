"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Dumbbell, Check } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { todayISO } from "@/lib/domain/services";

const MODELES_KEY = "surcharge_modeles_seance";

type Modele = { nom: string; exerciceIds: string[] };
type Exercice = { id: string; groupeMusculaire: string };

export default function CarrouselModeles({ exercices }: { exercices: Exercice[] }) {
  const router = useRouter();
  const [modeles, setModeles] = useState<Modele[] | null>(null);
  const [choixEnCours, setChoixEnCours] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MODELES_KEY);
      setModeles(raw ? JSON.parse(raw) : []);
    } catch {
      setModeles([]);
    }
  }, []);

  if (!modeles || modeles.length === 0) return null;

  const groupeParExercice = new Map(exercices.map((e) => [e.id, e.groupeMusculaire]));

  function dominante(exerciceIds: string[]) {
    const compte: Record<string, number> = {};
    for (const id of exerciceIds) {
      const g = groupeParExercice.get(id);
      if (!g) continue;
      compte[g] = (compte[g] ?? 0) + 1;
    }
    const entries = Object.entries(compte).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? null;
  }

  async function choisir(i: number, m: Modele) {
    setChoixEnCours(i);
    await fetch("/api/seances-planifiees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayISO(), nom: m.nom, exerciceIds: m.exerciceIds }),
    });
    setChoixEnCours(null);
    router.refresh();
  }

  return (
    <div className="mb-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--grey)]">
        <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
        Choisis ta séance du jour
      </h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory">
        {modeles.map((m, i) => {
          const groupe = dominante(m.exerciceIds);
          return (
            <Card key={i} className="w-56 shrink-0 snap-start border-[#3B82C4]/30">
              <CardContent className="pt-4">
                <p className="truncate font-heading text-base font-bold">{m.nom}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge>
                    <Dumbbell className="h-3 w-3" aria-hidden="true" />
                    {m.exerciceIds.length} exercice{m.exerciceIds.length > 1 ? "s" : ""}
                  </Badge>
                  {groupe && <Badge variant="info" className="capitalize">{groupe}</Badge>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={choixEnCours !== null}
                  onClick={() => choisir(i, m)}
                >
                  {choixEnCours === i ? "…" : <>Choisir <Check className="h-3.5 w-3.5" /></>}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
