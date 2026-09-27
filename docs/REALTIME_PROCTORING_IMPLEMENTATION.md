# Realtime Proctoring Implementation

## Scope

Realtime proctoring hiện dùng kết hợp REST API, Socket.IO, Redis, WebRTC, MinIO và PostgreSQL.

REST API là nguồn sự thật cho dữ liệu bền vững:

- `ExamAttempt`
- `ExamSession`
- `Violation`
- `ViolationEvidence`
- review/invalidation actions

Socket.IO dùng cho live state và signaling:

- heartbeat/offline broadcast
- violation created/ended/reviewed broadcast
- live webcam/screen request
- WebRTC offer/answer/ICE candidates
- live session end

## Socket Gateway

Gateway: `be/soes-be/src/modules/proctoring/proctoring-realtime.gateway.ts`.

Socket events:

- `proctoring:join_schedule`
- `proctoring:join_attempt`
- `live:request_camera`
- `live:request_screen`
- `live:student_offer`
- `live:teacher_answer`
- `live:student_candidate`
- `live:teacher_candidate`
- `live:end`

## Socket Rooms

- `proctoring:schedule:{scheduleId}`: teacher dashboards theo schedule.
- `proctoring:attempt:{attemptId}`: student attempt room.
- `proctoring:teacher:{teacherId}`: responses/signaling hướng tới teacher.

Tất cả socket joins dùng JWT access token giống REST API.

## Authorization

Teacher:

- Chỉ join schedule hoặc request live stream khi có quyền proctor/manage schedule.
- Access được kiểm tra qua các rule hiện có trong teacher exam/proctoring service.

Student:

- Chỉ join attempt room của chính mình.
- Server validate schedule id, attempt id, student profile id, attempt còn active và deadline chưa hết.

## Live Webcam/Screen Flow

1. Teacher emit `live:request_camera` hoặc `live:request_screen`.
2. Backend validate quyền và tạo live session trong Redis.
3. Backend emit `live:request` tới `proctoring:attempt:{attemptId}`.
4. Student tạo WebRTC offer và emit `live:student_offer`.
5. Backend lưu offer vào Redis và emit `live:offer` tới teacher room.
6. Teacher tạo answer và emit `live:teacher_answer`.
7. Backend lưu answer vào Redis và emit `live:answer` tới attempt room.
8. Hai bên trao đổi ICE candidates qua `live:student_candidate` và `live:teacher_candidate`.
9. Teacher hoặc student kết thúc bằng `live:end`.

REST signaling endpoints trong teacher exams module vẫn tồn tại làm fallback/compatibility.

## Redis Live Session Store

Redis lưu:

- session id
- attempt id
- schedule id
- teacher id
- stream type (`WEBCAM` hoặc `SCREEN`)
- status
- offer
- answer
- student ICE candidates
- teacher ICE candidates
- created/updated timestamps

TTL:

- requested session: ngắn hạn để tránh session treo.
- active/offered/connected session: dài hơn nhưng vẫn tự hết hạn.
- ended session: expire nhanh.

## Heartbeat and Online State

Student heartbeat cập nhật `ExamSession`:

- `lastHeartbeat`
- `isOnline`
- `webcamStatus`
- `screenShareStatus`
- `lastWebcamHeartbeatAt`
- `lastScreenHeartbeatAt`

Gateway broadcast `student:heartbeat` tới schedule room.

Background job trong `exam-attempt.jobs.ts` đánh dấu stale sessions offline theo `HEARTBEAT_TIMEOUT` và emit `student:offline`.

## Violation Recording

Các violation được lưu vào `Violation`:

- `violationType`
- `source`: `WEBCAM`, `SCREEN`, `BROWSER`, `PROCTOR`
- `severity`
- `detectedBy`: `SYSTEM`, `PROCTOR`
- `reviewStatus`
- `metadata`
- timing fields

Các violation hiện hỗ trợ:

- `TAB_SWITCH`
- `FULLSCREEN_EXIT`
- `NO_FACE`
- `MULTIPLE_FACES`
- `INACTIVITY`
- `LOOKING_AWAY`
- `PHONE_DETECTED`
- `COPY_PASTE`
- `RIGHT_CLICK`
- `CAMERA_BLOCKED`
- `CAMERA_DISCONNECTED`
- `CAMERA_PERMISSION_DENIED`
- `SCREEN_SHARE_STOPPED`
- `SCREEN_PERMISSION_DENIED`
- `PROCTOR_WEBCAM_CAPTURE`
- `PROCTOR_SCREEN_CAPTURE`

Khi tạo/end/review violation, backend broadcast tương ứng tới schedule room.

## Evidence Storage

Evidence binary lưu ở MinIO. Database chỉ lưu metadata trong `ViolationEvidence`.

Evidence types:

- `WEBCAM_IMAGE`
- `SCREEN_IMAGE`

Object path khuyến nghị:

```text
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/webcam/{attemptId}/{violationId}.jpg
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/screen/{attemptId}/{violationId}.jpg
```

Production behavior:

- Nếu MinIO upload thất bại và `NODE_ENV=production`, request thất bại.
- Presigned URL dùng để xem evidence.

Development behavior:

- Có local fallback trừ khi `MINIO_REQUIRE_EVIDENCE_STORAGE=true`.

## Screen Monitoring

Khi `ExamSchedule.enableScreenMonitoring=true`:

- Student pre-check yêu cầu `getDisplayMedia`.
- `screenShareStatus` phản ánh `PENDING_PERMISSION`, `ACTIVE`, `STOPPED`, `PERMISSION_DENIED`.
- Từ chối quyền sinh `SCREEN_PERMISSION_DENIED`.
- Dừng chia sẻ sinh `SCREEN_SHARE_STOPPED`.
- Teacher có thể request live screen và chụp bằng chứng màn hình.

## Webcam Monitoring

Khi `ExamSchedule.enableWebcam=true`:

- Student pre-check yêu cầu camera.
- MediaPipe Face Landmarker hỗ trợ phát hiện khuôn mặt.
- Vision worker/assets được đồng bộ bằng `scripts/sync-vision-assets.mjs`.
- Test liên quan nằm ở frontend `tests/vision-worker.test.mjs` và Playwright specs.

Các event webcam gồm không có mặt, nhiều mặt, nhìn lệch, camera bị che/mất quyền/mất kết nối và phone detection.

## Teacher Actions

Teacher có thể:

- Join schedule dashboard.
- Xem live webcam hoặc live screen.
- Chụp evidence thủ công.
- Review violation.
- Gia hạn thời gian.
- Invalidate attempt.

Teacher không xem đồng thời webcam và screen của cùng một student trong cùng một panel live; UI chọn một stream type.

## Remaining Risks

- Cần TURN server cho mạng chặn peer-to-peer.
- Cần mở rộng automated tests cho socket authorization và signaling.
- Audit log cho mọi live socket action nên tiếp tục được củng cố.
