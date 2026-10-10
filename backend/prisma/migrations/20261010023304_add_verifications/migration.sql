-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDENTE',
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verifications_userId_status_idx" ON "verifications"("userId", "status");

-- CreateIndex
CREATE INDEX "verifications_status_idx" ON "verifications"("status");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
