# Surcharge — Module Sport (Productivity Core)

Application Next.js full-stack (frontend + API + base de données) pour la séance du jour,
la cible automatique de progression, le calendrier flamme et les objectifs long terme.

Architecture hexagonale : `lib/domain` (cœur métier pur) → `lib/adapters` (Drizzle/Postgres)
→ `app/api` (routes = adapters d'entrée) → `app` (pages = adapter UI).

## Déploiement sur Vercel (chemin recommandé pour jeudi)

### 1. Pousser le code sur GitHub
```bash
cd surcharge-app
git init && git add -A && git commit -m "Module Sport - V1"
# Crée un repo sur github.com, puis :
git remote add origin https://github.com/<toi>/surcharge-app.git
git push -u origin main
```

### 2. Importer le projet sur Vercel
1. Va sur https://vercel.com, connecte-toi avec GitHub.
2. "Add New Project" → sélectionne le repo `surcharge-app`.
3. Vercel détecte Next.js automatiquement, clique "Deploy" (le premier build échouera
   probablement faute de `DATABASE_URL` — c'est normal, on l'ajoute à l'étape suivante).

### 3. Ajouter une base Postgres
1. Dans le projet Vercel → onglet **Storage** → **Create Database** → **Postgres**
   (propulsé par Neon, gratuit pour un usage personnel).
2. Vercel ajoute automatiquement la variable `DATABASE_URL` au projet.
3. Redéploie (**Deployments** → **Redeploy**).

### 4. Créer les tables et importer tes séances
En local, avec `DATABASE_URL` pointant vers la base Vercel (copie-la depuis
**Storage → .env.local → Show secret**) :
```bash
npm install
echo "DATABASE_URL=<colle l'url ici>" > .env.local
npx drizzle-kit push        # crée les tables dans Postgres
npx tsx scripts/seed.ts     # importe le split (Bras/Dos-Épaules/Jambes/Basket) + l'historique reel
```

### 5. Ouvrir l'app sur ton téléphone
Vercel donne une URL du type `https://surcharge-app-xxxx.vercel.app` — ajoute-la à
l'écran d'accueil de ton téléphone (Safari/Chrome → Partager → "Sur l'écran d'accueil")
pour un accès en un tap, façon app native.

## Développement local
```bash
npm install
npx drizzle-kit push
npx tsx scripts/seed.ts
npm run dev
```

## Ce qui est fait (V1)
- Séance du jour préchargée selon le split hebdomadaire (`surcharge-programs` équivalent : table `programmes`)
- Cible automatique par exercice (`calculerCibleAuto`, chapitre V du cahier des charges)
- Fiche exercice avec silhouette musculaire (groupe travaillé en surbrillance)
- Calendrier avec flamme graduée (3 niveaux)
- Objectifs long terme avec progression (+15/+30/+1h manuel, ou automatique si exercice priorisé)
- Progression par exercice (graphique, 1RM estimé, delta)

## Ce qui reste (voir chapitre "Séquençage des phases")
- Inversion de deux jours du split depuis l'UI (le repository `inverser()` existe déjà côté backend)
- Priorisation d'un exercice depuis l'UI (route API `PATCH /api/exercices` déjà prête)
- Sons, animations, gamification (Phase 3)
- Intégrations Strava/Boditrax/IA (Phase 4 — ports déjà prévus dans le schéma, champ `source`)
