-- CreateEnum
CREATE TYPE "ClassRegime" AS ENUM ('LABORAL', 'POS_LABORAL');

-- Course.code: abreviatura para o nome das turmas
ALTER TABLE "courses" ADD COLUMN "code" TEXT;
UPDATE "courses" SET "code" = CASE "name"
  WHEN 'Engenharia Informática' THEN 'Info'
  WHEN 'Gestão de Empresas' THEN 'Gest'
  WHEN 'Economia' THEN 'Econ'
  WHEN 'Direito' THEN 'Dir'
  ELSE initcap(left(regexp_replace("name", '[^A-Za-z]', '', 'g'), 4)) END;
ALTER TABLE "courses" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- ClassGroup.regime: as turmas A passam a laboral e as B a pós-laboral; nomes regenerados
ALTER TABLE "class_groups" ADD COLUMN "regime" "ClassRegime" NOT NULL DEFAULT 'LABORAL';
UPDATE "class_groups" SET "regime" = 'POS_LABORAL' WHERE "name" = 'B';
UPDATE "class_groups" g SET "name" = c."code" || g."courseYear" || 'Lab' || s."number" || CASE g."regime" WHEN 'LABORAL' THEN 'L' ELSE 'P' END
  FROM "courses" c, "semesters" s WHERE c."id" = g."courseId" AND s."id" = g."semesterId";
CREATE UNIQUE INDEX "class_groups_courseId_courseYear_semesterId_regime_key" ON "class_groups"("courseId", "courseYear", "semesterId", "regime");
