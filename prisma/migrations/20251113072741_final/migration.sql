/*
  Warnings:

  - You are about to drop the column `advanceCanteenAmount` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `advanceCanteenEnabled` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `advanceShoesAmount` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `advanceShoesEnabled` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "advanceCanteenAmount",
DROP COLUMN "advanceCanteenEnabled",
DROP COLUMN "advanceShoesAmount",
DROP COLUMN "advanceShoesEnabled",
ADD COLUMN     "advance" JSONB;
