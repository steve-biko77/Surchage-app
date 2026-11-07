// Tests des conversions de temps.
//
// Le serveur tourne en UTC et la personne vit a Paris. C'est la source de bug
// la plus dangereuse du projet, parce qu'elle est SAISONNIERE : une comparaison
// naive entre l'heure "HH:mm" d'une tache et l'horloge du serveur donne un
// resultat juste la moitie de l'annee et faux l'autre moitie. Un defaut qui
// n'apparait qu'au changement d'heure se decouvre six mois trop tard.
//
// Tous les instants ci-dessous sont ecrits en UTC (suffixe Z) et l'attente est
// calculee a la main. Rappel des regles europeennes : l'heure d'ete court du
// dernier dimanche de mars (29 mars 2026) au dernier dimanche d'octobre
// (25 octobre 2026). Donc janvier et novembre sont a UTC+1, juillet a UTC+2.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { todayISO, heureLocaleParis, minutesLocalesParis } from "./services.ts";

describe("minutesLocalesParis", () => {
  test("en hiver, Paris est a UTC+1", () => {
    // 08:30 UTC + 1 h = 09:30 a Paris = 570 minutes.
    assert.equal(minutesLocalesParis(new Date("2026-01-15T08:30:00Z")), 570);
  });

  test("en ete, Paris est a UTC+2", () => {
    // 08:30 UTC + 2 h = 10:30 a Paris = 630 minutes. Meme heure UTC que le
    // test precedent, resultat different de 60 minutes : c'est tout l'enjeu.
    assert.equal(minutesLocalesParis(new Date("2026-07-15T08:30:00Z")), 630);
  });

  test("le passage a minuit ne produit pas 24 heures", () => {
    // 23:30 UTC le 15 janvier = 00:30 a Paris le 16. Attendu 30, et surtout
    // pas 1470 : certains formateurs rendent "24" plutot que "00" pour minuit.
    assert.equal(minutesLocalesParis(new Date("2026-01-15T23:30:00Z")), 30);
  });

  test("minuit pile vaut zero", () => {
    assert.equal(minutesLocalesParis(new Date("2026-01-15T23:00:00Z")), 0);
  });

  test("l'instant qui a servi a valider la mise en production se relit juste", () => {
    // Le passage du 7 novembre 2026 a 17:32 UTC correspondait a 18:32 a Paris,
    // ce qu'a confirme la reception de la notification. 18 * 60 + 32 = 1112.
    assert.equal(minutesLocalesParis(new Date("2026-11-07T17:32:00Z")), 1112);
  });
});

describe("heureLocaleParis", () => {
  test("rend l'heure locale et non celle du serveur", () => {
    assert.equal(heureLocaleParis(new Date("2026-11-07T17:32:00Z")), 18);
  });

  test("minuit vaut 0, pas 24", () => {
    // La borne basse des relances est `heure < 6` : si minuit rendait 24, la
    // relance passerait la nuit au lieu d'etre bloquee.
    assert.equal(heureLocaleParis(new Date("2026-01-15T23:00:00Z")), 0);
  });

  test("la borne de 22 h se juge en heure locale", () => {
    // 21:00 UTC en hiver = 22:00 a Paris : hors plage, alors que l'horloge du
    // serveur dirait encore 21 h.
    assert.equal(heureLocaleParis(new Date("2026-01-15T21:00:00Z")), 22);
  });
});

describe("todayISO", () => {
  test("la journee bascule a minuit heure de Paris, pas a minuit UTC", () => {
    // 23:30 UTC le 15 janvier est deja le 16 a Paris. Une tache saisie a ce
    // moment-la appartient au 16, et la serie du 15 est close.
    assert.equal(todayISO(new Date("2026-01-15T23:30:00Z")), "2026-01-16");
  });

  test("en ete le decalage est de deux heures", () => {
    // 22:30 UTC le 15 juillet = 00:30 le 16 a Paris.
    assert.equal(todayISO(new Date("2026-07-15T22:30:00Z")), "2026-07-16");
  });

  test("une heure de plein jour reste sur sa date", () => {
    assert.equal(todayISO(new Date("2026-11-07T12:00:00Z")), "2026-11-07");
  });

  test("le format est bien YYYY-MM-DD, avec les zeros", () => {
    // Le format importe : cette chaine sert de cle de comparaison en base.
    assert.equal(todayISO(new Date("2026-03-05T12:00:00Z")), "2026-03-05");
  });
});
