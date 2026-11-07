// Tests du tri et de la composition des rappels.
//
// Ce module est pur par construction -- aucune base, aucun reseau, aucune
// horloge implicite -- et c'etait tout l'interet de l'ecrire ainsi. Il manquait
// la contrepartie : des tests qui survivent a la session ou ils ont ete ecrits.
//
// Pourquoi ce domaine plus qu'un autre : un rappel qui echoue ne se voit pas.
// Il se manifeste par une notification qui N'ARRIVE PAS, c'est-a-dire par du
// silence -- exactement ce qui a laisse le defaut d'origine en place pendant
// des semaines. Un domaine dont les pannes sont muettes doit etre tenu par des
// tests, pas par l'observation.
//
// Une mise en garde, tiree d'une erreur reelle : en verifiant ce module pour la
// premiere fois, l'attente posee etait fausse (une tache de 04:00 jugee perimee
// a 05:32, alors qu'elle n'accusait que 92 minutes de retard). Le code avait
// raison, l'attente avait tort. Chaque nombre ci-dessous est donc calcule a la
// main, et le calcul est ecrit en commentaire quand il n'est pas evident.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  trierRappels,
  composerNotifications,
  PEREMPTION_MINUTES,
  MAX_NOTIFICATIONS_INDIVIDUELLES,
  type TacheProgrammee,
} from "./rappels.ts";

/** Fabrique une tache ; l'identifiant reprend l'heure, pour lire les echecs. */
function tache(heure: string | null, texte = "faire la chose"): TacheProgrammee {
  return { id: heure ?? "sans-heure", texte, heure };
}

/** Minutes depuis minuit, pour ecrire les instants en clair dans les tests. */
function a(heure: string): number {
  const [hh, mm] = heure.split(":").map(Number);
  return hh * 60 + mm;
}

const heures = (taches: TacheProgrammee[]) => taches.map((t) => t.heure);

describe("trierRappels", () => {
  test("une heure pas encore venue n'est ni due ni perimee", () => {
    // 10:30 attendu, il est 10:00 : retard de -30.
    const { aEnvoyer, perimees } = trierRappels([tache("10:30")], a("10:00"));
    assert.deepEqual(aEnvoyer, []);
    assert.deepEqual(perimees, []);
  });

  test("une heure qui vient tout juste de passer est due", () => {
    // Retard de 0 minute : la borne basse est inclusive.
    const { aEnvoyer, perimees } = trierRappels([tache("10:00")], a("10:00"));
    assert.equal(aEnvoyer.length, 1);
    assert.deepEqual(perimees, []);
  });

  // La borne de peremption est le seul endroit du module ou une erreur
  // d'inegalite peut se cacher, et elle serait invisible : elle ne ferait
  // disparaitre que les rappels situes pile sur le seuil.
  test("la borne de peremption est inclusive : 120 minutes de retard est encore due", () => {
    const { aEnvoyer, perimees } = trierRappels([tache("08:00")], a("10:00"));
    assert.deepEqual(heures(aEnvoyer), ["08:00"]);
    assert.deepEqual(perimees, []);
  });

  test("119 minutes de retard est due", () => {
    // 10:00 moins 119 minutes = 08:01.
    const { aEnvoyer, perimees } = trierRappels([tache("08:01")], a("10:00"));
    assert.deepEqual(heures(aEnvoyer), ["08:01"]);
    assert.deepEqual(perimees, []);
  });

  test("121 minutes de retard est perimee", () => {
    // 10:00 moins 121 minutes = 07:59.
    const { aEnvoyer, perimees } = trierRappels([tache("07:59")], a("10:00"));
    assert.deepEqual(aEnvoyer, []);
    assert.deepEqual(heures(perimees), ["07:59"]);
  });

  test("le seuil de peremption se laisse resserrer par l'appelant", () => {
    // 60 minutes de retard, seuil ramene a 30.
    const { aEnvoyer, perimees } = trierRappels([tache("09:00")], a("10:00"), 30);
    assert.deepEqual(aEnvoyer, []);
    assert.deepEqual(heures(perimees), ["09:00"]);
  });

  test("une tache sans heure est ecartee, pas classee perimee", () => {
    // Le point important : elle ne doit pas finir dans `perimees`, sinon elle
    // serait marquee comme traitee et perdrait son rappel pour de bon le jour
    // ou une heure lui serait ajoutee.
    const { aEnvoyer, perimees } = trierRappels([tache(null)], a("23:00"));
    assert.deepEqual(aEnvoyer, []);
    assert.deepEqual(perimees, []);
  });

  test("les dues sortent dans l'ordre des heures, pas dans celui de l'entree", () => {
    const { aEnvoyer } = trierRappels(
      [tache("09:30"), tache("08:30"), tache("09:00")],
      a("10:00")
    );
    assert.deepEqual(heures(aEnvoyer), ["08:30", "09:00", "09:30"]);
  });

  test("un meme passage repartit les trois cas sans en perdre aucun", () => {
    // Il est midi. Retards : 11:00 -> 60 (due), 09:00 -> 180 (perimee),
    // 10:00 -> 120 (due, borne incluse), 14:00 -> -120 (pas encore),
    // sans heure -> ecartee.
    const { aEnvoyer, perimees } = trierRappels(
      [tache("11:00"), tache("09:00"), tache("10:00"), tache("14:00"), tache(null)],
      a("12:00")
    );
    assert.deepEqual(heures(aEnvoyer), ["10:00", "11:00"]);
    assert.deepEqual(heures(perimees), ["09:00"]);
  });

  test("aucune liste n'est partagee avec l'entree", () => {
    // Les listes rendues sont consommees puis marquees en base : si elles
    // aliasaient l'entree, une modification en aval serait invisible ici.
    const entree = [tache("09:00")];
    const { aEnvoyer } = trierRappels(entree, a("10:00"));
    assert.notEqual(aEnvoyer, entree);
  });

  test("le seuil par defaut vaut bien deux heures", () => {
    assert.equal(PEREMPTION_MINUTES, 120);
  });
});

describe("composerNotifications", () => {
  test("aucune tache ne produit aucun message, et surtout pas un message vide", () => {
    assert.deepEqual(composerNotifications([]), []);
  });

  test("une tache donne un message portant son heure et son texte", () => {
    const [n, ...reste] = composerNotifications([tache("12:30", "manger")]);
    assert.deepEqual(reste, []);
    assert.equal(n.titre, "12:30");
    assert.equal(n.corps, "manger");
  });

  test("jusqu'au plafond, un message par tache", () => {
    const dues = [tache("09:00", "a"), tache("10:00", "b"), tache("11:00", "c")];
    assert.equal(dues.length, MAX_NOTIFICATIONS_INDIVIDUELLES);
    const messages = composerNotifications(dues);
    assert.equal(messages.length, 3);
    assert.deepEqual(
      messages.map((m) => m.titre),
      ["09:00", "10:00", "11:00"]
    );
  });

  test("au-dela du plafond, un seul message groupe", () => {
    const messages = composerNotifications([
      tache("09:00", "a"),
      tache("10:00", "b"),
      tache("11:00", "c"),
      tache("12:00", "d"),
    ]);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].titre, "4 tâches à faire");
    assert.equal(messages[0].corps, "09:00 a · 10:00 b · 11:00 c · 12:00 d");
  });

  test("la bascule se fait entre le plafond et le plafond plus un", () => {
    const faire = (n: number) =>
      composerNotifications(
        Array.from({ length: n }, (_, i) => tache(`0${i}:00`, `t${i}`))
      );
    const plafond = MAX_NOTIFICATIONS_INDIVIDUELLES;
    assert.equal(faire(plafond).length, plafond);
    assert.equal(faire(plafond + 1).length, 1);
  });

  test("le plafond se laisse abaisser par l'appelant", () => {
    const dues = [tache("09:00", "a"), tache("10:00", "b")];
    assert.equal(composerNotifications(dues, 2).length, 2);
    assert.equal(composerNotifications(dues, 1).length, 1);
  });

  test("le message groupe nomme toutes les taches, aucune n'est tue", () => {
    const dues = Array.from({ length: 8 }, (_, i) => tache(`1${i % 10}:00`, `tache ${i}`));
    const [groupe] = composerNotifications(dues);
    for (const t of dues) assert.ok(groupe.corps.includes(t.texte), `absente : ${t.texte}`);
  });
});
