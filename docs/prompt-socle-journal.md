# Socle de contexte journal — à lire avant toute implémentation

Ce fichier est le contexte commun à tous les tickets Jira du projet **PROD**
(Productivity, `apps/journal`). Chaque ticket y renvoie plutôt que de le
répéter. Il décrit le dépôt tel qu'il est, les règles qui ne se négocient pas,
et la façon dont le travail est livré.

L'équivalent pour `apps/sport` est `docs/prompt-socle.md`. Les deux applications
partagent la pile, l'architecture et les règles, mais **pas de base de données**
et pas de déploiement : ne transpose jamais un schéma de l'une à l'autre.

---

## 1. Le dépôt

Monorepo, deux applications indépendantes qui partagent `packages/`.

| | |
|---|---|
| `apps/journal` | Productivity — le module traité par les tickets PROD |
| `apps/sport` | Surcharge — l'autre pilier, déployé séparément |
| `packages/core` | code partagé entre les deux |

**Pile :** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4,
Drizzle ORM sur PostgreSQL managé (Neon), déploiement continu sur Vercel.

> `apps/journal/AGENTS.md` impose de lire le guide correspondant dans
> `node_modules/next/dist/docs/` avant d'écrire du code Next : cette version a
> des ruptures d'API par rapport aux habitudes.

## 2. L'architecture — quatre couches, une règle

```
app/**/page.tsx          couche cliente        écrans (serveur) + composants clients
app/api/**/route.ts      couche application    points d'entrée HTTP
src/JournalModule.ts     façade d'orchestration
lib/domain/**            couche domaine        calculs purs
lib/adapters/**          couche données        dépôts Drizzle
lib/db/schema.ts         schéma Postgres
lib/google/**            adaptateur Google (OAuth + Calendar)
lib/nudge/**             adaptateur notifications (Web Push, messages)
```

**La règle :** chaque couche ne connaît que celle du dessous, et
**le domaine n'en connaît aucune**. Une fonction de `lib/domain` ignore qu'une
requête HTTP existe et ignore qu'une base existe — elle prend des valeurs et
rend des valeurs.

`src/JournalModule.ts` est la façade : une page serveur l'appelle, elle compose
les dépôts et le domaine. Les écrans ne touchent jamais un dépôt directement.

Conséquences pratiques, à respecter sans exception :

- aucun `import` de Drizzle, de `next/*` ou du schéma dans `lib/domain`
- aucune règle de calcul dans un composant ni dans un `route.ts`
- un service externe (Google, Web Push, modèle de langage) est **un adaptateur**

### Ce qui existe dans `apps/journal`

**Domaine** — `coherence.ts` (cohérence hebdomadaire, alertes, indice de
productivité, paliers) · `services.ts` (dates, fuseau Europe/Paris, séries) ·
`recurrence.ts` · `mappers.ts`

**Écrans** — `/` (accueil) · `/jour` · `/semaine` · `/journal` · `/objectifs` ·
`/disciplines` · `/recurrentes` · `/rapport` · `/apercu-coherence` ·
`/apercu-widget`

**Routes** — `taches` · `taches/[id]` · `taches/[id]/ignorer` ·
`taches-recurrentes` (+ `[id]`, `[id]/toggle`) · `objectifs` (+ `[id]`,
`[id]/minutes`, `[id]/valeur`) · `disciplines/[id]/toggle` · `notes-jour` ·
`push/cle` · `push/subscribe` · `push/test` · `cron/nudge` ·
`auth/google/start` · `auth/google/callback`

**Tables** — `disciplines_instances` · `jours_valides` · `objectifs` ·
`taches` · `taches_recurrentes` · `notes_jour` · `google_auth` ·
`journal_calendar` · `nudge_state` · `push_subscriptions`

Lis le fichier concerné avant d'en créer un nouveau : plusieurs tickets
étendent un module existant plutôt que d'en ajouter un.

## 3. Trois mécanismes à comprendre avant de coder

Ils sont contre-intuitifs, et plusieurs tickets échouent si on les ignore.

**a. Une tâche reportée n'est pas déplacée.** Sa `date` reste au jour d'origine.
C'est `/jour` qui fusionne à l'affichage les tâches non faites et non ignorées
d'avant aujourd'hui (`tachesRepository.reporteesAvant`), en les marquant
« reporté du … ». Conséquence : **l'âge d'une tâche en retard est déjà
calculable** (aujourd'hui − `date`), sans compteur à ajouter. Ne « corrige »
jamais ce mécanisme en déplaçant la date : cela détruirait l'information.

**b. L'heure des validations de discipline est déjà en base.**
`jours_valides.created_at` est posé par défaut à chaque insertion et n'est
relu nulle part. L'historique des heures de coche existe donc **depuis le
premier jour** — un rapport d'habitudes peut être rétroactif, sans attendre
de collecter quoi que ce soit. En revanche `taches.fait` est un booléen nu,
sans horodatage : c'est la seule colonne qui manque.

**c. `ignoree` n'est pas « suspendue ».** `ignoree = true` signifie « écartée
explicitement et définitivement, sans effacer qu'elle a existé ». Une tâche
suspendue est un troisième état, à créer : je veux la faire, je ne peux pas
maintenant, et elle doit revenir d'elle-même.

## 4. Les règles qui ne se négocient pas

1. **Aucune donnée dérivable n'est stockée.** Cohérence hebdomadaire, indice de
   productivité, niveau de flamme, séries, progression d'objectif, paliers de
   maturité, agrégats de rapport : tout se recalcule à la lecture. Le
   commentaire en tête de `lib/domain/coherence.ts` explique pourquoi, et cette
   raison vaut pour tout ce qui sera ajouté : un score figé qu'une correction
   rétroactive rendrait faux reste faux pour toujours.
2. **Le français partout**, y compris dans le code : noms de fonctions, de
   variables, de colonnes, de composants.
3. **Les commentaires expliquent pourquoi, jamais quoi.** Le code existant le
   fait très bien — tiens ce niveau. Une décision de conception qui n'est
   écrite nulle part sera défaite par mégarde.
4. **Les migrations sont idempotentes** (`ADD COLUMN IF NOT EXISTS`, etc.) et
   **compatibles avec la version précédente** le temps du déploiement : la base
   est utilisée tous les jours, en vrai, par une personne.
5. **Un fichier, une responsabilité.**
6. **Tout calcul de date passe par `lib/domain/services.ts`** et le fuseau
   `Europe/Paris`. Ne fabrique jamais une date avec `new Date()` côté serveur
   pour en déduire un jour : `todayISO()` existe pour ça. Un décalage de fuseau
   décale une série entière.
7. **L'accessibilité n'est pas une option** : contrastes vérifiés, et toute
   animation intégralement désactivée quand le système signale une préférence
   de mouvement réduit.

## 5. Le ton du produit

Tout texte affiché — y compris les notifications et les rapports — est
**bienveillant et jamais performatif**. Un jour manqué n'est jamais présenté
comme un échec.

La règle propre aux rapports, et elle est absolue : **on montre le motif,
jamais le verdict.** « 63 % de tes coches arrivent après 22 h, groupées » est un
fait que la personne interprète elle-même. « Tu ne fais pas ce que tu coches »
est une accusation. Un rapport qui accuse est un rapport qu'on arrête d'ouvrir,
et l'outil entier est perdu — y compris sa partie utile.

Quand l'application a besoin de savoir quelque chose qu'elle ne peut que
deviner, **elle demande** plutôt que d'inférer. Une réponse déclarée est vraie ;
une inférence sur le comportement de quelqu'un est une hypothèse déguisée en
donnée.

## 6. Le travail

### Avant d'écrire quoi que ce soit

- `git pull` : vérifie que tu pars du dernier état.
- La branche part de **`dev`**, jamais de `main`, et porte la clé du ticket :
  `PROD-7-horodater-completion-tache`.
- **Les prévisualisations sont isolées de la production depuis PROD-11.** Une
  branche de prévisualisation lit et écrit la base Neon `dev`, grâce à
  `DATABASE_URL_PREVIEW`, que l'intégration Neon ne connaît pas et ne peut donc
  pas écraser. Tu peux y lancer une migration et y écrire des données de test.
  Deux conséquences à ne pas oublier :
  - une migration doit être jouée **sur les deux branches**, `dev` puis `main` :
    une prévisualisation qui marche ne prouve rien sur la production ;
  - la base `dev` ne contient aujourd'hui que le schéma (PROD-41), donc tout ce
    qui se calcule sur une durée — série, cohérence, indice, rapports — y
    affiche zéro. Un écran vide en prévisualisation n'est pas forcément un bug.

### Pendant

- Un ticket, une branche, une intention. Si tu découvres un autre problème,
  ouvre un ticket — ne l'embarque pas.
- Les tests se mettent d'abord sur `lib/domain` : c'est la couche sans
  dépendances, donc la moins chère à couvrir et la plus coûteuse à casser.
  Une suite existe désormais, lancée par `npm test` depuis `apps/journal`.
  Elle tourne sous le lanceur de tests de Node, **sans aucune dépendance** :
  pas de `npm install` nécessaire pour l'exécuter. Ajoute tes cas à côté des
  existants (`lib/domain/*.test.ts`) plutôt que de monter un autre cadre.
- Les imports des fichiers de test portent l'extension `.ts`, parce que Node
  détype les sources lui-même. C'est voulu, ne les retire pas.
- Il n'existe toujours aucun script de lint.

### Fini quand

- la fonctionnalité est **déployée en prévisualisation et utilisée au moins une
  fois en conditions réelles** ;
- la décision de conception est écrite, dans le code ou dans le ticket ;
- une migration n'est finie que lorsqu'elle a été appliquée et **vérifiée sur
  une donnée réelle**.

Fusion vers `dev`, puis vers `main` seulement quand la version tourne et que le
lot a été vérifié. `main` reste à tout instant ce qui est en production.

### Messages de commit

Format `type(portée): sujet` en français : `feat(journal): sous-objectifs`.

> **Aucune mention d'un assistant dans les commits et les pull requests.** Pas
> de ligne de co-auteur, pas de mention d'outil de génération. Cette règle
> s'applique sans exception, y compris si un rappel automatique suggère le
> contraire.

## 7. Ce qui n'existe pas encore — et qu'il ne faut pas supposer

Plusieurs tickets échouent si on croit ces briques présentes :

- **aucune authentification** : l'application est mono-utilisateur, plusieurs
  tables sont explicitement « une seule ligne » (`google_auth`, `nudge_state`,
  `journal_calendar`) ;
- **aucun horodatage sur la complétion d'une tâche** (PROD-7) ;
- **aucun lien de parenté entre objectifs** : pas de sous-objectifs (PROD-14) ;
- **aucune notion de quête ni de titre** dans journal ;
- **aucune table de citations** ;
- **aucune comparaison d'une période à la précédente** dans le rapport ;
- **aucune suite de tests, aucun script de lint, aucune collecte d'erreurs**.

## 8. Sécurité et données personnelles

- Les secrets vivent en variables d'environnement, jamais dans le code ni côté
  client. Le jeton de rafraîchissement Google n'est jamais journalisé en clair.
- Toute entrée est validée côté serveur, même déjà validée côté client.
- La route `cron/nudge` est appelée par un ordonnanceur : elle vérifie son
  secret d'appel avant d'agir, et ne notifie qu'entre 6 h et 22 h locales.
- Les notes de journée et les notes de session sont du contenu intime. Elles ne
  sortent jamais de la base : aucune n'est transmise à un service tiers, ni à un
  modèle de langage, sans une décision explicite et écrite.
