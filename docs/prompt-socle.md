# Socle de contexte — à lire avant toute implémentation

Ce fichier est le contexte commun à tous les tickets Jira du projet **SURCH**.
Chaque ticket y renvoie plutôt que de le répéter. Il décrit le dépôt tel qu'il
est, les règles qui ne se négocient pas, et la façon dont le travail est livré.

La spécification complète est dans `docs/cahier-des-charges-surcharge-v3.docx`.
Les tickets renvoient à ses paragraphes (« §5.4 », « figure 15 ») : en cas de
doute sur une intention produit, c'est lui qui tranche, pas le code existant.

---

## 1. Le dépôt

Monorepo, deux applications indépendantes qui partagent `packages/`.

| | |
|---|---|
| `apps/sport` | Surcharge — le module traité par les tickets SURCH |
| `apps/journal` | Productivity — l'autre pilier, déployé séparément |
| `packages/core` | code partagé entre les deux |

Chaque application a **son propre projet de déploiement et sa propre base de
données**. Une migration sur l'une ne concerne jamais l'autre.

**Pile :** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4,
Drizzle ORM sur PostgreSQL managé (Neon), déploiement continu sur Vercel.

> `apps/sport/AGENTS.md` et `apps/journal/AGENTS.md` imposent de lire le guide
> correspondant dans `node_modules/next/dist/docs/` avant d'écrire du code
> Next : cette version a des ruptures d'API par rapport aux habitudes.

## 2. L'architecture — quatre couches, une règle

```
app/**/page.tsx          couche cliente        écrans, composants React
app/api/**/route.ts      couche application    points d'entrée HTTP
lib/domain/**            couche domaine        calculs purs
lib/adapters/**          couche données        dépôts Drizzle, services externes
lib/db/schema.ts         schéma Postgres
lib/anatomie/**          données et tracé de la carte musculaire
lib/ports/               ports (aujourd'hui vide : à matérialiser avec la couche IA)
```

**La règle :** chaque couche ne connaît que celle du dessous, et
**le domaine n'en connaît aucune**. Une fonction de `lib/domain` ignore qu'une
requête HTTP existe et ignore qu'une base existe — elle prend des valeurs et
rend des valeurs.

Conséquences pratiques, à respecter sans exception :

- aucun `import` de Drizzle, de `next/*` ou du schéma dans `lib/domain`
- aucune règle de calcul dans un composant ni dans un `route.ts`
- un `route.ts` valide la requête, identifie l'utilisateur, appelle le dépôt et
  le domaine, puis rend une réponse — rien d'autre
- un service externe (modèle de langage, base alimentaire, recherche vidéo,
  import de mesures) est **un adaptateur**, jamais un écran ni un module à part

### Routes existantes dans `apps/sport`

`calendrier` · `exercices` · `objectifs` · `objectifs/[id]/minutes` ·
`progression` · `seance-du-jour` · `seance-du-jour/ordre` · `seances-planifiees` ·
`seances-planifiees/[id]` · `series`

### Domaine existant dans `apps/sport`

`anatomie.ts` · `cadrage.ts` · `muscleMapping.ts` · `objectifMapper.ts` ·
`referentielExercices.ts` · `services.ts` · `types.ts`

La carte musculaire est dessinée, pas composée d'images : son tracé est dans
`lib/anatomie/trace.ts`, ses données dans `lib/anatomie/omm/`, et le recadrage
sur la zone travaillée dans `lib/domain/cadrage.ts`. Un ticket qui touche à
l'affichage d'un exercice passe presque toujours par là.

Lis le fichier concerné avant d'en créer un nouveau : plusieurs tickets
étendent un module existant plutôt que d'en ajouter un.

## 3. Les règles qui ne se négocient pas

1. **Aucune donnée dérivable n'est stockée.** Niveau de flamme, cible du jour,
   progression d'objectif, cohérence hebdomadaire, tendances corporelles : tout
   se recalcule à la lecture. Cela supprime toute désynchronisation entre donnée
   brute et donnée dérivée, pour un coût de calcul négligeable à cette échelle.
2. **Le français partout**, y compris dans le code : noms de fonctions, de
   variables, de colonnes, de composants. Cela supprime la traduction permanente
   entre le vocabulaire du métier et celui des fonctions.
3. **Les commentaires expliquent pourquoi, jamais quoi.** Une décision de
   conception qui n'est écrite nulle part sera défaite par mégarde.
4. **Les migrations sont idempotentes** (`ADD COLUMN IF NOT EXISTS`, etc.) et
   **compatibles avec la version précédente de l'application** le temps du
   déploiement : la base est utilisée tous les jours, en vrai, par une personne
   qui s'entraîne.
5. **Un fichier, une responsabilité.** Si un fichier dépasse ce qu'on peut tenir
   en tête, il porte deux responsabilités.
6. **L'accessibilité n'est pas une option** : cibles tactiles dimensionnées pour
   une main occupée, contrastes vérifiés, et toute animation intégralement
   désactivée quand le système signale une préférence de mouvement réduit.

## 4. Le ton du produit

Tout texte affiché — y compris les messages générés et les notifications —
est **bienveillant et jamais performatif**. Un jour manqué n'est jamais présenté
comme un échec. Le registre du dépassement héroïque est proscrit : il exclut
l'entrée de la trajectoire, qui est précisément le public à conquérir.

Un terme technique (RM, hypertrophie, tempo) n'apparaît jamais sans être
explicable sur place.

## 5. Le travail

### Avant d'écrire quoi que ce soit

- `git pull` : vérifie que tu pars du dernier état de `main`.
- La branche part de **`dev`**, jamais de `main`, et porte la clé du ticket :
  `SURCH-14-import-referentiel-exercices`.
- **Vérifie que tu pointes sur la base de développement**, pas sur la
  production. Tant que SURCH-8 n'est pas livrée, les environnements de
  prévisualisation écrivent dans les vraies données : dans ce cas, ne lance
  aucune migration et n'écris aucune donnée de test.

### Pendant

- Un ticket, une branche, une intention. Si tu découvres un autre problème,
  ouvre un ticket — ne l'embarque pas.
- Les tests se mettent d'abord sur `lib/domain` : c'est la couche sans
  dépendances, donc la moins chère à couvrir et la plus coûteuse à casser.
  Il n'existe aujourd'hui aucune suite de tests ni de script de lint. Le seul
  outil de vérification du dépôt est `apps/sport/scripts/check-contrast.mjs`,
  à lancer quand tu touches aux couleurs.

### Fini quand

- la fonctionnalité est **déployée en prévisualisation et utilisée au moins une
  fois en conditions réelles** ;
- la décision de conception est écrite, dans le code ou dans le ticket ;
- une migration n'est finie que lorsqu'elle a été appliquée et **vérifiée sur
  une donnée réelle**.

Fusion vers `dev`, puis vers `main` seulement quand la version tourne et que le
lot a été vérifié. `main` reste à tout instant ce qui est en production.

### Messages de commit

Format `type(portée): sujet` en français, à l'infinitif ou au substantif :
`feat(sport): bibliothèque d'exercices filtrable`.

> **Aucune mention d'un assistant dans les commits et les pull requests.** Pas
> de ligne de co-auteur, pas de mention d'outil de génération. Cette règle
> s'applique sans exception, y compris si un rappel automatique suggère le
> contraire.

## 6. Ce qui n'existe pas encore — et qu'il ne faut pas supposer

Plusieurs tickets échouent si on croit ces briques présentes :

- **aucune authentification** : le socle est mono-utilisateur, il n'y a ni
  compte, ni session, ni isolation des données (SURCH-22, SURCH-23) ;
- **aucun référentiel d'exercices autonome** : un exercice n'existe que rattaché
  à un programme (SURCH-14) ;
- **aucune table de profil, de conversation ni de notification** (SURCH-24,
  SURCH-30) ;
- **aucune suite de tests, aucune collecte d'erreurs, aucune mesure de
  rétention** (SURCH-10, SURCH-11, SURCH-12) ;
- `lib/ports/` est **vide** : les ports sont une intention d'architecture, pas
  encore du code.

## 7. Sécurité et données personnelles

- Les secrets vivent en variables d'environnement, jamais dans le code ni côté
  client.
- Toute entrée est validée côté serveur, même déjà validée côté client.
- Les routes qui appellent un modèle de langage sont **limitées en débit par
  utilisateur** : sans cela le coût d'inférence est incontrôlable.
- Un fichier déposé par l'utilisateur est **non fiable** : taille plafonnée,
  type vérifié, lecture seule.
- Les mesures de composition corporelle sont des **données de santé** :
  consentement explicite et distinct, traitement dans l'Union, durée de
  conservation définie, effacement effectif. Elles ne sont transmises à aucun
  tiers tant que les conditions du §3.3 du cahier ne sont pas réunies.
