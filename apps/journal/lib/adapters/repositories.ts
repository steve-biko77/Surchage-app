// Adapters de sortie - implementent la persistance Journal (Drizzle + Postgres, base dediee).
import { db } from "../db/client";
import {
  disciplinesInstances,
  joursValides,
  objectifs,
  taches,
  tachesRecurrentes,
  notesJour,
  googleAuth,
  journalCalendar,
  nudgeState,
  pushSubscriptions,
} from "../db/schema";
import { eq, and, gte, lte, lt, desc, isNotNull } from "drizzle-orm";

export const disciplinesRepository = {
  async all() {
    return db.select().from(disciplinesInstances);
  },
  async parId(id: string) {
    const [row] = await db.select().from(disciplinesInstances).where(eq(disciplinesInstances.id, id));
    return row ?? null;
  },
};

export const joursValidesRepository = {
  async parDiscipline(disciplineId: string) {
    return db.select().from(joursValides).where(eq(joursValides.disciplineId, disciplineId));
  },
  async parDisciplineEntreDates(disciplineId: string, dateDebut: string, dateFin: string) {
    return db
      .select()
      .from(joursValides)
      .where(
        and(
          eq(joursValides.disciplineId, disciplineId),
          gte(joursValides.date, dateDebut),
          lte(joursValides.date, dateFin)
        )
      );
  },
  /** Vrai si au moins une discipline (n'importe laquelle) a ete validee a cette date. */
  async uneValidationLe(date: string) {
    const [row] = await db.select().from(joursValides).where(eq(joursValides.date, date));
    return !!row;
  },
  async estValide(disciplineId: string, date: string) {
    const [row] = await db
      .select()
      .from(joursValides)
      .where(and(eq(joursValides.disciplineId, disciplineId), eq(joursValides.date, date)));
    return row ?? null;
  },
  /** Bascule la validation d'une discipline pour une date donnee (note optionnelle a la validation). */
  async toggle(disciplineId: string, date: string, note?: string | null) {
    const existant = await joursValidesRepository.estValide(disciplineId, date);
    if (existant) {
      await db.delete(joursValides).where(eq(joursValides.id, existant.id));
      return false;
    }
    await db.insert(joursValides).values({ disciplineId, date, note: note || null });
    await nudgeStateRepository.enregistrerAction();
    return true;
  },
  /**
   * Dates distinctes ou AU MOINS UNE discipline a ete validee, depuis `dateDebut`.
   * C'est la definition de "jour tenu" pour la serie affichee sur l'accueil :
   * cocher une tache ne compte pas, sinon la serie ne vaudrait plus rien.
   */
  async datesValideesDepuis(dateDebut: string) {
    const rows = await db
      .select({ date: joursValides.date })
      .from(joursValides)
      .where(gte(joursValides.date, dateDebut));
    return [...new Set(rows.map((r) => r.date))];
  },
  /** Identifiants des disciplines validees a cette date. */
  async disciplinesValideesLe(date: string) {
    const rows = await db
      .select({ disciplineId: joursValides.disciplineId })
      .from(joursValides)
      .where(eq(joursValides.date, date));
    return rows.map((r) => r.disciplineId);
  },
  /** Toutes les validations avec note, tous jours confondus (pour la page /journal). */
  async avecNotes() {
    return db
      .select({ id: joursValides.id, date: joursValides.date, note: joursValides.note, disciplineId: joursValides.disciplineId })
      .from(joursValides)
      .where(isNotNull(joursValides.note))
      .orderBy(desc(joursValides.date));
  },
};

export const objectifsRepository = {
  async all() {
    return db.select().from(objectifs);
  },
  async parId(id: string) {
    const [row] = await db.select().from(objectifs).where(eq(objectifs.id, id));
    return row ?? null;
  },
  async create(input: {
    nom: string;
    type: "temps" | "metrique";
    disciplineId: string | null;
    deadline?: string | null;
    heuresCible?: number | null;
    unite?: string | null;
    valeurDepart?: number | null;
    valeurCible?: number | null;
    valeurActuelle?: number | null;
    sens?: "croissant" | "decroissant" | null;
    joursParSemaine?: number | null;
  }) {
    const [row] = await db.insert(objectifs).values(input).returning();
    return row;
  },
  /** Rythme visé : le dénominateur de la cohérence hebdomadaire. */
  async setJoursParSemaine(id: string, jours: number | null) {
    const [row] = await db
      .update(objectifs)
      .set({ joursParSemaine: jours })
      .where(eq(objectifs.id, id))
      .returning();
    return row;
  },
  async ajouterMinutes(id: string, minutes: number) {
    const existant = await objectifsRepository.parId(id);
    if (!existant) throw new Error("Objectif introuvable");
    const [row] = await db
      .update(objectifs)
      .set({ minutesInvesties: existant.minutesInvesties + minutes })
      .where(eq(objectifs.id, id))
      .returning();
    return row;
  },
  async setValeurActuelle(id: string, valeur: number) {
    const [row] = await db.update(objectifs).set({ valeurActuelle: valeur }).where(eq(objectifs.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(objectifs).where(eq(objectifs.id, id));
  },
};

/**
 * Traces datées d'avancement, pour la cohérence hebdomadaire.
 *
 * Deux sources, parce que l'app a deux façons de faire avancer un objectif :
 *   - une tâche cochée qui lui est rattachée ;
 *   - une validation de la discipline à laquelle il est rattaché.
 *
 * Limite assumée : `taches` ne garde pas la date de la coche, seulement celle
 * à laquelle la tâche était posée. Une tâche de lundi cochée le jeudi compte
 * donc pour lundi. Corriger ça demanderait une colonne `fait_le` ; en
 * attendant, c'est la date qui fait foi et c'est dit ici plutôt que caché.
 */
export const tracesRepository = {
  async entreDates(dateDebut: string, dateFin: string) {
    const [tachesFaites, validations, objs] = await Promise.all([
      db
        .select({ objectifId: taches.objectifId, date: taches.date })
        .from(taches)
        .where(and(eq(taches.fait, true), gte(taches.date, dateDebut), lte(taches.date, dateFin))),
      db
        .select({ disciplineId: joursValides.disciplineId, date: joursValides.date })
        .from(joursValides)
        .where(and(gte(joursValides.date, dateDebut), lte(joursValides.date, dateFin))),
      db.select({ id: objectifs.id, disciplineId: objectifs.disciplineId }).from(objectifs),
    ]);

    const out: Array<{ objectifId: string; date: string }> = [];
    for (const t of tachesFaites) {
      if (t.objectifId) out.push({ objectifId: t.objectifId, date: t.date });
    }

    // Une discipline peut porter plusieurs objectifs : la valider les fait
    // tous avancer ce jour-là.
    const parDiscipline = new Map<string, string[]>();
    for (const o of objs) {
      if (!o.disciplineId) continue;
      parDiscipline.set(o.disciplineId, [...(parDiscipline.get(o.disciplineId) ?? []), o.id]);
    }
    for (const v of validations) {
      for (const id of parDiscipline.get(v.disciplineId) ?? []) {
        out.push({ objectifId: id, date: v.date });
      }
    }
    return out;
  },
};

export const tachesRepository = {
  async parDate(date: string) {
    return db.select().from(taches).where(eq(taches.date, date));
  },
  async entreDates(dateDebut: string, dateFin: string) {
    return db.select().from(taches).where(and(gte(taches.date, dateDebut), lte(taches.date, dateFin)));
  },
  async create(input: {
    date: string;
    texte: string;
    heure?: string | null;
    objectifId?: string | null;
    tacheRecurrenteId?: string | null;
  }) {
    const [row] = await db.insert(taches).values(input).returning();
    return row;
  },
  /** Vrai si cette tache recurrente a deja ete materialisee pour cette date (idempotence). */
  async existeDejaPourRecurrence(tacheRecurrenteId: string, date: string) {
    const [row] = await db
      .select()
      .from(taches)
      .where(and(eq(taches.tacheRecurrenteId, tacheRecurrenteId), eq(taches.date, date)));
    return !!row;
  },
  /** Taches non faites et non ignorees d'avant `date` -- a fusionner dans l'affichage du jour reel. */
  async reporteesAvant(date: string) {
    return db
      .select()
      .from(taches)
      .where(and(lt(taches.date, date), eq(taches.fait, false), eq(taches.ignoree, false)));
  },
  /** Ecarte definitivement une tache reportee sans effacer qu'elle a existe. */
  async ignorer(id: string) {
    const [row] = await db.update(taches).set({ ignoree: true }).where(eq(taches.id, id)).returning();
    return row;
  },
  async toggleFait(id: string) {
    const [existant] = await db.select().from(taches).where(eq(taches.id, id));
    if (!existant) throw new Error("Tache introuvable");
    const [row] = await db.update(taches).set({ fait: !existant.fait }).where(eq(taches.id, id)).returning();
    if (row.fait) await nudgeStateRepository.enregistrerAction();
    return row;
  },
  async delete(id: string) {
    await db.delete(taches).where(eq(taches.id, id));
  },
};

export const tachesRecurrentesRepository = {
  async all() {
    return db.select().from(tachesRecurrentes);
  },
  async actives() {
    return db.select().from(tachesRecurrentes).where(eq(tachesRecurrentes.actif, true));
  },
  async create(input: {
    texte: string;
    frequence: "journaliere" | "hebdomadaire";
    joursSemaine: number[];
    heure?: string | null;
    objectifId?: string | null;
  }) {
    const [row] = await db.insert(tachesRecurrentes).values(input).returning();
    return row;
  },
  async setActif(id: string, actif: boolean) {
    const [row] = await db.update(tachesRecurrentes).set({ actif }).where(eq(tachesRecurrentes.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(tachesRecurrentes).where(eq(tachesRecurrentes.id, id));
  },
};

export const notesJourRepository = {
  async parDate(date: string) {
    const [row] = await db.select().from(notesJour).where(eq(notesJour.date, date));
    return row ?? null;
  },
  /** Une seule note par jour : cree ou remplace le texte existant. */
  async upsert(date: string, texte: string) {
    const existant = await notesJourRepository.parDate(date);
    if (existant) {
      const [row] = await db
        .update(notesJour)
        .set({ texte, updatedAt: new Date() })
        .where(eq(notesJour.id, existant.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(notesJour).values({ date, texte }).returning();
    return row;
  },
  async toutes() {
    return db.select().from(notesJour).orderBy(desc(notesJour.date));
  },
};

export const googleAuthRepository = {
  async get() {
    const [row] = await db.select().from(googleAuth);
    return row ?? null;
  },
  /** Une seule ligne : upsert le refresh_token recu a la connexion Google. */
  async enregistrerRefreshToken(refreshToken: string) {
    const existant = await googleAuthRepository.get();
    if (existant) {
      const [row] = await db
        .update(googleAuth)
        .set({ refreshToken })
        .where(eq(googleAuth.id, existant.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(googleAuth).values({ refreshToken }).returning();
    return row;
  },
};

export const journalCalendarRepository = {
  async get() {
    const [row] = await db.select().from(journalCalendar);
    return row ?? null;
  },
  async enregistrer(googleCalendarId: string) {
    const [row] = await db.insert(journalCalendar).values({ googleCalendarId }).returning();
    return row;
  },
};

export const nudgeStateRepository = {
  async get() {
    const [row] = await db.select().from(nudgeState);
    return row ?? null;
  },
  /** Cree la ligne unique d'etat au premier acces. */
  async getOuCreer() {
    const existant = await nudgeStateRepository.get();
    if (existant) return existant;
    const [row] = await db.insert(nudgeState).values({}).returning();
    return row;
  },
  /** Marque le moment d'une action d'engagement (tache cochee / discipline validee). */
  async enregistrerAction() {
    const etat = await nudgeStateRepository.getOuCreer();
    await db.update(nudgeState).set({ lastActionAt: new Date() }).where(eq(nudgeState.id, etat.id));
  },
  async enregistrerNotification(message: string) {
    const etat = await nudgeStateRepository.getOuCreer();
    await db
      .update(nudgeState)
      .set({ lastNotifiedAt: new Date(), lastMessage: message })
      .where(eq(nudgeState.id, etat.id));
  },
};

/**
 * Abonnements Web Push. L'endpoint identifie l'appareil : un reabonnement
 * du meme navigateur remplace la ligne au lieu d'en creer une seconde.
 */
export const pushSubscriptionsRepository = {
  async all() {
    return db.select().from(pushSubscriptions);
  },
  async enregistrer(input: { endpoint: string; p256dh: string; auth: string; libelle?: string | null }) {
    const [row] = await db
      .insert(pushSubscriptions)
      .values({
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        libelle: input.libelle ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: input.p256dh, auth: input.auth, libelle: input.libelle ?? null },
      })
      .returning();
    return row;
  },
  async supprimer(endpoint: string) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  },
  async marquerSucces(endpoint: string) {
    await db
      .update(pushSubscriptions)
      .set({ lastSuccessAt: new Date() })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  },
};
