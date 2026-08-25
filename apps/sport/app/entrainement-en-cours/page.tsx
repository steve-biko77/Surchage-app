export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resoudreSeanceDuJour } from "@/lib/adapters/seanceDuJour";
import ExerciseCard from "@/components/ExerciseCard";
import { Progress } from "@/components/ui/progress";

export default async function EntrainementEnCoursPage() {
  const { jour, nomSeance, exercicesAvecCible } = await resoudreSeanceDuJour();

  if (!nomSeance || exercicesAvecCible.length === 0) {
    return (
      <div>
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#3B82C4]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
        </Link>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)] py-12 text-center text-[var(--grey)]">
          <p>Aucune séance en cours pour aujourd&apos;hui.</p>
        </div>
      </div>
    );
  }

  const nbTotal = exercicesAvecCible.length;
  const nbCompletes = exercicesAvecCible.filter((e) => e.seriesAujourdhui.length > 0).length;
  const idProchain = exercicesAvecCible.find((e) => e.seriesAujourdhui.length === 0)?.id ?? null;
  const pct = Math.round((nbCompletes / nbTotal) * 100);

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#3B82C4]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
      </Link>

      <p className="text-[11px] uppercase tracking-widest text-[var(--grey)] capitalize">{jour}</p>
      <h2 className="font-heading text-2xl font-bold leading-tight">{nomSeance}</h2>

      <div className="mt-3 mb-5 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium">
            {nbCompletes} / {nbTotal} exercices complétés
          </span>
          <span className="font-heading text-lg font-black text-[#FF5A1F]">{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>

      {exercicesAvecCible.map((exo) => (
        <ExerciseCard key={exo.id} exercice={exo} estProchain={exo.id === idProchain} rayerSiComplete />
      ))}
    </div>
  );
}
