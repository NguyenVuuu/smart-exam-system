# Realtime Proctoring Implementation

## Scope Completed

This document records the implemented realtime proctoring architecture after the Socket.IO/Redis/MinIO upgrade.

Completed items:

- Socket.IO gateway for proctoring dashboard and WebRTC signaling.
- JWT authentication for socket connections.
- Teacher schedule rooms and student attempt rooms.
- Redis-backed live camera session state.
- Socket.IO Redis adapter for multi-instance event propagation.
- Socket-based WebRTC offer, answer, and ICE candidate exchange.
- Realtime violation broadcast to teacher dashboards.
- Realtime heartbeat and offline broadcast.
- MinIO-first evidence storage with production-safe failure behavior.

## Runtime Architecture

REST API remains the source of truth for persistent data:

- exam attempts
- exam sessions
- violations
- violation evidence metadata
- review status
- invalidation actions

Socket.IO is used for live state and realtime events:

- student heartbeat updates
- student offline events
- newly created violations
- ended violations
- reviewed violations
- live camera request
- WebRTC offer/answer
- WebRTC ICE candidates
- live session end

## Socket Rooms

The gateway uses room scoping to prevent cross-schedule leakage:

- `proctoring:schedule:{scheduleId}` for teacher dashboards and schedule-wide events.
- `proctoring:attempt:{attemptId}` for events targeted at a single student's attempt.
- `proctoring:teacher:{teacherId}` for signaling responses targeted at the requesting teacher.

All socket joins are authenticated with the same JWT access token used by REST APIs.

## Authorization Rules

Teacher schedule access is checked through the existing teacher exam grading access rules.

A teacher can join a schedule room or request live camera only when they are allowed to proctor or manage the schedule.

A student can join only the attempt room for their own active attempt. The server validates:

- schedule id
- attempt id
- student profile id
- attempt is still in progress
- attempt deadline has not passed

## Live Camera Signaling

The previous REST polling signaling endpoints remain available as fallback, but the primary flow is now socket-driven:

1. Teacher emits `live:request_camera`.
2. Backend validates access and creates a Redis live session.
3. Backend emits `live:request` to the student's attempt room.
4. Student creates a WebRTC offer and emits `live:student_offer`.
5. Backend stores the offer in Redis and emits `live:offer` to the teacher room.
6. Teacher creates an answer and emits `live:teacher_answer`.
7. Backend stores the answer in Redis and emits `live:answer` to the student's attempt room.
8. Both sides exchange candidates using `live:student_candidate` and `live:teacher_candidate`.

## Redis Live Session Store

Live session state is no longer stored in a process-local `Map`.

Redis stores:

- session id
- attempt id
- schedule id
- teacher id
- status
- offer
- answer
- student ICE candidates
- teacher ICE candidates
- created/updated timestamps

TTL policy:

- requested session: 30 seconds
- active/offered/connected session: 10 minutes
- ended session: short expiry

This makes live signaling safer across backend restarts and compatible with multiple backend instances.

## Realtime Violation Broadcast

When a student records a violation, the backend:

1. Validates attempt ownership and active attempt state.
2. Creates the violation record.
3. Uploads evidence to MinIO when files are present.
4. Stores evidence metadata in PostgreSQL.
5. Emits `violation:created` to the schedule room.

When a violation is ended, the backend emits `violation:ended`.

When a teacher reviews a violation, the backend emits `violation:reviewed`.

## Online And Offline Reliability

Student heartbeat still persists to `ExamSession`.

Each heartbeat emits `student:heartbeat` to the schedule room with:

- attempt id
- schedule id
- webcam status
- heartbeat time
- remaining seconds
- online state

The existing background job marks stale sessions offline after the configured heartbeat timeout. It now emits `student:offline` for each attempt that crosses the timeout.

This gives the dashboard fast updates while preserving DB-based recovery.

## Evidence Storage

Evidence is MinIO-first.

Production behavior:

- If MinIO evidence upload fails and `NODE_ENV=production`, the request fails.
- The database stores only metadata and object names, not binary evidence.
- Viewing evidence uses presigned URLs.

Development behavior:

- Local fallback is still available unless `MINIO_REQUIRE_EVIDENCE_STORAGE=true`.
- Local fallback is intended only for development.

Object paths are now grouped by evidence kind:

```text
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/webcam/{attemptId}/{violationId}.jpg
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/screen/{attemptId}/{violationId}.jpg
```

## Remaining Gaps

Not completed in this batch:

- Live screen monitoring with `getDisplayMedia`.
- Teacher manual evidence capture from live webcam/screen stream.
- Socket event handling for submitted/progress-updated beyond heartbeat.
- Persisted audit records for every socket live action.
- Automated tests for socket authorization and live signaling.
- TURN server configuration for restrictive networks.
