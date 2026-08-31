CREATE UNIQUE INDEX "Teacher_single_department_head"
ON "Teacher" ("departmentId")
WHERE "position" = 'DEPARTMENT_HEAD' AND "departmentId" IS NOT NULL;
