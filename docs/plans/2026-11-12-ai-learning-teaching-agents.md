# Learning and Teaching AI Agents Implementation Plan

**Goal:** Add auditable learning and exam-design assistants without letting a language model decide exam scores or publish exam content.

**Architecture:** The existing TypeScript API remains the authority for authentication, authorization, exam data, and writes. A backend module uses LangChain and LangGraph for bounded workflows with typed, authorized service tools. Deterministic TypeScript analysis produces all numeric claims; model output is validated before display or draft creation.

**Tech Stack:** Prisma/PostgreSQL, Express/TypeScript, `@langchain/langgraph`, `@langchain/core`, configured LLM provider, React, Expo.

---

## Invariants

- Student tools use the authenticated student profile and released results only. No official exam question or answer is exposed early.
- Teacher tools scope data to owned or assigned courses, exams, and schedules.
- Generated questions and exams remain drafts until existing teacher review and publishing rules pass.
- Practice attempts never count as official exam attempts or scores.
- Judge remains authoritative for programming scores. Model feedback cannot mutate scores.
- Agent graphs call authorized backend services; graph nodes do not bypass domain repositories or expose private tools to clients.
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

## Task 4: TypeScript LangGraph module and typed boundary

**Files:** new `be/soes-be/src/modules/ai-agents/` module, config and contract tests.

1. Reuse backend authentication and expose typed, role-scoped tools to graph nodes.
2. Add LangGraph state, checkpoints, structured outputs, step budgets and model-provider configuration.
3. Audit tool names, IDs, model version, latency and status without logging secrets or unreleased content; commit.

## Task 5: Teacher analysis workflow

**Files:** TypeScript teacher graph, authorized service tools, React teacher page, tests.

1. Let the teacher query item/topic/class/schedule metrics.
2. Require every numeric claim to reference a tool result and sample size.
3. Show insufficient evidence rather than inventing a conclusion; commit.

## Task 6: Teacher exam design workflow

**Files:** TypeScript teacher graph, existing `teacher-exams` auto-generation service adapters, teacher UI, tests.

1. Convert the teacher's request into a validated matrix proposal.
2. Require teacher confirmation; call the existing deterministic matrix generator.
3. Check coverage, point total, duplication, approved status and ownership; save an exam draft only; commit.

## Task 7: Missing-question drafts

**Files:** AI generation adapter, existing question audit and Judge validation modules, teacher review UI, tests.

1. Generate drafts only for measured bank shortages.
2. Run question rules and programming test cases where applicable.
3. Require the existing human approval path before bank or exam inclusion; commit.

## Task 8: Student learning workflow

**Files:** TypeScript student graph, authorized service tools, web/mobile student screens, tests.

1. Explain released personal results and prioritized weak topics with grounded evidence.
2. Build a revision plan and answer follow-up questions from allowed material.
3. Provide no agent access during an active exam; commit.

## Task 9: Adaptive practice and feedback

**Files:** `student-practice` services, TypeScript student graph, web/mobile screens, tests.

1. Select approved questions or validated generated practice drafts.
2. Grade practice with deterministic rules and adjust future difficulty from practice outcomes.
3. Suggest programming feedback from Judge data without changing official grades; commit.

## Task 10: Evaluation and operations

**Files:** `be/soes-be/src/modules/ai-agents/evals/`, integration/security tests, documentation.

1. Build labeled cases for numerical accuracy, access boundaries, answer leaks, matrix validity and output quality.
2. Track acceptance by teachers, latency, provider errors and cost; compare with non-agent baseline.
3. Document model/data limitations. Fine-tuning requires a separate consented, labeled dataset and an evaluation showing improvement; commit.
