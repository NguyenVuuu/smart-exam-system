# Performance completion implementation plan

**Goal:** Finish remaining implementation from PERFORMANCE_AUDIT.md while preserving grading, authorization, AI and detection behavior.

**Architecture:** Keep the modular monolith and existing contracts. Persist pending phone evidence in bounded browser storage, encrypt images with a tab-session key, restore only for the authenticated owner and attempt, and delete acknowledged/expired evidence. No new server tables or infrastructure.

**Tech stack:** TypeScript, IndexedDB, Web Crypto, React, Playwright and existing Python evaluation runner.

1. Add browser regression coverage for exact-frame reload recovery, owner isolation, expiry, capacity, logout cleanup and failed storage. Implement the small storage utility and connect it to the existing phone upload queue. Keep detection thresholds/timing unchanged.
2. Run targeted lint, browser regressions, vision tests and frontend build. Review diff and commit F18 checkpoint.
3. Run current lint/quality gates and fix relevant remaining failures without suppressing rules. Run the existing synthetic AI evaluation against configured services when available; report provider failures honestly, without changing prompts/models or fabricating human labels.
4. Reconcile F01–F22 status with actual evidence and document rollback/verification limits. WAN/NAT/load-balancer and long-duration physical camera tests are excluded from this iteration per the user's request; exclusion is not a passing result.
5. Commit verified implementation and report, excluding research, outputs and measure-learning-ai.ts. Do not push or migrate further.
