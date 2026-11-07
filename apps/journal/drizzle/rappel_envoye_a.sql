-- Rappels des taches a heure fixe : marque de ce qui est deja parti.
--
-- Nullable a dessein : null signifie "jamais notifiee", ce qui est l'etat de
-- toutes les taches existantes. C'est cette colonne qui rend le balayage
-- idempotent -- la route passe toutes les cinq minutes et ne renvoie jamais
-- deux fois le meme rappel, meme si deux passages se chevauchent.
--
-- A executer une fois par base (editeur SQL Neon, ou `npx drizzle-kit push`).
ALTER TABLE taches ADD COLUMN IF NOT EXISTS rappel_envoye_a timestamp;
