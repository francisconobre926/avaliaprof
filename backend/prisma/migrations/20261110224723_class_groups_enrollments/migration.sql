-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SubjectSource" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "student_subjects" ADD COLUMN     "source" "SubjectSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "class_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseYear" INTEGER NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_groups_semesterId_idx" ON "class_groups"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "class_groups_courseId_courseYear_semesterId_name_key" ON "class_groups"("courseId", "courseYear", "semesterId", "name");

-- CreateIndex
CREATE INDEX "enrollments_classGroupId_idx" ON "enrollments"("classGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_semesterId_key" ON "enrollments"("studentId", "semesterId");

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Preserva os estudantes existentes: turma "A" (1.º ano) do seu curso no semestre corrente e matrícula activa.
-- O administrador pode depois mudar a turma. As cadeiras que já tinham ficam como MANUAL.
INSERT INTO "class_groups" ("id", "name", "courseId", "courseYear", "semesterId")
SELECT gen_random_uuid()::text, 'A', u."courseId", 1, s."id"
FROM "users" u CROSS JOIN "semesters" s
WHERE s."isCurrent" AND u."role" = 'STUDENT' AND u."courseId" IS NOT NULL
GROUP BY u."courseId", s."id";

INSERT INTO "enrollments" ("id", "studentId", "semesterId", "classGroupId", "status", "updatedAt")
SELECT gen_random_uuid()::text, u."id", s."id", cg."id", 'ACTIVE', CURRENT_TIMESTAMP
FROM "users" u
JOIN "semesters" s ON s."isCurrent"
JOIN "class_groups" cg ON cg."courseId" = u."courseId" AND cg."semesterId" = s."id" AND cg."courseYear" = 1 AND cg."name" = 'A'
WHERE u."role" = 'STUDENT';
