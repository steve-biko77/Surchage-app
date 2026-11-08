import { pgTable, text, real, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

// Schema de persistance du module Journal (adapter Postgres, base Neon distincte de Sport).

export const disciplinesInstances = pgTable("disciplines_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  icone: text("icone").notNull(),
  couleur: text("couleur").notNull(),
  type: text("type").notNull().default("checkin"), // "checkin" | "sport"
});

export const joursValides = pgTable("jours_valides", {
  id: uuid("id").defaultRandom().primaryKey(),
  disciplineId: uuid("discipline_id").references(() => disciplinesInstances.id).notNull(),
  date: text("date").notNull(), // ISO date "2026-08-25"
  note: text("note"), // "Un mot sur cette session ?" -- optionnel
  /**
   * Instant de l'INSERTION, c'est-a-dire l'heure a laquelle la personne a
   * coche -- pas l'heure a laquelle elle a pratique sa discipline. Un rapport
   * qui confond les deux affirme une chose fausse.
   *
   * Pose par defaut depuis le premier jour d'utilisation, donc jamais relu
   * jusqu'ici et pourtant deja riche : le profil d'habitudes est RETROACTIF sur
   * tout l'historique, sans rien avoir a collecter.
   *
   * Deux pieges a connaitre avant d'agreger cette colonne.
   *
   * 1. `toggle` supprime puis reinsere la ligne. Une discipline devalidee puis
   *    revalidee porte donc l'heure de la DERNIERE coche. Meme semantique que
   *    `taches.fait_a`, et pour la meme raison.
   *
   * 2. Une validation posee pour une date PASSEE porte l'heure du moment ou on
   *    l'a rattrapee, qui ne dit rien de la date concernee. Comparer cet
   *    instant -- en heure locale -- a `date` permet de le detecter : s'ils
   *    different, la coche est un rattrapage et son heure n'a aucune valeur
   *    pour un profil d'habitudes. Cette distinction est la matiere meme de
   *    l'ecart entre ce qui est coche et ce qui est fait ; elle appartient au
   *    domaine, pas a ce depot.
   */
  createdAt: timestamp("created_at").defaultNow(),
});

export const objectifs = pgTable("objectifs", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  type: text("type").notNull().default("temps"), // "temps" | "metrique"
  disciplineId: uuid("discipline_id").references(() => disciplinesInstances.id),
  deadline: text("deadline"), // ISO date string, nullable
  /**
   * Rythme vise : nombre de jours par semaine ou l'on compte avancer sur cet
   * objectif. C'est le DENOMINATEUR de la coherence hebdomadaire -- sans lui,
   * "81% de coherence" ne veut rien dire, on ne sait pas 81% de quoi.
   * Nullable : un objectif sans rythme fixe n'affiche simplement pas la
   * metrique, plutot que d'en inventer une.
   */
  joursParSemaine: integer("jours_par_semaine"),
  heuresCible: real("heures_cible"),
  minutesInvesties: integer("minutes_investies").notNull().default(0),
  // Objectif "metrique" generique (Elo, pages, km, kg...) -- remplace poidsCible/meilleurPoidsAtteint.
  unite: text("unite"),
  valeurDepart: real("valeur_depart"),
  valeurCible: real("valeur_cible"),
  valeurActuelle: real("valeur_actuelle"),
  sens: text("sens"), // "croissant" | "decroissant"
  createdAt: timestamp("created_at").defaultNow(),
});

export const tachesRecurrentes = pgTable("taches_recurrentes", {
  id: uuid("id").defaultRandom().primaryKey(),
  texte: text("texte").notNull(),
  frequence: text("frequence").notNull(), // "journaliere" | "hebdomadaire"
  joursSemaine: integer("jours_semaine").array().notNull().default([]), // 1=lundi..7=dimanche, vide si journaliere
  heure: text("heure"), // "HH:mm", nullable
  objectifId: uuid("objectif_id").references(() => objectifs.id),
  actif: boolean("actif").notNull().default(true),
});

export const taches = pgTable("taches", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  texte: text("texte").notNull(),
  heure: text("heure"), // "HH:mm", nullable (tache sans heure fixe = checklist)
  fait: boolean("fait").notNull().default(false),
  /**
   * Instant de la coche, ou null.
   *
   * C'est la colonne qui rend l'engagement mesurable : sans elle, `fait` est un
   * booleen nu qui dit qu'une chose a ete faite mais jamais quand. Tout ce qui
   * se calcule sur une heure -- profil d'habitudes, ecart entre ce qui est
   * coche et ce qui est fait, rapport mensuel -- part d'ici.
   *
   * Nullable, et ce n'est pas un detail : `null` couvre DEUX cas qui doivent
   * rester distinguables d'une tache faite avec une heure, et l'un de l'autre
   * par le booleen `fait` :
   *   - fait = false -> pas faite ;
   *   - fait = true  -> faite avant que l'on sache mesurer.
   *
   * Aucun rattrapage n'a ete tente sur l'historique. Remplir ce champ avec la
   * date de la tache a minuit aurait evite les trous, au prix de fabriquer des
   * coches a 00h00 qui auraient fausse le profil d'heures pour toujours. Un
   * trou se voit et se comprend ; une donnee inventee, non.
   *
   * SEULE colonne de ce schema declaree AVEC fuseau, et c'est delibere.
   * Verifie, pas suppose : pour un meme instant (11:30 UTC = 12:30 a Paris),
   * node-postgres envoie "11:30:00+00:00" depuis un serveur en UTC et
   * "12:30:00+01:00" depuis une machine en Europe/Paris. Une colonne
   * `timestamp` SANS fuseau jette le decalage et garde l'heure murale : le meme
   * instant y est donc stocke differemment selon l'endroit ou le code tourne,
   * et relu faux d'une a deux heures selon la saison. Avec fuseau, l'instant se
   * relit identique partout.
   *
   * Pour les autres colonnes d'horodatage, l'ecart est sans consequence : ce
   * sont des marques internes. Celle-ci est la seule dont l'HEURE EXACTE est la
   * donnee -- c'est tout son objet -- donc la seule ou l'ambiguite est
   * inacceptable. L'alignement des autres est un ticket a part.
   */
  faitA: timestamp("fait_a", { withTimezone: true }),
  objectifId: uuid("objectif_id").references(() => objectifs.id),
  tacheRecurrenteId: uuid("tache_recurrente_id").references(() => tachesRecurrentes.id),
  ignoree: boolean("ignoree").notNull().default(false), // reportee indefiniment mais explicitement ecartee par l'utilisateur
  /**
   * Instant d'envoi du rappel, ou null si aucun rappel n'est encore parti.
   *
   * C'est ce qui rend le balayage idempotent : la route passe toutes les cinq
   * minutes et envoie ce qui etait du depuis son dernier passage, sans jamais
   * renvoyer deux fois. Nullable a dessein -- null signifie "jamais notifiee",
   * et c'est le cas de toutes les taches anterieures a cette colonne.
   *
   * Une tache dont l'heure est passee depuis trop longtemps est marquee ici
   * SANS notification : elle est classee traitee plutot que notifiee en retard.
   */
  rappelEnvoyeA: timestamp("rappel_envoye_a"),
});

export const notesJour = pgTable("notes_jour", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull().unique(), // une seule note par jour, upsert par date
  texte: text("texte").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Refresh token OAuth Google (une seule ligne, app mono-utilisateur). Jamais loggee en clair. */
export const googleAuth = pgTable("google_auth", {
  id: uuid("id").defaultRandom().primaryKey(),
  refreshToken: text("refresh_token").notNull(),
});

/** Calendrier Google secondaire "Journal — Rappels" (une seule ligne). */
export const journalCalendar = pgTable("journal_calendar", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleCalendarId: text("google_calendar_id").notNull(),
});

/** Etat global du nudge adaptatif (une seule ligne, app mono-utilisateur). */
export const nudgeState = pgTable("nudge_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  lastNotifiedAt: timestamp("last_notified_at"),
  lastMessage: text("last_message"),
  lastActionAt: timestamp("last_action_at"),
});

/**
 * Abonnements Web Push. Une ligne par appareil ayant accepte les
 * notifications : l'endpoint fourni par le navigateur, plus les deux cles
 * de chiffrement qu'il impose (p256dh et auth). L'endpoint est unique,
 * c'est lui qui identifie l'appareil.
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  /** Pour reconnaitre l'appareil dans la liste ("iPhone de Steve"). */
  libelle: text("libelle"),
  createdAt: timestamp("created_at").defaultNow(),
  /** Dernier envoi reussi : sert a reperer les abonnements morts. */
  lastSuccessAt: timestamp("last_success_at"),
});
