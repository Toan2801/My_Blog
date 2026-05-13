/*
  Warnings:

  - You are about to drop the column `markdownPages` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `pages` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "markdownPages",
DROP COLUMN "pages";
