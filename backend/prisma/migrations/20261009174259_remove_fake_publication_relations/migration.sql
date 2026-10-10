/*
  Warnings:

  - You are about to drop the column `favoriteId` on the `ListingPublication` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `ListingPublication` table. All the data in the column will be lost.
  - You are about to drop the column `unlockId` on the `ListingPublication` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ListingPublication" DROP CONSTRAINT "ListingPublication_favoriteId_fkey";

-- DropForeignKey
ALTER TABLE "ListingPublication" DROP CONSTRAINT "ListingPublication_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "ListingPublication" DROP CONSTRAINT "ListingPublication_unlockId_fkey";

-- AlterTable
ALTER TABLE "ListingPublication" DROP COLUMN "favoriteId",
DROP COLUMN "mediaId",
DROP COLUMN "unlockId";
