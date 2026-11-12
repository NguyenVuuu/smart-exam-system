# Agent Question Generation Implementation Plan

**Goal:** Route teacher question drafts through the Python agent while keeping existing validation, history, and teacher approval.

**Architecture:** The backend remains the authorization and data boundary. It loads only teacher-owned sources, builds the existing requirements, and reviews every draft. The authenticated Python service invokes the configured LangChain model for one draft or correction at a time. The backend selects the agent when enabled and preserves the direct Gemini path when the agent is disabled.

**Tech Stack:** Express, TypeScript, Zod, FastAPI, Pydantic, LangChain, Gemini.

---

### Task 1: Python draft endpoint

**Files:** `ai-agent/src/soes_agent/contracts.py`, `ai-agent/src/soes_agent/main.py`, `ai-agent/src/soes_agent/question_generation.py`, `ai-agent/tests/test_question_generation.py`.

1. Add a bounded authenticated request containing the prompt, trusted output schema, and text/PDF/image parts.
2. Generate one structured response with the configured model. Return only the draft JSON; never persist source data.
3. Test authentication, payload bounds, and model invocation without a live API call.
4. Run Python tests.

### Task 2: Backend integration

**Files:** `be/soes-be/src/modules/ai-question-generation/services/gemini-question.service.ts`, `be/soes-be/src/modules/ai-question-generation/services/ai-question-generation.service.ts`, `be/soes-be/src/modules/ai-agents/services/ai-agent.client.ts`, backend tests.

1. Reuse the existing two-attempt review and correction loop with an agent transport.
2. Keep teacher ownership checks, source limits, generation history, progress, and pending-review output unchanged.
3. Use the agent when enabled; retain the direct Gemini path when disabled. Never silently fall back after an agent error.
4. Test routing, invalid drafts, correction, and provider failure; run backend build and tests.

### Task 3: Operational verification

**Files:** `ai-agent/README.md`, evaluation notes if a provider check succeeds.

1. Document the routing and service startup requirements.
2. Run available builds and local smoke checks. Record provider failures without overstating model quality.
3. Review the diff for unnecessary code and credentials, then commit only task files.
