# Student Face Identity Verification Implementation Plan

**Goal:** Require every student to enroll a face once and pass AWS Face Liveness plus identity matching before a new exam attempt is created on web or mobile.

**Architecture:** The backend owns enrollment, verification state, retry policy, Rekognition calls, and the one-time exam-entry grant. The web renders AWS Amplify Face Liveness. Expo mobile opens that web flow through an authenticated browser session and returns through a deep link. No raw face image or liveness video is stored by SOES.

**Technology:** Express, Prisma/PostgreSQL, AWS Rekognition Face Liveness and face collections, React/Vite, AWS Amplify UI Liveness, Expo WebBrowser and Expo Linking.

## Business rules

- Only the `STUDENT` role enrolls and verifies a face.
- A student is prompted to enroll immediately after first successful student-role login.
- Enrollment may be completed on any supported device.
- Every new attempt for every exam category requires a fresh successful verification.
- Re-entering an existing in-progress attempt requires and consumes a fresh verification. A transient connection loss while the exam screen remains open does not.
- A verification grant is bound to one student and one schedule, expires after five minutes, and is consumed atomically when the attempt is created.
- Three failed checks trigger a two-minute cooldown. After three additional failures, a proctor must approve a manual override with a reason.
- Enrollment, failures, successes, cooldowns, grant consumption, and overrides are audited.
- The application stores Rekognition identifiers, confidence scores, timestamps, and status only; it does not persist raw biometric media.

## Required AWS configuration

- `AWS_FACE_REGION`
- `AWS_FACE_COLLECTION_ID`
- Backend AWS credentials through the standard AWS credential chain
- `VITE_AWS_FACE_REGION`
- `VITE_AWS_FACE_IDENTITY_POOL_ID` with a narrowly scoped role that can only start Face Liveness sessions
- Public HTTPS web URL used by mobile, and the `soes://` application deep-link scheme

## Task 1: Persistence and configuration

- Add Prisma enums and models for face profiles and verification sessions.
- Add one-time verification linkage to exam attempts.
- Add environment-backed configuration with secure defaults and startup validation.
- Generate the migration and Prisma client.
- Build the backend.

Commit: `feat(face): add biometric verification persistence`

## Task 2: Backend enrollment and verification API

- Add a `student-face-verification` module with routes, validators, controllers, services, repositories, and providers.
- Implement Rekognition collection/user enrollment and liveness result evaluation.
- Enforce ownership, expiry, confidence thresholds, retry cooldown, manual-review state, and audit logging.
- Add status, create-session, complete-session, and mobile handoff endpoints.
- Add request throttling for session creation and completion.
- Build the backend.

Commit: `feat(face): add secure student face verification api`

## Task 3: Exam-entry enforcement and manual override

- Require a successful unconsumed schedule-bound verification for every new attempt.
- Consume the verification in the same transaction that creates the attempt.
- Require a fresh verification when an active attempt is re-entered and attach the new verification record to that attempt.
- Add proctor-authorized manual override with mandatory reason and audit trail.
- Build the backend.

Commit: `feat(exams): gate new attempts with face verification`

## Task 4: Web enrollment and verification experience

- Add lazy-loaded Amplify Face Liveness UI.
- Add student enrollment and exam-entry verification pages.
- Redirect students requiring enrollment after student-role login.
- Update exam start UI to verify first, then submit the one-time verification ID.
- Show cooldown, retry, expiry, and manual-review states without exposing AWS details.
- Build and lint the web app.

Commit: `feat(web): add student face enrollment and exam verification`

## Task 5: Expo mobile handoff

- Add secure browser handoff to the hosted web verification flow.
- Add deep-link callback validation and one-time state correlation.
- Redirect first-login students to enrollment.
- Gate mobile exam start and refresh status after returning from the browser.
- Verify iOS and Android layouts and run mobile lint/type checks.

Commit: `feat(mobile): add face verification browser handoff`

## Task 6: Verification and handoff

- Run Prisma validation and migration status.
- Run backend and web builds plus mobile lint/type checks.
- Confirm no raw image, video, AWS secret, or biometric payload is logged or stored.
- Document AWS IAM/Cognito permissions and deployment environment values.

Commit: `docs(face): add deployment and security runbook`
