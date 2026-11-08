// Tests du profil d'heures et du mode de coche.
//
// Deux familles de défauts sont visées, toutes deux silencieuses.
//
// Le fuseau d'abord : le serveur tourne en UTC, la personne vit à Paris, et
// une heure mal convertie décale tout le profil d'une à deux heures selon la
// saison. Chaque instant ci-dessous est donc écrit en UTC, avec l'heure
// parisienne attendue en commentaire. Rappel : l'heure d'été 2026 court du
// 29 mars au 25 octobre, donc janvier et novembre sont à UTC+1, juillet à
// UTC+2.
//
// Le franchissement de minuit ensuite : les sessions se découpent sur les
// instants absolus, jamais sur les minutes depuis minuit. Un tri sur l'heure
// murale placerait une coche de 00h10 AVANT celle de 23h50 et calculerait la
// pause à l'envers. Le cas est testé explicitement.
//
// Chaque attente est calculée à la main. Si un test échoue, soupçonner
// l'attente avant le code.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  estHorsJour,
  trierPourProfil,
  profilDHeures,
  profilsParSource,
  rythmeDuJour,
  rythmeParJour,
  PAUSE_ENTRE_SESSIONS_MINUTES,
  MINIMUM_COCHES_POUR_CONCLURE,
  type Coche,
  type CocheBrute,
  type SourceDeCoche,
} from "./engagement";

/** Une coche horodatée. `utc` est l'instant, `jour` la journée décrite. */
function coche(jour: string, utc: string, source: SourceDeCoche = "tache"): Coche {
  return { jour, instant: new Date(utc), source };
}

describe("estHorsJour", () => {
  test("une coche posée le soir du jour qu'elle décrit est dans son jour", () => {
    // 22:30 UTC = 23:30 à Paris, toujours le 7.
    assert.equal(estHorsJour(coche("2026-11-07", "2026-11-07T22:30:00Z")), false);
  });

  test("une coche posée deux semaines après est hors jour", () => {
    assert.equal(estHorsJour(coche("2026-08-25", "2026-09-09T05:26:49Z")), true);
  });

  test("minuit est une frontière dure, et c'est un choix assumé", () => {
    // 23:30 UTC le 7 = 00:30 à Paris le 8. La coche décrit le 7 mais a été
    // posée le 8 : elle est donc hors jour, et son heure sort du profil.
    // Discutable -- la personne, elle, vit cela comme la même soirée -- mais
    // une frontière franche vaut mieux qu'un délai de grâce arbitraire. À
    // rouvrir avec PROD-29 si les rapports s'en trouvent faussés.
    assert.equal(estHorsJour(coche("2026-11-07", "2026-11-07T23:30:00Z")), true);
  });

  test("le jugement se fait en heure locale, pas en UTC", () => {
    // 23:30 UTC le 7 juillet = 01:30 à Paris le 8 (UTC+2). Une comparaison
    // faite en UTC conclurait « même jour » à tort.
    assert.equal(estHorsJour(coche("2026-07-07", "2026-07-07T23:30:00Z")), true);
  });
});

describe("trierPourProfil", () => {
  test("sépare les exploitables des deux sortes de rejets, et les compte", () => {
    const brutes: CocheBrute[] = [
      coche("2026-11-07", "2026-11-07T21:00:00Z"),
      coche("2026-11-07", "2026-11-07T21:10:00Z"),
      coche("2026-08-25", "2026-09-09T05:26:49Z"), // hors jour
      { jour: "2026-10-01", instant: null, source: "tache" }, // avant l'horodatage
    ];
    const { exploitables, horsJour, sansHeure } = trierPourProfil(brutes);
    assert.equal(exploitables.length, 2);
    assert.equal(horsJour, 1);
    assert.equal(sansHeure, 1);
  });

  test("une liste vide ne rejette rien et n'invente rien", () => {
    assert.deepEqual(trierPourProfil([]), { exploitables: [], horsJour: 0, sansHeure: 0 });
  });
});

describe("profilDHeures", () => {
  test("aucune coche : vingt-quatre zéros et aucune heure de pointe", () => {
    const p = profilDHeures([]);
    assert.equal(p.parHeure.length, 24);
    assert.equal(p.parHeure.reduce((a, b) => a + b, 0), 0);
    assert.equal(p.total, 0);
    assert.equal(p.heureDePointe, null);
  });

  test("l'heure retenue est l'heure parisienne, en hiver", () => {
    // 21:30 UTC = 22:30 à Paris.
    const p = profilDHeures([coche("2026-01-15", "2026-01-15T21:30:00Z")]);
    assert.equal(p.parHeure[22], 1);
    assert.equal(p.heureDePointe, 22);
  });

  test("l'heure retenue est l'heure parisienne, en été", () => {
    // 20:30 UTC = 22:30 à Paris. Heure UTC différente du test précédent,
    // même heure locale : c'est exactement ce que le fuseau doit absorber.
    const p = profilDHeures([coche("2026-07-15", "2026-07-15T20:30:00Z")]);
    assert.equal(p.parHeure[22], 1);
    assert.equal(p.heureDePointe, 22);
  });

  test("l'heure de pointe est la case la plus chargée", () => {
    const p = profilDHeures([
      coche("2026-11-07", "2026-11-07T20:00:00Z"), // 21 h
      coche("2026-11-07", "2026-11-07T21:00:00Z"), // 22 h
      coche("2026-11-07", "2026-11-07T21:30:00Z"), // 22 h
    ]);
    assert.equal(p.parHeure[21], 1);
    assert.equal(p.parHeure[22], 2);
    assert.equal(p.heureDePointe, 22);
    assert.equal(p.total, 3);
  });

  test("à égalité, la première heure de la journée l'emporte", () => {
    // Départage arbitraire mais déterministe : sans règle, l'heure de pointe
    // changerait selon l'ordre d'arrivée des lignes.
    const p = profilDHeures([
      coche("2026-11-07", "2026-11-07T21:00:00Z"), // 22 h
      coche("2026-11-07", "2026-11-07T20:00:00Z"), // 21 h
    ]);
    assert.equal(p.heureDePointe, 21);
  });
});

describe("profilsParSource", () => {
  test("tâches et disciplines ne sont jamais additionnées", () => {
    const r = profilsParSource([
      coche("2026-11-07", "2026-11-07T21:00:00Z", "tache"), // 22 h
      coche("2026-11-07", "2026-11-07T21:10:00Z", "discipline"), // 22 h
      coche("2026-11-07", "2026-11-07T21:20:00Z", "discipline"), // 22 h
    ]);
    assert.equal(r.tache.total, 1);
    assert.equal(r.discipline.total, 2);
    assert.equal(r.tache.parHeure[22], 1);
    assert.equal(r.discipline.parHeure[22], 2);
  });

  test("les rejets sont remontés avec le résultat, jamais tus", () => {
    const r = profilsParSource([
      coche("2026-11-07", "2026-11-07T21:00:00Z"),
      coche("2026-08-25", "2026-09-09T05:26:49Z"),
      { jour: "2026-10-01", instant: null, source: "discipline" },
    ]);
    assert.equal(r.horsJour, 1);
    assert.equal(r.sansHeure, 1);
    assert.equal(r.tache.total + r.discipline.total, 1);
  });
});

describe("rythmeDuJour", () => {
  const jour = "2026-11-07";

  test("aucune coche : indéterminé, zéro session", () => {
    assert.deepEqual(rythmeDuJour(jour, []), {
      jour,
      mode: "indetermine",
      sessions: 0,
      coches: 0,
    });
  });

  test("une seule coche : une session, mais rien à conclure", () => {
    const r = rythmeDuJour(jour, [coche(jour, "2026-11-07T21:00:00Z")]);
    assert.equal(r.sessions, 1);
    assert.equal(r.coches, 1);
    assert.equal(r.mode, "indetermine");
  });

  test("deux coches ne suffisent pas : un seul intervalle n'est pas un rythme", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T08:00:00Z"),
      coche(jour, "2026-11-07T21:00:00Z"),
    ]);
    assert.equal(r.sessions, 2);
    assert.equal(r.mode, "indetermine");
  });

  test("trois coches rapprochées : un bloc", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T21:00:00Z"), // 22:00
      coche(jour, "2026-11-07T21:05:00Z"), // 22:05
      coche(jour, "2026-11-07T21:12:00Z"), // 22:12
    ]);
    assert.equal(r.sessions, 1);
    assert.equal(r.mode, "en-bloc");
    assert.equal(r.coches, 3);
  });

  test("trois coches à la même minute : un bloc, pas une erreur", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T21:00:00Z"),
      coche(jour, "2026-11-07T21:00:00Z"),
      coche(jour, "2026-11-07T21:00:00Z"),
    ]);
    assert.equal(r.sessions, 1);
    assert.equal(r.mode, "en-bloc");
  });

  test("deux passages séparés dans la journée : au fil de l'eau", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T08:00:00Z"), // 09:00
      coche(jour, "2026-11-07T08:05:00Z"), // 09:05
      coche(jour, "2026-11-07T21:00:00Z"), // 22:00
    ]);
    assert.equal(r.sessions, 2);
    assert.equal(r.mode, "au-fil-de-l-eau");
  });

  // La borne de la pause est le seul endroit du module où une inégalité peut
  // se tromper sans que rien ne le signale.
  test("une pause de 90 minutes pile ouvre une nouvelle session", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T19:00:00Z"), // 20:00
      coche(jour, "2026-11-07T20:30:00Z"), // 21:30, soit 90 min plus tard
      coche(jour, "2026-11-07T20:35:00Z"), // 21:35
    ]);
    assert.equal(r.sessions, 2);
    assert.equal(r.mode, "au-fil-de-l-eau");
  });

  test("une pause de 89 minutes reste dans la même session", () => {
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T19:00:00Z"), // 20:00
      coche(jour, "2026-11-07T20:29:00Z"), // 21:29, soit 89 min plus tard
      coche(jour, "2026-11-07T20:34:00Z"), // 21:34
    ]);
    assert.equal(r.sessions, 1);
    assert.equal(r.mode, "en-bloc");
  });

  test("une soirée qui déborde sur minuit reste une seule session", () => {
    // 22:30, 22:50 et 23:10 UTC = 23:30, 23:50 et 00:10 à Paris. Un tri sur
    // l'heure murale placerait 00:10 en tête et verrait une pause de plus de
    // vingt-trois heures. Sur les instants, les écarts font vingt minutes.
    const r = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T22:30:00Z"),
      coche(jour, "2026-11-07T22:50:00Z"),
      coche(jour, "2026-11-07T23:10:00Z"),
    ]);
    assert.equal(r.sessions, 1);
    assert.equal(r.mode, "en-bloc");
  });

  test("l'ordre d'arrivée des coches ne change pas le résultat", () => {
    const desordre = rythmeDuJour(jour, [
      coche(jour, "2026-11-07T21:00:00Z"),
      coche(jour, "2026-11-07T08:00:00Z"),
      coche(jour, "2026-11-07T08:05:00Z"),
    ]);
    assert.equal(desordre.sessions, 2);
    assert.equal(desordre.mode, "au-fil-de-l-eau");
  });

  test("les seuils se laissent régler par l'appelant", () => {
    const coches = [
      coche(jour, "2026-11-07T19:00:00Z"), // 20:00
      coche(jour, "2026-11-07T20:00:00Z"), // 21:00, une heure plus tard
      coche(jour, "2026-11-07T20:05:00Z"),
    ];
    assert.equal(rythmeDuJour(jour, coches, 90).sessions, 1);
    assert.equal(rythmeDuJour(jour, coches, 30).sessions, 2);
    assert.equal(rythmeDuJour(jour, coches, 90, 4).mode, "indetermine");
  });

  test("les valeurs par défaut sont bien celles qui ont été arbitrées", () => {
    assert.equal(PAUSE_ENTRE_SESSIONS_MINUTES, 90);
    assert.equal(MINIMUM_COCHES_POUR_CONCLURE, 3);
  });
});

describe("rythmeParJour", () => {
  test("regroupe par journée décrite, dans l'ordre des dates", () => {
    const r = rythmeParJour([
      coche("2026-11-07", "2026-11-07T21:00:00Z"),
      coche("2026-11-05", "2026-11-05T21:00:00Z"),
      coche("2026-11-05", "2026-11-05T21:10:00Z"),
      coche("2026-11-05", "2026-11-05T21:20:00Z"),
    ]);
    assert.deepEqual(
      r.jours.map((j) => j.jour),
      ["2026-11-05", "2026-11-07"]
    );
    assert.equal(r.jours[0].mode, "en-bloc");
    assert.equal(r.jours[0].coches, 3);
    assert.equal(r.jours[1].mode, "indetermine");
  });

  test("tâches et disciplines comptent dans la même session", () => {
    // Décision explicite : le rythme est celui de la personne, pas celui d'un
    // type d'objet. Séparer les deux couperait une session réelle en deux.
    const r = rythmeParJour([
      coche("2026-11-07", "2026-11-07T21:00:00Z", "tache"),
      coche("2026-11-07", "2026-11-07T21:05:00Z", "discipline"),
      coche("2026-11-07", "2026-11-07T21:10:00Z", "discipline"),
    ]);
    assert.equal(r.jours.length, 1);
    assert.equal(r.jours[0].sessions, 1);
    assert.equal(r.jours[0].mode, "en-bloc");
  });

  test("une journée sans aucune coche exploitable n'apparaît pas", () => {
    // Elle n'est pas rendue avec un mode « indeterminé » : il n'y a rien à
    // dire d'une journée dont on n'a aucune trace, et une ligne vide dans un
    // rapport se lit comme une journée ratée.
    const r = rythmeParJour([{ jour: "2026-10-01", instant: null, source: "tache" }]);
    assert.deepEqual(r.jours, []);
    assert.equal(r.sansHeure, 1);
  });

  test("les rejets sont comptés une fois pour l'ensemble de la fenêtre", () => {
    const r = rythmeParJour([
      coche("2026-11-07", "2026-11-07T21:00:00Z"),
      coche("2026-08-25", "2026-09-09T05:26:49Z"),
      coche("2026-08-26", "2026-09-09T05:26:49Z"),
      { jour: "2026-10-01", instant: null, source: "tache" },
    ]);
    assert.equal(r.horsJour, 2);
    assert.equal(r.sansHeure, 1);
    assert.equal(r.jours.length, 1);
  });
});
