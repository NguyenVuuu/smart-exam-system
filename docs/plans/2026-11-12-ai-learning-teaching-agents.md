# Learning and Teaching AI Agents Implementation Plan

**Goal:** Add auditable learning and exam-design assistants without letting a language model decide exam scores or publish exam content.

**Architecture:** The existing TypeScript API remains the authority for authentication, authorization, exam data, and writes. A private Python service uses LangChain and LangGraph for bounded workflows and calls typed, authorized backend tools. Deterministic TypeScript analysis produces all numeric claims; model output is validated before display or draft creation.

**Tech Stack:** Prisma/PostgreSQL, Express/TypeScript, Python/FastAPI, LangChain/LangGraph, configured LLM provider, React, Expo.

---

## Invariants

- Student tools use the authenticated student profile and released results only. No official exam question or answer is exposed early.
- Unreleased or non-reviewable exams never contribute per-question or per-topic performance to student answers. Course material and practice are separate, authorized learning sources.
- Teacher tools scope data to owned or assigned courses, exams, and schedules.
- Generated questions and exams remain drafts until existing teacher review and publishing rules pass.
- Practice attempts never count as official exam attempts or scores.
- Judge remains authoritative for programming scores. Model feedback cannot mutate scores.
- The Python service has no direct database credentials and is not exposed to clients. Backend tool endpoints check role and data scope.
- Do not modify or commit `docker-compose.yml` or any `.env` file.

## Task 1: Learning taxonomy and historical snapshots

**Files:** `be/soes-be/prisma/schema.prisma`, a new `be/soes-be/prisma/migrations/*/migration.sql`, question creation and exam snapshot modules, focused tests.

1. Add subject-scoped topic/outcome records and question assignments.
2. Snapshot assigned topics when a question enters an exam; old questions remain explicitly untagged until reviewed.
3. Validate schema, migration and snapshot behavior; commit.

## Task 2: Practice isolation and result access

**Files:** Prisma schema/migration, new `student-practice` module, existing result policy module, focused authorization tests.

1. Persist practice sets, items and submissions separately from official exams.
2. Reuse result release policy for official results and answer explanations.
3. Enforce student ownership in repository queries; commit.

## Task 3: Deterministic analytics

**Files:** new `learning-analytics` module with repository, pure calculators, services, tests.

1. Compute personal topic mastery from released graded answers with sample size.
2. Compute teacher item, topic and class statistics from authorized attempts, with insufficient-data flags.
3. Add fixture-based tests for denominators, missing answers, partial credit and release boundaries; commit.

## Task 4: Private Python service and typed boundary

**Files:** new `ai-agent/` Python package, Node `ai-agents` module, config and contract tests.

1. Implement private authenticated service-to-service calls with bounded timeout and response schemas.
2. Add a bounded, stateless LangGraph workflow, structured outputs and model-provider configuration. Add durable checkpoints only when a multi-request workflow needs them.
3. Audit tool names, IDs, model version, latency and status without logging secrets or unreleased content; commit.

## Task 5: Teacher analysis workflow

**Files:** Python teacher graph, authorized backend tools, React teacher page, tests.

1. Let the teacher query item/topic/class/schedule metrics.
2. Require every numeric claim to reference a tool result and sample size.
3. Show insufficient evidence rather than inventing a conclusion; commit.

## Task 6: Teacher exam design workflow

**Files:** Python teacher graph, existing `teacher-exams` auto-generation service adapters, teacher UI, tests.

1. Convert the teacher's request into a validated matrix proposal.
2. Require teacher confirmation; call the existing deterministic matrix generator.
3. Check coverage, point total, duplication, approved status and ownership; save an exam draft only; commit.

## Task 7: Missing-question drafts

**Files:** AI generation adapter, existing question audit and Judge validation modules, teacher review UI, tests.

1. Generate drafts only for measured bank shortages.
2. Run question rules and programming test cases where applicable.
3. Require the existing human approval path before bank or exam inclusion; commit.

## Task 8: Student learning workflow

**Files:** Python student graph, authorized backend tools, web/mobile student screens, tests.

1. Explain released personal results and prioritized weak topics with grounded evidence.
2. When released review data is unavailable, use only material visible to the student in an enrolled course. The teacher's `aiEnabled` flag controls teacher question generation and must not be reused for student access. Cite the material and location; disclose when no source supports an answer.
3. Build a revision plan and answer follow-up questions from allowed material. Keep material summaries distinct from exam-performance conclusions.
4. Provide no agent access during an active exam; commit.

## Task 9: Adaptive practice and feedback

**Files:** `student-practice` services, Python student graph, web/mobile screens, tests.

1. Select approved questions or generate practice drafts from authorized course material; never copy hidden official exam content or answer keys.
2. Validate each draft against cited material and answer consistency before persisting an isolated practice set.
3. Grade practice with deterministic rules and adjust future difficulty from practice outcomes.
4. Suggest programming feedback from Judge data without changing official grades; commit.

## Task 10: Evaluation and operations

**Files:** `ai-agent/evals/`, Node integration/security tests, documentation.

1. Build labeled cases for numerical accuracy, access boundaries, answer leaks, matrix validity and output quality.
2. Track acceptance by teachers, latency, provider errors and cost; compare with non-agent baseline.
3. Document model/data limitations. Fine-tuning requires a separate consented, labeled dataset and an evaluation showing improvement; commit.
