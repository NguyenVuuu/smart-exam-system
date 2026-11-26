# SOES Performance Optimization

Baseline từ [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md), revision `7f5302c`. Giai đoạn 0 đã commit tại `5c72ad6`. Giai đoạn 1 đã triển khai trong phạm vi bên dưới. Các tiêu chí cần DB cô lập hoặc đo tải vẫn giữ In Progress; commit không đồng nghĩa mọi tiêu chí nghiệm thu đã hoàn tất.

| ID | Giai đoạn | Trạng thái | Phạm vi theo dõi |
|---|---:|---|---|
| F01 | 1 | In Progress | Dirty autosave, debounce, hàng đợi lưu và khôi phục đáp án; còn kiểm thử mất mạng và submit concurrency đầy đủ |
| F02 | 1 | In Progress | Khóa attempt và kiểm tra deadline trong transaction; còn kiểm thử tranh chấp trên PostgreSQL cô lập |
| F03 | 2 | Pending | Chấm nền bền vững và giới hạn Judge0 |
| F04 | 2 | Pending | Giảm số lần ghi trong transaction chấm |
| F05 | 2 | Pending | Xử lý bài hết hạn và quyền nhận job |
| F06 | 2 | Pending | Query plan, index và connection pool |
| F07 | 2 | Pending | Phân trang danh sách bài nộp |
| F08 | 2 | Pending | Giảm dữ liệu tải cho lịch thi và điểm |
| F09 | 1 | In Progress | Polling thích ứng theo kết nối và gom heartbeat theo frame; còn profile 500 dòng và thử recovery |
| F10 | 3 | Pending | Cập nhật phiên live Redis theo thao tác atomic |
| F11 | 1 | In Progress | Xóa phiên theo key cụ thể, bỏ KEYS; chưa đổi chính sách phục hồi Redis |
| F12 | 3 | Pending | Giới hạn concurrency AI và ngân sách retry |
| F13 | 3 | Pending | Gộp yêu cầu tải và trích xuất cùng tài liệu |
| F14 | 3 | Pending | Hiệu năng kho vector hiện có |
| F15 | 3 | Pending | Kiểm chứng AI và Judge. Suite đã phát hiện lỗi gốc |
| F16 | 1 | In Progress | Đã lazy load route, entry gzip còn 122,95 kB; chưa đo LCP mạng thiết bị thực |
| F17 | 4 | Pending | Quản lý tài nguyên inference trên client |
| F18 | 3 | Pending | Buffer và phục hồi upload evidence |
| F19 | 4 | Pending | Readiness, lifecycle và kiểm thử nhiều replica |
| F20 | 0 | In Progress | Đã có quan sát và script đo. Còn baseline nghiệp vụ trên DB cô lập và kiểm tra readiness |
| F21 | 0, 4 | In Progress | Đã nối các bước kiểm tra CI. Còn lỗi baseline và refactor theo module |
| F22 | 1 | In Progress | Candidate pool AI giới hạn 501 ở DB, giữ ngưỡng 500; chưa benchmark DB lớn |

Các mục Pending dùng chung hồ sơ sau. Giải pháp và rủi ro tham chiếu mục cùng ID trong audit. Chưa có file thay đổi, refactor, benchmark sau, test nghiệm thu hoặc thao tác rollback riêng. Các mục này chờ đúng giai đoạn đã duyệt.

## F20 · Giai đoạn 0

- Giải pháp. Đặt `PERFORMANCE_LOGGING=true` trước khi khởi động API để ghi log có cấu trúc theo route template, status và thời gian. Mẫu 30 giây có tổng query, tổng thời gian query, p99 event-loop, bộ nhớ Node và số kết nối Engine.IO. Request ID do backend tạo, được chuyển sang AI Agent qua header nội bộ và đính kèm log Judge0. Python chỉ ghi ID UUID hợp lệ và đường dẫn đã match, không ghi nội dung request. DB logger chỉ nhận thời gian, không lưu SQL hoặc bind parameters. Khi stdout bị nghẽn, có thể bỏ mẫu HTTP/Judge0.
- File. `be/soes-be/.env.example`, `src/app.ts`, `src/server.ts`, `src/lib/performance.ts`, `src/lib/prisma.ts`, `src/lib/judge0.ts`, `src/middlewares/requestPerformance.ts`, `src/middlewares/requestPerformance.test.ts`, `src/modules/proctoring/proctoring-realtime.gateway.ts`, `src/modules/ai-agents/services/ai-agent.client.ts` thuộc backend, `ai-agent/src/soes_agent/main.py`, và `be/soes-be/scripts/benchmark-attempt-status.mjs`.
- Clean Code. Dùng logger và API chuẩn của Node, không thêm dependency. Tách đo lường khỏi controller, không đổi validation, AI model, prompt, workflow, media hoặc response contract. Bỏ kiểu `any` ở serializer Judge0 đã chỉnh.
- Benchmark. Audit có số đo health/AI cũ, không có cặp trước–sau nghiệp vụ. Đã smoke test công cụ mới với HTTP fixture cô lập và 100/100 thành công, concurrency 5. Kết quả fixture chỉ xác nhận công cụ chạy được. Không dùng để kết luận tăng tốc SOES.
- Kiểm thử. Test middleware kiểm tra request ID sống qua async và route template không chứa ID thật hoặc query token. Suite AI Agent qua 114/114 với các fixture và mock hiện có. Chưa đo overhead telemetry trong ca thi.
- Rủi ro còn lại. Counter DB là tổng theo tiến trình, không đo pool wait hoặc từng transaction. Các log có thể dùng tính percentile sau thu thập. Chưa có dashboard, grading queue age hoặc probe readiness qua load balancer. Grading queue phát sinh ở F03. Thay đổi readiness phục vụ điều phối traffic cần chốt cùng F19, giữ `/health` hiện hữu.
- Rollback. Đặt `PERFORMANCE_LOGGING=false` và restart API để ngừng đo HTTP, DB, runtime và Judge0. Có thể hoàn tác các file instrumentation độc lập với mã nghiệp vụ.

### Chạy benchmark status nghiệp vụ khi có fixture

Chạy API riêng trên loopback với PostgreSQL và Redis kiểm thử. Chọn bài mẫu **đã chấm hoặc đã công bố** và token của chính sinh viên đó. Status có thể tự nộp bài đang thi đã quá hạn, vì vậy xác minh fixture trước lượt warm-up. Script kiểm tra status trả về, nhưng chỉ thực hiện được kiểm tra đó sau request đầu tiên.

Đặt `PERF_SCHEDULE_ID`, `PERF_ATTEMPT_ID` và `PERF_ACCESS_TOKEN` trong tiến trình gọi, giữ token ở local, rồi chạy tại root:

```powershell
node be/soes-be/scripts/benchmark-attempt-status.mjs --isolated-fixture --port 3100 --requests 100 --concurrency 5
```

Giữ nguyên dataset/runtime, lưu JSON stdout riêng cho từng lượt và lặp lại với instrumentation bật/tắt. Công cụ trả exit khác 0 nếu có response lỗi và báo cả throughput thành công lẫn throughput hoàn tất. Luồng start/save/submit spike và WebRTC tiếp tục theo ma trận audit khi có môi trường phù hợp.

## F21 · Giai đoạn 0

- Giải pháp. Thay placeholder `npm test` bằng runner test TypeScript từ source, tách build kiểm tra kiểu. Runner mặc định tách suite PostgreSQL và ghi đè địa chỉ DB/Redis bằng loopback cổng 1 để import dotenv không nạp lại địa chỉ thật. CI backend build và test bằng lockfile, không cần tạo file .env từ secret cho build/test. CI thêm suite Python, vision và typecheck mobile. Mobile dùng lại dependency đã có trong lockfile.
- File. `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`, `be/soes-be/package.json`, `be/soes-be/scripts/test-unit.mjs`, `be/soes-be/src/modules/teacher-exams/services/review-queue-access.test.ts`, `be/soes-be/src/modules/teacher-questions/mappers/teacher-question.mapper.test.ts`.
- Clean Code. Giữ nguyên assertion cũ. Bổ sung trường quan hệ `submittedBy`, `decision` và `topics` mà hai fixture cũ thiếu. Chạy test từ source tránh artifact cũ trong `dist` bị nhận nhầm là test hiện tại. Suite PostgreSQL cần chạy riêng với database cô lập. Trong lượt thử runner ban đầu, một test tích hợp đã được phát hiện qua cấu hình local. Không chạy migration, và kiểm tra chỉ đọc sau đó trả 0 phòng ban fixture có tên và mã theo mẫu của test. Runner cuối tách các file `*.postgres.test.ts` và ghi đè địa chỉ kết nối trong tiến trình test.
- Benchmark. Build web production đo được entry JS 3.646,09 kB minified, 1.072,41 kB gzip. Đây là baseline F16. Chưa có thay đổi route splitting hoặc phép đo LCP.
- Kiểm thử và rủi ro. Backend build qua và suite đạt 184/187. Web build qua, vision 27/27, web lint 34 lỗi và 2 cảnh báo. Mobile `npm ci` và typecheck qua. Ba test tập trung cho telemetry và hai fixture đã qua. Ba lỗi kiểm chứng lập trình tái hiện độc lập, gồm lấy lại câu đã bị Judge loại, trả thành công khi thiếu câu hợp lệ và chỉ chạy test case đầu. Giữ các assertion này trong CI để sửa theo F15. Lint mobile vẫn còn lỗi cũ. Các refactor lớn thuộc giai đoạn 4. Kiểm tra CI trên GitHub chưa chạy trong workspace.
- Lint mobile sau khi cài lại dependency ghi nhận 19 lỗi và 23 cảnh báo. Lỗi resolve `socket.io-client` đã hết. Review Clean Code của phần triển khai xác nhận runner tách suite DB, fixtures giữ các assertion và logger chỉ ghi metadata đã chọn.
- Rollback. Hoàn tác từng cấu hình CI và runner trong phạm vi F21 nếu cần. Giữ lockfile và dữ liệu hiện có.

## Giai đoạn 1 · F01, F02, F09, F11, F16, F22

- F01. Hook `useExamAnswerSave.ts` chỉ gửi đáp án khác lần lưu thành công gần nhất, debounce 2 giây, xếp hàng các lượt lưu và tối đa 4 request trong một batch. Chỉ đánh dấu thành công từng đáp án đã được server xác nhận. Submit chờ flush, sự kiện online thử lưu lại. `StudentTakeExamPage.tsx` nhận lại đáp án khi fetch hoàn tất và ngăn sửa trong lúc submit. API một đáp án giữ nguyên contract backend. Bỏ mutation và formatter lưu toàn bộ đã không còn dùng trong `useTakeExam.ts`, `useTakeExamApi.ts`, `student-take-exam.api.ts`.
- F02. `attempt-answer.repository.ts` khóa dòng attempt bằng `FOR UPDATE`, kiểm tra trạng thái và deadline sau khi lấy khóa rồi mới ghi answer/version trong cùng transaction. `student-take-exam.service.ts` tái sử dụng đường ghi này cho chạy thử mã; bỏ hai helper ghi rời. Test mock chứng minh thứ tự khóa/kiểm tra/ghi và từ chối trạng thái đóng hoặc quá hạn. Chưa chạy PostgreSQL để chứng minh tranh chấp thực giữa autosave, submit, deadline và force-submit.
- F09. Status reconciliation ở `StudentTakeExamPage.tsx` chạy sau 15 giây khi socket kết nối, 5 giây khi mất kết nối, có jitter tối đa 500 ms và không chồng request. Kết nối lại được reconcile ngay. Giữ heartbeat 10 giây và sự kiện force-submit. `useLiveProctorSocket.ts` gom heartbeat theo animation frame, bỏ heartbeat cũ và không làm sống lại attempt đã kết thúc. Chưa profile render 500 dòng hoặc đo recovery khi mất mạng.
- F11. `redis.ts` bỏ `KEYS`: logout một role xóa đúng key, logout mọi role xóa danh sách hữu hạn từ `accountRoles` và key legacy. `jwt.ts`, `auth.validator.ts`, `auth.service.ts` dùng chung danh sách role. Không đổi TTL, định dạng key, retry hoặc chính sách xác thực. Chưa nghiệm thu failover Redis, vì vậy mục này còn In Progress.
- F16. `AppRouter.tsx` dùng lazy import cho các trang sau đăng nhập với Suspense; giữ nguyên route và guard. Build cùng cấu hình giảm entry JS gzip từ 1.072,41 kB xuống 122,95 kB (khoảng 88,5%). Đây là kích thước entry, không phải tổng dữ liệu mọi route hoặc số đo LCP. Editor và face liveness vẫn là các chunk lớn tải khi cần. Chưa đo tải lạnh trên thiết bị thật.
- F22. `teacher-exams.repository.ts` nhận giới hạn tùy chọn; `exam-draft.service.ts` lấy tối đa 501 candidate để giữ nguyên lỗi ngân hàng vượt 500. Các consumer thủ công không truyền giới hạn vẫn giữ hành vi cũ. Không đổi prompt, thuật toán chọn hoặc ngưỡng nghiệp vụ. Chưa đo query trên ngân hàng lớn.
- Kiểm thử. Build backend và frontend qua. Lint các file frontend đã sửa qua. Vision 27/27. Playwright `tests/browser/exam-autosave.spec.ts` qua: API fixture xác nhận lựa chọn đã lưu được khôi phục, chuỗi check/uncheck chỉ tạo một request cho câu thay đổi sau debounce. Fixture chặn đúng URL `/api/`, không truy cập dữ liệu thi thật. Backend 185/188; 3 test Judge lỗi baseline thuộc F15 vẫn giữ nguyên assertion. `git diff --check` qua. Máy có một thời điểm báo thiếu paging memory khi chạy công cụ; sau khi tiến trình kiểm thử kết thúc đã chạy lại browser test thành công.
- Benchmark. Ngoài kích thước entry, chưa có cặp đo latency/throughput nghiệp vụ hoặc transaction p95. Không suy ra khả năng chịu tải từ mock. Không chạy load test trên DB thật.
- Clean Code. Tách hàng đợi autosave khỏi page, bỏ code lưu toàn bộ dư thừa, tái dùng repository cho ghi mã nguồn, dùng role tuple hiện có thay vì dò Redis. Không thêm dependency, migration hoặc thay đổi model/prompt/vision.
- Rollback. Hoàn tác commit giai đoạn 1 để trả lại autosave/polling/router/Redis/candidate query. Không có dữ liệu hoặc schema cần chuyển đổi ngược. Nếu rollback khóa ghi F02, race cũ giữa lưu và submit quay lại.

## Điểm kiểm tra trước giai đoạn 2

F03 cần job bền vững/ownership; nếu phải thêm bảng hoặc infrastructure thì trình phương án và xin phê duyệt trước migration. F06 chỉ có scan khoảng 0,431 ms trên 620 dòng trong audit; không thêm index hoặc tăng pool theo cảm tính. F07/F08 phải giữ nguyên chọn bài gốc/dự phòng và release policy. Những giới hạn nghiệm thu giai đoạn 1 ở trên còn mở, không đánh dấu Completed.
