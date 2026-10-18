-- Table des abonnements Web Push.
-- A executer une fois sur la base Journal (editeur SQL Neon, ou `npx drizzle-kit push`).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint        text NOT NULL UNIQUE,
  p256dh          text NOT NULL,
  auth            text NOT NULL,
  libelle         text,
  created_at      timestamp DEFAULT now(),
  last_success_at timestamp
);
