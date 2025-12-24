/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Ajouter la colonne password comme nullable d'abord
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- Mettre à jour l'utilisateur existant avec un mot de passe par défaut (hash de "demo123")
UPDATE "User" SET "password" = '$2b$10$WWdsHQNd2SqRkKsJe85eUukByEH0QE28W3TSlwhdunbCJCS2AMMk2' WHERE "password" IS NULL;

-- Rendre la colonne NOT NULL
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
