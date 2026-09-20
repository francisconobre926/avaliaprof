-- CreateEnum
CREATE TYPE "UnlockStatus" AS ENUM ('CONFIRMADO', 'FALHOU');

-- CreateTable
CREATE TABLE "unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "status" "UnlockStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unlocks_userId_listingId_key" ON "unlocks"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "unlocks" ADD CONSTRAINT "unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlocks" ADD CONSTRAINT "unlocks_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
