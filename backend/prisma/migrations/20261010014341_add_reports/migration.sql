-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FRAUDE', 'INFORMACAO_FALSA', 'IMOVEL_INDISPONIVEL', 'CONTEUDO_IMPROPRIO', 'DUPLICADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDENTE', 'PROCEDENTE', 'IMPROCEDENTE');

-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'SUSPENSO';

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDENTE',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporterId_listingId_key" ON "reports"("reporterId", "listingId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
