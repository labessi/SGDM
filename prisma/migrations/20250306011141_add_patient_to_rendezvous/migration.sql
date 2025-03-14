/*
  Warnings:

  - Added the required column `dossierId` to the `RendezVous` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `rendezvous` ADD COLUMN `dossierId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `RendezVous` ADD CONSTRAINT `RendezVous_dossierId_fkey` FOREIGN KEY (`dossierId`) REFERENCES `DossierMedical`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
