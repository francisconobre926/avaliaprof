-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGEM', 'VIDEO');

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
