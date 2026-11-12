-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PUBLISHED', 'BLOCKED', 'PENDING_REVIEW', 'HIDDEN', 'REMOVED');

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "comment",
ADD COLUMN     "periodId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL,
    "reason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comments_evaluationId_key" ON "comments"("evaluationId");

-- CreateIndex
CREATE INDEX "comments_status_idx" ON "comments"("status");

-- CreateIndex
CREATE INDEX "comments_textHash_idx" ON "comments"("textHash");

-- CreateIndex
CREATE INDEX "evaluations_semesterId_idx" ON "evaluations"("semesterId");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

