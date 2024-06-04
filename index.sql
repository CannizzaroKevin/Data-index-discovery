-- Remise à 0 de la BDD
DROP TABLE IF EXISTS "users";

-- Création de la table
CREATE TABLE "users" (
  "id" int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "age" int NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz
);

INSERT INTO "users" ("username", "age")
SELECT md5(num::text), round(random()*81)+18 FROM generate_series(1,10000000) AS t(num);
-- 18min

-- Récupération sans index
SELECT * FROM "users" WHERE "age" = 45;
-- 3sec

-- Création de l'index
CREATE INDEX "users_age_idx" ON "users" USING hash ("age");
-- 19min;

-- Récupération avec index
SELECT * FROM "users" WHERE "age" = 45;
-- 731msec

-- Ok c'est plus rapide mais ca pèse assez lourd : la moitié du poids total de la table 400Mo pour 800Mo
-- On va drop cet index qui prend trop de place
  DROP INDEX "user_age_idx";
-- 273msec

-- On va en créer un nouveau mais avec un algo différent
CREATE INDEX "users_age_idx" ON "users" USING brin ("age");
-- 7 sec ??? et en plus il ne pèse que 56ko ?

-- Récupération avec index BRIN
SELECT * FROM "users" WHERE "age" = 45;
-- 800sec
