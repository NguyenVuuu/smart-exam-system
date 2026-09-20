# AI Generation Latency Implementation Plan

**Goal:** Reduce avoidable retries and output volume while preserving question validation and teacher review.

**Architecture:** Keep the existing synchronous generation endpoint. Use the authenticated teacher Socket.IO room for optional, request-scoped progress. Process whole source documents without page selection, as requested by the user. Do not change database tables, model selection, authentication, or student code.

**Assumptions:** Source access is checked on every request. No persistent caching of private documents. Gemini latency is external and no fixed response-time guarantee is possible. Keep the existing shared AI timeout and at most one correction request.

## Decisions
- Use a compact objective-question response schema; derive duplicate content and irrelevant programming defaults locally.
- Validate each question independently, retain valid items in their original positions, and request only missing/invalid replacements. Validate the merged output again, including duplicates.
- Log only validation field paths/codes, timings and counts, never generated answers, source text or credentials.
- Keep full-document processing. Remove page-selection controls, request fields, PDF slicing helpers, associated tests and the unused pdf-lib dependency.
- Progress is based on server stages, never fabricated percentages. HTTP remains authoritative if the socket disconnects.

## Tasks
1. Add regression tests for compact objective normalization, field diagnostics and partial correction, then update schema/validation/generation services.
2. Preserve source authorization and full-document preparation.
3. Add request IDs and authenticated progress events; reuse one frontend hook and status component in both generation entry points.
4. Keep document selection simple, without page-range controls or extra history metadata.
5. Run focused backend tests, backend/frontend builds and frontend lint; inspect responsive UI with mocked API responses if authentication is unavailable.
6. Report verified outcomes separately from external performance measurements; provide a commit command without committing user changes.

## Verification Results
- The initial implementation passed 24 backend tests and 3 frontend page-selection tests. The user subsequently requested removal of page selection; its 4 backend and 3 frontend tests were removed with the feature.
- Backend and frontend production builds passed. Frontend retains its existing large-bundle warning.
- Targeted ESLint passed for changed frontend production files; `git diff --check` passed.
- A real Gemini run on short synthetic Java notes returned 3 HARD questions in 17.9 seconds, including a 4.4-second repair of one overlong title while retaining two valid questions. This is not a like-for-like benchmark against the user's PDF. The prompt was subsequently tightened to prefer titles of 120-170 characters within the existing 200-character limit.
- Frontend dev server responded HTTP 200 on port 5180. Browser visual verification was unavailable because no browser surface was connected; end-to-end authenticated UI testing remains outstanding.
