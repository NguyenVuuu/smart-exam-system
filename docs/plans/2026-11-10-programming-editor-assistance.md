# Programming Editor Assistance Implementation Plan

**Goal:** Give every programming question a minimal runnable starter and standard-library completions for C, C++, and Java.

**Architecture:** Keep static language-specific editor content under the existing `code-editor` directory. The exam page displays a starter only when no saved source exists; Monaco registers one completion provider per language and releases the registrations on editor teardown. The backend and Judge0 continue to receive complete source code.

**Tech Stack:** React, TypeScript, Monaco Editor, Playwright, Judge0.

---

### Task 1: Default source

**Files:** `fe/soes-fe/src/pages/student/components/take-exam/code-editor/programming-starters.ts`, `CodeQuestion.tsx`, `student-take-exam.api.ts`, `take-exam.types.ts`.

1. Add valid, minimal C, C++, and Java programs with no solution logic.
2. Show the language starter only when both the current answer and the saved draft are absent.
3. Verify saved and intentionally cleared answers are never replaced by the starter.

### Task 2: Standard library suggestions

**Files:** `fe/soes-fe/src/pages/student/components/take-exam/code-editor/programming-completions.ts`, `ProgrammingCodeEditor.tsx`.

1. Add curated standard-library completions with signatures and parameter snippets.
2. Register separate providers for C, C++, and Java; support qualified expressions such as `Math.` and `std::`.
3. Dispose registrations when the editor unmounts; do not load a language server or solution generator.

### Task 3: Verify

**Files:** `fe/soes-fe/tests/browser/programming-editor.spec.ts`.

1. Test starter validity and draft precedence, including an explicitly empty draft.
2. Test language-specific, qualified suggestions.
3. Run TypeScript, targeted lint, browser tests, and frontend build; review the diff and commit only feature files.
