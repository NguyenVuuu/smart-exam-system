# SOES Performance Optimization

Baseline từ [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md), revision `7f5302c`. Giai đoạn 0 đã có thay đổi để review. Những tiêu chí chưa được xác minh giữ trạng thái In Progress theo bảng dưới.

| ID | Giai đoạn | Trạng thái | Phạm vi theo dõi |
|---|---:|---|---|
| F01 | 1 | Pending | Dirty autosave, debounce và revision |
| F02 | 1 | Pending | Race giữa lưu và kết thúc bài |
| F03 | 2 | Pending | Chấm nền bền vững và giới hạn Judge0 |
| F04 | 2 | Pending | Giảm số lần ghi trong transaction chấm |
| F05 | 2 | Pending | Xử lý bài hết hạn và quyền nhận job |
| F06 | 2 | Pending | Query plan, index và connection pool |
| F07 | 2 | Pending | Phân trang danh sách bài nộp |
| F08 | 2 | Pending | Giảm dữ liệu tải cho lịch thi và điểm |
| F09 | 1 | Pending | Polling dự phòng và render realtime |
| F10 | 3 | Pending | Cập nhật phiên live Redis theo thao tác atomic |
| F11 | 1 | Pending | Tra cứu key phiên và phục hồi Redis |
| F12 | 3 | Pending | Giới hạn concurrency AI và ngân sách retry |
| F13 | 3 | Pending | Gộp yêu cầu tải và trích xuất cùng tài liệu |
| F14 | 3 | Pending | Hiệu năng kho vector hiện có |
| F15 | 3 | Pending | Kiểm chứng AI và Judge. Suite đã phát hiện lỗi gốc |
| F16 | 1 | Pending | Chia bundle theo route |
| F17 | 4 | Pending | Quản lý tài nguyên inference trên client |
| F18 | 3 | Pending | Buffer và phục hồi upload evidence |
| F19 | 4 | Pending | Readiness, lifecycle và kiểm thử nhiều replica |
| F20 | 0 | In Progress | Đã có quan sát và script đo. Còn baseline nghiệp vụ trên DB cô lập và kiểm tra readiness |
| F21 | 0, 4 | In Progress | Đã nối các bước kiểm tra CI. Còn lỗi baseline và refactor theo module |
| F22 | 1 | Pending | Giới hạn candidate pool trong query |

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
