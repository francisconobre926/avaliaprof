-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- CreateTable
CREATE TABLE "course_subjects" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "courseYear" INTEGER NOT NULL,
    "semesterNumber" INTEGER NOT NULL,

    CONSTRAINT "course_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_subjects_courseId_subjectId_key" ON "course_subjects"("courseId", "subjectId");

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserva a ligação cadeira->curso existente (ano 1 / semestre 1 provisórios; o seed ou o admin corrigem).
INSERT INTO "course_subjects" ("id", "courseId", "subjectId", "courseYear", "semesterNumber")
SELECT gen_random_uuid()::text, "courseId", "id", 1, 1 FROM "subjects";

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_courseId_fkey";

-- DropIndex
DROP INDEX "subjects_courseId_name_key";

-- DropIndex
DROP INDEX "subjects_departmentId_idx";

-- AlterTable
ALTER TABLE "semesters" DROP COLUMN "isOpen",
ADD COLUMN     "academicYearId" TEXT NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "courseId";

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "publicCode" TEXT,
ADD COLUMN     "userId" TEXT;
-- Fichas existentes recebem um código opaco aleatório (não derivado do id).
UPDATE "teachers" SET "publicCode" = substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 24);
ALTER TABLE "teachers" ALTER COLUMN "publicCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "student_subjects" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_periods" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'CLOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_courses" (
    "periodId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "period_courses_pkey" PRIMARY KEY ("periodId","courseId")
);

-- CreateTable
CREATE TABLE "period_course_subjects" (
    "periodId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,

    CONSTRAINT "period_course_subjects_pkey" PRIMARY KEY ("periodId","courseSubjectId")
);

-- CreateIndex
CREATE INDEX "student_subjects_studentId_semesterId_idx" ON "student_subjects"("studentId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "student_subjects_studentId_courseSubjectId_semesterId_key" ON "student_subjects"("studentId", "courseSubjectId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_label_key" ON "academic_years"("label");

-- CreateIndex
CREATE INDEX "evaluation_periods_semesterId_idx" ON "evaluation_periods"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_academicYearId_number_key" ON "semesters"("academicYearId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_departmentId_name_key" ON "subjects"("departmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_publicCode_key" ON "teachers"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_periods" ADD CONSTRAINT "evaluation_periods_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_courses" ADD CONSTRAINT "period_courses_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_courses" ADD CONSTRAINT "period_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_course_subjects" ADD CONSTRAINT "period_course_subjects_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_course_subjects" ADD CONSTRAINT "period_course_subjects_courseSubjectId_fkey" FOREIGN KEY ("courseSubjectId") REFERENCES "course_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

