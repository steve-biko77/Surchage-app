#!/usr/bin/env node
/**
 * Vérificateur de contraste WCAG sur les tokens de app/globals.css.
 *
 *   node scripts/check-contrast.mjs
 *
 * Lit les variables CSS du bloc :root, calcule les rapports de contraste
 * des paires qui comptent, et sort en code 1 si l'une passe sous son seuil.
 * À lancer après toute modification de palette — un écart de teinte peut
 * casser un rapport sans que l'œil le voie.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(racine, "app/globals.css"), "utf8");

const tokens = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  let hex = m[2];
  if (hex.length === 4) hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
  tokens[m[1]] = hex.slice(0, 7);
}

const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contraste = (a, b) => {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
};

/** [texte, fond, description, seuil]
 *  4.5 = texte courant (AA) · 3 = gros texte et éléments d'interface */
const PAIRES = [
  ["chalk", "bg", "texte principal sur fond", 4.5],
  ["chalk", "bg-card", "texte principal sur carte", 4.5],
  ["chalk", "bg-card-2", "texte principal sur champ", 4.5],
  ["grey", "bg-card", "texte secondaire sur carte", 4.5],
  ["accent-text", "bg", "texte accentué sur fond", 4.5],
  ["accent-text", "bg-card", "texte accentué sur carte", 4.5],
  ["accent-text", "accent-wash", "texte accentué sur badge", 4.5],
  ["accent-lightest", "bg-card", "intensité max sur carte", 4.5],
  ["on-accent", "accent", "texte posé sur l'accent", 4.5],
  ["on-cta", "cta-from", "texte du bouton (haut du dégradé)", 4.5],
  ["on-cta", "cta-to", "texte du bouton (bas du dégradé)", 4.5],
  ["accent", "bg", "bordure / remplissage sur fond", 3],
  ["accent", "bg-card", "bordure / remplissage sur carte", 3],
  ["steel", "bg-card", "bordure de champ", 3],
  ["success", "bg-card", "succès", 4.5],
  ["danger", "bg-card", "erreur", 4.5],
  ["info", "bg-card", "info", 4.5],
];

let echecs = 0;
let manquants = 0;
console.log("rapport  seuil  verdict  paire\n");
for (const [avant, arriere, libelle, seuil] of PAIRES) {
  if (!tokens[avant] || !tokens[arriere]) {
    console.log(`     —      —   ABSENT  ${libelle} (--${avant} / --${arriere})`);
    manquants++;
    continue;
  }
  const r = contraste(tokens[avant], tokens[arriere]);
  const ok = r >= seuil;
  if (!ok) echecs++;
  console.log(
    `${r.toFixed(2).padStart(6)}   ${String(seuil).padStart(4)}   ${ok ? "  OK  " : " ÉCHEC"}  ${libelle} (--${avant} / --${arriere})`
  );
}

console.log();
if (manquants) console.log(`${manquants} paire(s) ignorée(s) : token absent de globals.css.`);
if (echecs) {
  console.log(`${echecs} paire(s) sous le seuil WCAG. Corrige la palette avant de livrer.`);
  process.exit(1);
}
console.log("Tous les seuils WCAG sont tenus.");
