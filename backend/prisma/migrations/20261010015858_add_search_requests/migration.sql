-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NOVO_ANUNCIO_COMPATIVEL';

-- CreateTable
CREATE TABLE "search_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "purpose" "ListingPurpose",
    "province" TEXT,
    "district" TEXT,
    "city" TEXT,
    "minPrice" DECIMAL(12,2),
    "maxPrice" DECIMAL(12,2),
    "bedrooms" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_requests_isActive_city_idx" ON "search_requests"("isActive", "city");

-- AddForeignKey
ALTER TABLE "search_requests" ADD CONSTRAINT "search_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_requests" ADD CONSTRAINT "search_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
