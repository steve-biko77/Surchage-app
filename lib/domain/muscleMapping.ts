import type { Muscle as MuscleLib } from "react-body-highlighter";
import type { MuscleDetail } from "./types";

/** Libelle FR affiche pour chaque muscle du referentiel detaille */
export const MUSCLE_LABELS: Record<MuscleDetail, string> = {
  deltoide_anterieur: "Deltoïde antérieur",
  deltoide_lateral: "Deltoïde latéral",
  deltoide_posterieur: "Deltoïde postérieur",
  trapeze: "Trapèze",
  grand_dorsal: "Grand dorsal",
  pectoraux: "Pectoraux",
  biceps: "Biceps",
  triceps: "Triceps",
  avant_bras: "Avant-bras",
  abdominaux: "Abdominaux",
  quadriceps: "Quadriceps",
  ischio_jambiers: "Ischio-jambiers",
  fessiers: "Fessiers",
  mollets: "Mollets",
};

/**
 * Correspondance muscle detaille (FR) -> muscle reel du modele react-body-highlighter.
 * La librairie n'a pas de slug dedie pour le deltoide lateral (seuls front/back existent) :
 * on l'approxime sur la vue anterieure. C'est une limite connue du rendu corporel,
 * compensee par le libelle textuel exact affiche a cote (liste "zone ciblee").
 */
export const MUSCLE_VERS_LIB: Record<MuscleDetail, { view: "anterior" | "posterior"; slug: MuscleLib }> = {
  deltoide_anterieur: { view: "anterior", slug: "front-deltoids" },
  deltoide_lateral: { view: "anterior", slug: "front-deltoids" },
  deltoide_posterieur: { view: "posterior", slug: "back-deltoids" },
  trapeze: { view: "posterior", slug: "trapezius" },
  grand_dorsal: { view: "posterior", slug: "upper-back" },
  pectoraux: { view: "anterior", slug: "chest" },
  biceps: { view: "anterior", slug: "biceps" },
  triceps: { view: "posterior", slug: "triceps" },
  avant_bras: { view: "anterior", slug: "forearm" },
  abdominaux: { view: "anterior", slug: "abs" },
  quadriceps: { view: "anterior", slug: "quadriceps" },
  ischio_jambiers: { view: "posterior", slug: "hamstring" },
  fessiers: { view: "posterior", slug: "gluteal" },
  mollets: { view: "posterior", slug: "calves" },
};
