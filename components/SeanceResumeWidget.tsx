import { Dumbbell, Layers, Repeat, Clock, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import type { ResumeSeance } from "@/lib/domain/services";

export default function SeanceResumeWidget({ resume }: { resume: ResumeSeance }) {
  if (resume.nbSeries === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <CardTitle>Résumé de la séance</CardTitle>
          <CardDescription>Aujourd&apos;hui</CardDescription>
        </div>
        {resume.dominante && (
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF5A1F]/40 bg-[#2a1c10] px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-[#FF5A1F]" aria-hidden="true" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#FF5A1F]">{resume.dominante}</span>
          </div>
        )}
      </CardHeader>
      <div className="grid grid-cols-4 gap-2 p-4 pt-2">
        <Stat icon={Dumbbell} value={resume.nbExercicesDistincts} label="Exercices" />
        <Stat icon={Layers} value={resume.nbSeries} label="Séries" />
        <Stat icon={Repeat} value={resume.nbReps} label="Reps" />
        <Stat icon={Clock} value={`${resume.tempsEstimeMin}min`} label="Estimé" />
      </div>
    </Card>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Dumbbell; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-black/15 py-2.5">
      <Icon className="h-3.5 w-3.5 text-[var(--grey)]" aria-hidden="true" />
      <div className="font-heading text-base font-black leading-none">{value}</div>
      <div className="text-[9px] uppercase text-[var(--grey)]">{label}</div>
    </div>
  );
}
