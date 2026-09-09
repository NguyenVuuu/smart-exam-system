# Question Audit Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make question auditing accurate, scalable at the API boundary, and easy to act on by showing one row per question with every detected issue.

**Architecture:** The backend owns a pure question-audit rule engine and exposes a teacher-authorized, filtered, paginated endpoint. The frontend consumes that contract with React Query and renders question-level results; create/update validation reuses the same blocking rules so saved data and audit results cannot drift.

**Tech Stack:** Express, TypeScript, Zod, Prisma, React, TanStack Query, Tailwind CSS.

---

### Task 1: Centralize Question Audit Rules

**Files:**
- Create: `be/soes-be/src/modules/teacher-questions/services/question-audit.rules.ts`
- Create: `be/soes-be/src/modules/teacher-questions/services/question-audit.rules.test.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/services/teacher-questions.service.ts`

1. Define typed issue codes, field paths, severities, and the auditable question contract.
2. Add tests for objective questions, true/false questions, programming limits, public test cases, duplicate test cases, and warning-only questions.
3. Run the rule tests and verify failures before implementation.
4. Implement the pure rule engine and exclusive question-level severity classification.
5. Reuse blocking audit rules from create/update validation.
6. Run the rule tests and backend build.

### Task 2: Add the Paginated Audit API

**Files:**
- Modify: `be/soes-be/src/modules/teacher-questions/validators/teacher-questions.validator.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/repositories/teacher-questions.repository.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/services/teacher-questions.service.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/controllers/teacher-questions.controller.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/routes/teacher-questions.routes.ts`
- Modify: `be/soes-be/src/modules/teacher-questions/dtos/teacher-question.dto.ts`

1. Validate `page`, `pageSize`, `severity`, and `keyword` query parameters with Zod.
2. Load only active personal questions through the repository layer.
3. Audit and classify questions, filter problematic questions, then return 10 rows per page.
4. Return exclusive KPI counts whose sum equals the total audited question count.
5. Keep authorization on the existing teacher router.
6. Run backend tests and TypeScript build.

### Task 3: Add the Frontend Audit Contract and Query Hook

**Files:**
- Modify: `fe/soes-fe/src/pages/teacher/types/teacher-question-api.types.ts`
- Modify: `fe/soes-fe/src/pages/teacher/api/teacher-questions.api.ts`
- Create: `fe/soes-fe/src/pages/teacher/hooks/useQuestionAudit.ts`

1. Add API DTOs for grouped issues, summary, and pagination.
2. Add the audit API client method.
3. Add a React Query hook with stable query keys and previous-page placeholder data.
4. Support explicit refresh after editing or pressing “Rà soát lại”.

### Task 4: Render One Row per Question

**Files:**
- Modify: `fe/soes-fe/src/pages/teacher/TeacherQuestionAuditPage.tsx`
- Modify: `fe/soes-fe/src/pages/teacher/components/question-audit/QuestionAuditMetrics.tsx`
- Modify: `fe/soes-fe/src/pages/teacher/components/question-audit/QuestionAuditToolbar.tsx`
- Create: `fe/soes-fe/src/pages/teacher/components/question-audit/QuestionAuditTable.tsx`
- Delete: `fe/soes-fe/src/pages/teacher/utils/QuestionAuditRules.ts`

1. Replace client-side full-bank scanning with the server query hook.
2. Display each question once and list all issues compactly beneath its title.
3. Display highest severity and issue count in one badge.
4. Make KPI labels explicitly question-based and keep counts exclusive.
5. Use server pagination with 10 questions per page.
6. Keep filters stable and reset page to one when filters change.

### Task 5: Correct Save and Refresh Behavior

**Files:**
- Modify: `fe/soes-fe/src/pages/teacher/TeacherQuestionAuditPage.tsx`

1. Let failed saves propagate to the editor so entered data remains open.
2. On success, close the editor and refresh the current audit query.
3. Confirm that fixed questions disappear or update without duplicating rows.

### Task 6: Verification and Clean-Code Guard

1. Run backend audit-rule tests.
2. Run `npm run build` in `be/soes-be`.
3. Run `npm run lint` and `npm run build` in `fe/soes-fe`.
4. Review the final diff for duplicated rules, swallowed errors, unused code, unstable list keys, and unrelated changes.
5. Confirm `fe/soes-fe/vite.config.ts` remains untouched.

