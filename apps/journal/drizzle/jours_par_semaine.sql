-- Rythme visé par objectif : le dénominateur de la cohérence hebdomadaire.
-- Nullable à dessein — un objectif sans rythme n'affiche pas la métrique
-- plutôt que d'en inventer une.
ALTER TABLE objectifs ADD COLUMN IF NOT EXISTS jours_par_semaine integer;
