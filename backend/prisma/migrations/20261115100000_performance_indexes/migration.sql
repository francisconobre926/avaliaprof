-- CreateIndex
CREATE INDEX "course_subjects_subjectId_idx" ON "course_subjects"("subjectId");
-- CreateIndex
CREATE INDEX "enrollments_semesterId_status_idx" ON "enrollments"("semesterId", "status");
-- CreateIndex
CREATE INDEX "evaluation_periods_semesterId_status_closesAt_idx" ON "evaluation_periods"("semesterId", "status", "closesAt");
-- CreateIndex
CREATE INDEX "evaluations_studentId_semesterId_idx" ON "evaluations"("studentId", "semesterId");
-- CreateIndex
CREATE INDEX "evaluations_subjectId_semesterId_idx" ON "evaluations"("subjectId", "semesterId");
-- CreateIndex
CREATE INDEX "evaluations_periodId_idx" ON "evaluations"("periodId");
-- CreateIndex
CREATE INDEX "student_subjects_courseSubjectId_semesterId_idx" ON "student_subjects"("courseSubjectId", "semesterId");
-- CreateIndex
CREATE INDEX "teacher_subjects_subjectId_idx" ON "teacher_subjects"("subjectId");
