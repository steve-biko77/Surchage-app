# Refonte frontend — Surcharge

Brief d'exécution pour Claude Code. Rédigé à partir du code réellement en place
le 13/10/2026, pas d'un projet imaginé. À donner tel quel, ou par phase :
« lis `REFONTE-FRONTEND.md` et exécute la phase 2 ».

---

## 0. Rôle

Tu es **Senior Product Designer et Frontend Engineer**, spécialisé dans les
applications de fitness haut de gamme. Tu travailles sur Surcharge, une app de
suivi de musculation. Le niveau attendu est celui d'une app qu'on vendrait par
abonnement : rien qui ressemble à un gabarit, rien qui ressemble à du HTML brut
repeint.

Tu ne livres pas une maquette. Tu modifies le code en place, tu le rends, tu le
regardes, tu le critiques, tu corriges — avant de dire que c'est fait.

---

## 1. État réel du code

| | |
|---|---|
| Chemin | `apps/sport/` dans le monorepo `Productivity-core` |
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| Base | Neon Postgres via Drizzle (`lib/db/schema.ts`) |
| Polices | Barlow (corps) + Barlow Condensed (titres), via `next/font/google` |
| Icônes | `lucide-react` |
| Graphiques | `recharts` |
| Carte musculaire | `react-body-highlighter` (déjà installé) |
| Primitives UI | `components/ui/` — `button`, `badge`, `card`, `progress` (façon shadcn, via `cva`) |

**Pages existantes** : `/` (séance du jour), `/entrainements`,
`/entrainement-en-cours`, `/objectifs`, `/calendrier`, `/progression`,
`/exercices/[id]`.

**Composants existants** : `MuscleMap`, `MuscleMapDetail`, `MuscleSilhouette`,
`ExerciseCard`, `FlameBadge`, `Nav`, `CarrouselModeles`, `SeanceResumeWidget`,
`EntrainementsClient` (432 l.), `ObjectifsClient`, `ProgressionClient`,
`CalendrierClient`.

### Ce qui vient d'être fait (ne pas refaire)

- Thème sombre passé **de l'orange au bleu nuit**. L'échelle d'accent
  (`--accent-wash` → `--accent-lightest`) reprend les sept paliers de luminance
  de l'ancienne gamme orange, donc les rapports de contraste restent valides.
- Les **~60 valeurs hexadécimales en dur** dans 18 fichiers sont passées en
  tokens. Trois exceptions assumées gardent un hex réel : `lib/db/schema.ts`
  (valeur stockée en base), `MuscleMap.tsx` et `MuscleSilhouette.tsx` (tableaux
  passés à `react-body-highlighter`, qui attend des couleurs, pas du CSS).
- Token d'action principale distinct (`--cta-from` / `--cta-to` / `--on-cta`,
  indigo→violet à texte blanc) : transposé tel quel, l'ancien bouton orange
  devenait périwinkle à texte sombre. L'accent seul sous du blanc ne donnait que
  4,18:1.
- `--steel` relevé à `#5a6792` : les bordures de champ étaient à 1,70:1 au lieu
  des 3:1 exigés (WCAG 1.4.11). Le défaut préexistait en orange (1,67:1).
- `scripts/check-contrast.mjs` vérifie toute la palette et sort en code 1 si un
  seuil casse.

### Dette connue, à traiter

- `components/ui/button.tsx`, variante `secondary` : hex en dur restants
  (`#5ba3e0`, `#2a5f8f`, `#08131f`, `#3B82C4`). À passer sur la famille `--info`.
- Alias `--iron` / `--iron-dim` : compatibilité uniquement, à supprimer quand
  plus rien ne les utilise.
- Les **modèles de séance vivent dans `localStorage`** (clé
  `surcharge_modeles_seance`, lue par `CarrouselModeles.tsx` et
  `EntrainementsClient.tsx`). Ils sont perdus au changement d'appareil ou de
  navigateur. À migrer en base.

---

## 2. Position de la carte musculaire — décision actée

La carte musculaire **reste l'élément principal de l'application**. C'est son
identité visuelle et son argument de différenciation.

Les spécifications produit du §3 proposaient de la rétrograder en fonctionnalité
secondaire. **Décision contraire : elle reste au premier plan**, sur l'accueil,
dans les fiches d'exercices, dans le bilan de séance, et dans une section qui lui
est dédiée.

Une seule nuance, et elle vient des spécifications elles-mêmes (§3.4) : **pendant
l'enregistrement d'une série, rien ne passe devant la saisie**. L'écran
d'entraînement actif affiche les muscles sollicités de l'exercice en cours, mais
sans jamais disputer la place au tableau des séries ni au bouton de validation.

### Technique : SVG en calques, pas de 3D pour l'instant

Un vrai modèle 3D (`three.js` + `@react-three/fiber` + `@react-three/drei`, tous
gratuits) coûte plusieurs mégaoctets de maillage, demande un modèle anatomique
libre de droits (Z-Anatomy est en CC-BY-SA) et rend mal sur un mobile d'entrée de
gamme. La maquette de référence ne montre d'ailleurs pas d'orbite libre : elle
montre **une vue avant et une vue arrière, avec des groupes colorés et des
étiquettes**.

Puisque c'est l'élément signature, le budget va donc dans la **qualité du SVG**
plutôt que dans la technologie : un tracé par sous-groupe, bascule avant/arrière
animée, survol et sélection, étiquettes reliées par des traits, légères
variations d'ombre pour le relief. Net à toute taille, quelques dizaines de
kilo-octets, animable en CSS, accessible au clavier.

Ne passe à la 3D que si l'orbite libre devient une exigence explicite — et
dis-le avant de l'implémenter, pas après.

**Sous-groupes à couvrir**, repris de la planche anatomique fournie : triceps
(longue portion, latérale, médiale), biceps (longue/courte portion), épaules
(antérieur, latéral, postérieur), dos (trapèzes, rhomboïdes, grand dorsal,
érecteurs du rachis, lombaires, carré des lombes), pectoraux (claviculaire,
sternale, costale), cuisses (quadriceps, ischio-jambiers, adducteurs, fessiers),
mollets (gastrocnémien, soléaire), avant-bras (fléchisseurs, extenseurs).

Le référentiel `MuscleDetail` de `lib/domain/types.ts` est aujourd'hui plus
grossier que cette liste (15 valeurs, sans les portions). Il faut l'étendre.

---

## 3. Spécifications produit

Reprises des retours sur les applications de sport existantes.

### 3.1 Accueil et séance du jour

L'action principale doit être immédiatement évidente : **démarrer ou reprendre**
une séance.

- La séance prévue aujourd'hui, avec nombre d'exercices et **durée estimée**.
- Un bouton principal « Commencer la séance » ou « Reprendre » selon l'état réel.
- Un aperçu des exercices en cartes illustrées.
- La progression hebdomadaire et les dernières performances.
- Les modèles de séances enregistrés, accessibles sans encombrer l'écran.
- La carte musculaire, en résumé de la répartition des groupes travaillés —
  centrale visuellement, mais elle ne doit pas repousser le bouton principal
  sous la ligne de flottaison.

### 3.2 Bibliothèque d'exercices

Les exercices sont le cœur visuel du module Entraînements. Chaque fiche porte :

photographie ou illustration de qualité · nom · groupe musculaire principal ·
muscles secondaires · équipement nécessaire · séries, répétitions et temps de
repos recommandés · consignes techniques · action claire pour ajouter à une
séance.

Recherche efficace, filtres par groupe musculaire, équipement et type de
mouvement.

> **Règle d'honnêteté, non négociable.** Utilise des médias réels ou des
> ressources locales adaptées. N'invente pas de vidéos, et ne présente jamais une
> image statique comme une animation. Voir §5 pour la source retenue — ce sont
> des **photographies**, pas des vidéos : une bascule début/fin de mouvement est
> honnête, un libellé « vidéo de démonstration » ne l'est pas.

### 3.3 Écran d'entraînement actif

**L'écran le plus utilisé de l'application.** Conçu pour la salle : à bout de
bras, en sueur, parfois à une main.

- Exercice actuel avec démonstration visible, nom et consignes essentielles.
- Tableau des séries : poids, répétitions, statut.
- Saisie rapide des performances, bouton de validation de série très visible.
- Chronomètre de repos automatique, **modifiable**.
- Accès à l'exercice suivant et à la modification de la séance.
- Progression globale de la séance.
- **Dernière performance sur le même exercice**, affichée en regard, pour rendre
  la surcharge progressive évidente.

Jamais de navigation entre plusieurs écrans pour enregistrer une série. Cibles de
44 px minimum, rien d'essentiel tout en haut de l'écran sur mobile.

### 3.4 Animations

Transition fluide à l'ouverture d'une fiche d'exercice · apparition progressive
des cartes au chargement · validation de série avec retour visuel immédiat ·
anneau de progression du repos · transition entre exercices · animation discrète
du bilan de fin de séance · graphiques de progression animés au chargement des
données.

Rapides, naturelles, performantes sur Android d'entrée de gamme. La règle du §7
s'applique : **le mouvement répond à une action**.

### 3.5 Objectifs et progression

Objectifs de force, de volume et de régularité. Records personnels, évolution des
charges, volume hebdomadaire, graphiques lisibles.

> **Toute progression affichée doit provenir des données réellement
> enregistrées.** Aucune valeur de démonstration en production, aucun chiffre
> interpolé présenté comme mesuré.

---

## 4. Ce que le modèle de données ne supporte pas encore

Analyse de `lib/db/schema.ts` et `lib/domain/types.ts` face au §3. **À traiter
avant d'écrire les écrans** : plusieurs exigences sont aujourd'hui
impossibles à satisfaire, pas seulement mal présentées.

| Exigence | État | Ce qu'il manque |
|---|---|---|
| Nombre d'exercices de la séance | ✅ | `seancesPlanifiees.exerciceIds` |
| Progression hebdo, dernières perfs, records, volume | ✅ | Calculables depuis `series` |
| Groupe principal + muscles secondaires | ✅ | `exercicesMuscles.role` |
| Séries / répétitions recommandées | ✅ | `repPlancher` / `repPlafond` |
| **Durée estimée de séance** | ❌ | Aucune donnée de durée. À calculer (séries × (temps d'exécution + repos)) une fois le repos stocké |
| **Distinguer « Commencer » de « Reprendre »** | ❌ | `seancesPlanifiees.statut` ne vaut que `planifiee` / `realisee`. Il manque `en_cours` |
| **Tableau de séries avec statut individuel** | ❌ | `series` agrège : une ligne = `poids` + `reps` + `sets`. L'écran actif exige une ligne **par série**, avec son statut. **C'est le changement de modèle le plus structurant** |
| **Médias par exercice** | ❌ | Aucune colonne. Sans ça, la bibliothèque premium ne peut pas exister |
| **Temps de repos recommandé** | ❌ | Aucune colonne — le chrono automatique n'a aucune valeur par défaut à lire |
| **Consignes techniques** | ❌ | Aucune colonne |
| **Type de mouvement** (filtre) | ❌ | Aucune colonne (polyarticulaire/isolation, poussée/tirage) |
| **Équipement** | ⚠️ | `typeCharge` (haltère/poulie/barre/poids du corps) est un *type de charge*, pas un équipement. Suffisant en v1, insuffisant pour « banc », « kettlebell », « élastique » |
| **Objectifs de volume et de régularité** | ⚠️ | `objectifs` ne gère que `temps` et `performance` avec `poidsCible` |
| **Modèles de séance** | ⚠️ | En `localStorage`, pas en base (voir §1) |
| **Sous-groupes musculaires** | ⚠️ | `MuscleDetail` compte 15 valeurs sans les portions (longue/courte, antérieur/latéral/postérieur) |

### Migration proposée

```
exercices        + mediaUrls text[]            -- chemins locaux ou distants
                 + instructions text[]         -- consignes, une étape par entrée
                 + reposRecommandeSec integer   -- défaut du chrono
                 + equipement text              -- référentiel ouvert
                 + mecanique text               -- "polyarticulaire" | "isolation"
                 + force text                   -- "poussee" | "tirage" | "statique"
                 + niveau text                  -- "debutant" | "intermediaire" | "avance"

seancesPlanifiees + statut : ajouter "en_cours"
                  + demarreeA timestamp
                  + terminee_a timestamp

series           → éclater en séries individuelles :
                   remplacer `sets` par une ligne par série
                   + numero integer              -- 1, 2, 3...
                   + statut text                 -- "prevue" | "validee" | "echouee"
                   + seancePlanifieeId uuid      -- rattachement à la séance

modeles_seance   → nouvelle table (remplace localStorage)
                   { id, nom, exerciceIds text, creeA }

MuscleDetail     → étendre aux portions listées au §2
```

L'éclatement de `series` est le point sensible : il faut une migration qui
**conserve l'historique** (une ligne agrégée de N sets devient N lignes). Écris-la
comme une vraie migration Drizzle, testée sur une copie, jamais en modifiant les
données en place sans filet.

---

## 5. Médias d'exercices — source retenue

**[free-exercise-db](https://github.com/yuhonas/free-exercise-db)** — vérifié le
13/10/2026 : 800+ exercices, **licence Unlicense (domaine public)**, 2 k étoiles,
maintenu.

Chaque exercice fournit exactement ce qui manque au §4 :

```json
{
  "id": "Alternate_Incline_Dumbbell_Curl",
  "name": "Alternate Incline Dumbbell Curl",
  "force": "pull",               → force
  "level": "beginner",           → niveau
  "mechanic": "isolation",       → mecanique
  "equipment": "dumbbell",       → equipement
  "primaryMuscles": ["biceps"],  → exercicesMuscles role=primaire
  "secondaryMuscles": ["forearms"], → role=secondaire
  "instructions": ["Sit down on an incline bench…"], → instructions
  "images": ["…/0.jpg", "…/1.jpg"]  → mediaUrls
}
```

Jeu complet : `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`
Images : préfixer les chemins par `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`

**Trois réserves à traiter, pas à ignorer :**

1. **Ce sont deux photographies par exercice** (position de départ, position
   d'arrivée), pas une vidéo. Une bascule ou un fondu lent entre les deux est
   honnête et lisible ; écrire « vidéo de démonstration » ne l'est pas.
2. Les champs `force`, `mechanic` et `equipment` sont **nuls sur une partie du
   jeu** (signalé par le dépôt lui-même). Prévois l'affichage et les filtres en
   conséquence : une valeur absente n'est pas « inconnu » affiché en dur, c'est
   un champ qu'on masque.
3. **Les noms et les muscles sont en anglais.** Il faut une table de
   correspondance vers le référentiel `MuscleDetail` et une traduction des noms
   d'exercices. `lib/domain/muscleMapping.ts` fait déjà ce travail pour
   `react-body-highlighter` — même logique, deuxième table.

Rapatrie les images en local (`public/exercices/`) plutôt que de taper
`raw.githubusercontent.com` à chaque rendu : ça évite une dépendance réseau au
milieu d'une séance en salle, où la connexion est mauvaise.

---

## 6. Outils à utiliser — tous gratuits

### 6.1 Skills déjà installés dans `apps/sport/.claude/skills/`

Ils sont là, personne ne les a utilisés. Première source, avant toute recherche
web.

| Skill | Ce qu'il apporte | Comment l'appeler |
|---|---|---|
| `ui-ux-pro-max` | 67 styles, 161 palettes, 57 paires de polices, 99 règles UX, 25 types de graphiques, 22 stacks | `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>" --stack shadcn -n 15` · `--domain ux\|color\|typography\|style\|product` · `--design-system -p "Surcharge" -f markdown` |
| `ui-styling` | Références shadcn (composants, thèmes, accessibilité) + Tailwind | `scripts/shadcn_add.py`, `scripts/tailwind_config_gen.py` |
| `design-system` | Tokens en trois couches (primitif → sémantique → composant) | `scripts/generate-tokens.cjs`, `scripts/validate-tokens.cjs` |
| `brand` | Gestion de palette, cohérence de marque | `scripts/sync-brand-to-tokens.cjs`, `scripts/extract-colors.cjs` |
| `design` | Logos, icônes, visuels | `references/design-routing.md` |

Commence toute décision visuelle par une requête `ui-ux-pro-max` sur le domaine
concerné. Ses règles sont classées par priorité : accessibilité et interaction
tactile passent avant le style.

### 6.2 Serveurs MCP

| Serveur | Usage | Gratuité |
|---|---|---|
| **21st.dev** | `search` / `get_inspiration` pour des composants de référence ; `search --type theme` puis `get_theme` pour du CSS | Recherches illimitées. **2 récupérations de code par jour** (`get_component`) — lis les descriptions et réimplémente plutôt que de les gaspiller |
| **shadcn (`Shadcn_UI`)** | `list_components`, `get_component`, `get_block`, `get_theme` — déjà connecté | Gratuit |
| **Firecrawl** | `firecrawl_search` / `firecrawl_scrape` pour des références d'interfaces | Gratuit dans les limites du compte |
| **Figma** | `get_design_context`, `get_screenshot` si une maquette existe | Gratuit dans les limites du compte |
| **Playwright / navigateur** | Rendre l'app et la capturer pour se relire | Gratuit |

Enregistrement de 21st si absent :

```bash
claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: <clé>"
```

### 6.3 Librairies gratuites

Déjà présentes : `react-body-highlighter`, `recharts`, `lucide-react`,
`class-variance-authority`, `tailwind-merge`, `clsx`.

À ajouter seulement si le besoin est réel :

- `motion` (ex-framer-motion) — transitions partagées de l'écran de séance,
  ouverture continue de la fiche d'exercice. Le seul ajout vraiment justifié ;
  le reste se fait en CSS.
- `embla-carousel-react` — carrousel d'exercices (choix shadcn).
- `vaul` — panneau glissant pour les filtres sur mobile.
- `sonner` — notifications de validation.
- `@react-three/fiber` + `@react-three/drei` + `three` — **uniquement** si la 3D
  est validée explicitement (§2).

Toute dépendance ajoutée se justifie en une phrase dans le message de commit.

---

## 7. Boucle de vérification — non négociable

Une interface qu'on n'a pas regardée n'est pas finie. Après chaque phase :

```bash
npm run dev                      # dans apps/sport
node scripts/check-contrast.mjs  # sort en 1 si une paire passe sous le seuil
npx tsc --noEmit                 # 3 erreurs @productivity/core sont pré-existantes
```

Puis, avec Playwright ou le navigateur :

1. Capture **1440 px** (desktop) et **390 px** (iPhone) de chaque écran touché.
2. **Regarde les captures.** Cherche activement : un pictogramme illisible à sa
   taille réelle, un texte qui déborde, une colonne étroite perdue dans du vide,
   une couleur qui n'encode rien, une animation qui ne répond à aucune action.
3. Corrige, recapture, recommence.
4. Capture aussi les états que personne ne regarde : liste vide, chargement,
   erreur réseau, exercice sans image, texte très long, une seule série, trente
   exercices.
5. Vérifie **la persistance** : recharge la page après avoir validé une série,
   la donnée doit être là.

Si un pictogramme ou un graphique est douteux, rends **plusieurs variantes côte à
côte** à la taille réelle d'affichage et choisis sur image, pas d'intuition.

---

## 8. Garde-fous

- **Jamais d'hexadécimal en dur dans un composant.** Tout passe par un token.
  Exceptions : valeurs stockées en base, tableaux passés à une librairie qui
  attend des couleurs.
- **La couleur doit encoder quelque chose.** Quatre barres de quatre teintes
  quand seule la longueur porte l'information, c'est un arc-en-ciel décoratif.
- **Le mouvement répond à une action.** Une entrée en fondu-montée sur chaque
  section au chargement est le réflexe générique à éviter.
- **`prefers-reduced-motion` est déjà géré** dans `globals.css` — ne le casse pas,
  et vérifie que l'app reste utilisable animations coupées.
- **44 × 44 px minimum** pour toute cible tactile, avec de l'espace entre elles.
- **Pas d'emoji en guise d'icône.**
- **Aucune donnée inventée.** Pas de fausse vidéo, pas de progression simulée,
  pas de record calculé sur des valeurs de démonstration.
- Français **tutoyé, direct, sans jargon de salle**. Un message d'erreur dit ce
  qui s'est passé et quoi faire ; il ne s'excuse pas.
- **Améliore progressivement l'existant.** Réutilise les composants et la logique
  métier en place. Ne reconstruis pas ce qui marche. Toute fonctionnalité
  existante supprimée doit être signalée avant, pas découverte après.

---

## 9. Phases

| Phase | Contenu | Fini quand |
|---|---|---|
| 1 | Dette du §1 : variante `secondary`, suppression des alias `--iron` | `check-contrast` au vert, aucun hex en dur hors exceptions |
| 2 | **Migration du modèle (§4)** + import free-exercise-db (§5) : médias en local, consignes, repos, équipement, mécanique, statut `en_cours`, séries individuelles, modèles en base | L'historique existant survit à la migration, vérifié sur copie. Un exercice affiche sa photo, ses consignes et son repos par défaut |
| 3 | **Écran d'entraînement actif (§3.3)** — l'écran le plus utilisé, le plus mal servi aujourd'hui | Une séance complète s'enregistre au pouce, chrono et dernière perf compris, capturée en 390 px, données persistées après rechargement |
| 4 | **Accueil (§3.1)** : action principale évidente, aperçu des exercices, progression hebdo, modèles | Le bouton principal est visible sans défilement en 390 px |
| 5 | **Bibliothèque (§3.2)** : recherche, filtres, fiches illustrées | Filtres instantanés, URL partageable, état vide traité |
| 6 | **Carte musculaire signature (§2)** : SVG en calques, vues avant/arrière, sous-groupes, référentiel étendu | Chaque sous-groupe est survolable, sélectionnable, accessible au clavier |
| 7 | **Objectifs et progression (§3.5)** : force, volume, régularité, records, graphiques animés | Chaque chiffre affiché est traçable jusqu'à une ligne de `series` |

Rapport après chaque phase : ce qui a changé, les captures, ce qui reste. Pas de
phase suivante sans validation.
