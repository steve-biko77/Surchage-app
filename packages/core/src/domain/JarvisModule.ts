import type { Discipline } from "./Discipline";
import type { Objectif } from "./Objectif";

export abstract class JarvisModule {
  abstract readonly id: string;
  abstract readonly nom: string;
  abstract readonly icone: string;

  /** Toutes les disciplines gérées par ce module (ex: Sport → une seule ; Journal → cinq). */
  abstract getDisciplines(): Promise<Discipline[]>;

  /** Tous les objectifs actifs, tous types confondus, pour agrégation dans le dashboard Jarvis. */
  abstract getObjectifsActifs(): Promise<Objectif[]>;

  /** Appelé une fois par jour par Jarvis pour la décroissance des flammes, etc. */
  abstract onDailyTick(date: string): Promise<void>;

  /** Résumé du jour pour ce module, affiché sur le dashboard global de Jarvis. */
  abstract getResumeDuJour(date: string): Promise<{ label: string; fait: boolean; detail: string }[]>;
}
