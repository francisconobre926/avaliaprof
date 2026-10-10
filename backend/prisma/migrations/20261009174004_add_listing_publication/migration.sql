-- CreateEnum
CREATE TYPE "PublicationPaymentStatus" AS ENUM ('CONFIRMADO', 'FALHOU');

-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'RASCUNHO';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListingPublication" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pricingRuleId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "status" "PublicationPaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoriteId" TEXT,
    "unlockId" TEXT,
    "mediaId" TEXT,

    CONSTRAINT "ListingPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingPublication_listingId_idx" ON "ListingPublication"("listingId");

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_favoriteId_fkey" FOREIGN KEY ("favoriteId") REFERENCES "favorites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_unlockId_fkey" FOREIGN KEY ("unlockId") REFERENCES "unlocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
