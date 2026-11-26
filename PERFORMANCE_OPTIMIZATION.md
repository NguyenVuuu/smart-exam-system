# SOES Performance Optimization

Baseline từ [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md), revision `7f5302c`. Tiến độ hiện hành theo bảng dưới và mục **Tiếp tục triển khai sau khi được duyệt sửa Prisma** ở cuối file. Các checkpoint trước đó được giữ làm lịch sử; quyết định mới nhất thay thế ràng buộc giữ nguyên Prisma. Commit không đồng nghĩa mọi tiêu chí tải/deployment đã được nghiệm thu.

| ID | Giai đoạn | Trạng thái | Phạm vi theo dõi |
|---|---:|---|---|
| F01 | 1 | In Progress | Dirty autosave, debounce, hàng đợi lưu và khôi phục đáp án; còn kiểm thử mất mạng và submit concurrency đầy đủ |
| F02 | 1 | In Progress | PostgreSQL: 30 save/submit races, 30 late saves và 30 duplicate submits bị chặn; còn tải HTTP rộng hơn |
| F03 | 2 | In Progress | Durable claim/lease/retry/fencing trên ExamAttempt đã kiểm thử kill/reclaim; migration chỉ tạo, chưa deploy thật |
| F04 | 2 | In Progress | Bulk chấm có benchmark 100 câu, concurrency 5; còn 20/50 câu và HTTP/Judge workload |
| F05 | 2 | In Progress | Bulk cập nhật offline với SKIP LOCKED; còn drain deadline và job ownership |
| F06 | 2 | In Progress | Index claim có EXPLAIN trên 100.100 rows; chưa tự tăng pool hoặc thêm index khác |
| F07 | 2 | In Progress | DB xếp hạng/gộp ca và phân trang trước hydrate; còn benchmark DB lớn |
| F08 | 2 | In Progress | SQL page/count lịch thi và điểm, summary toàn bộ filter, UI page server; còn workload lớn và snapshot đồng thời |
| F09 | 1 | In Progress | Polling thích ứng theo kết nối và gom heartbeat theo frame; còn profile 500 dòng và thử recovery |
| F10 | 3 | In Progress | Lua atomic cho claim/SDP/ICE/end, TTL touch không ghi JSON; qua fixture Lua, còn TURN/multi-replica thực |
| F11 | 1 | In Progress | Bỏ KEYS, bounded command retry và reconnect backoff/jitter; còn fault injection thật |
| F12 | 3 | In Progress | Admission, Redis generation lease, Student row-lock quota và Agent cancellation; còn proxy regression |
| F13 | 3 | In Progress | Gộp download và extraction đồng thời; còn bytes/base64 và benchmark nhiều replica |
| F14 | 3 | In Progress | Cache bounded cho token tài liệu và offload scoring, giữ nguyên công thức ranking; còn benchmark thực |
| F15 | 3 | In Progress | Fail-closed + mọi testcase + cache exact reference bounded; còn quality dataset và provider/Judge outage thực |
| F16 | 1 | In Progress | Đã lazy load route, entry gzip còn 122,95 kB; chưa đo LCP mạng thiết bị thực |
| F17 | 4 | In Progress | Giải phóng output tensor sau inference; còn profile memory và camera thực |
| F18 | 3 | In Progress | Admission upload, retry đúng blob và dedupe bằng PK hiện có; chưa có queue qua reload |
| F19 | 4 | In Progress | Readiness, fail-fast schema, HTTP/jobs/grading drain và lease recovery; còn two-replica/TURN deployment |
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

Người dùng đã yêu cầu không tạo thêm bất kỳ bảng ứng dụng nào. Phương án bảng job F03 không triển khai. F06 chỉ có scan khoảng 0,431 ms trên 620 dòng trong audit; không thêm index hoặc tăng pool theo cảm tính. F07/F08 phải giữ nguyên chọn bài gốc/dự phòng và release policy. Những giới hạn nghiệm thu giai đoạn 1 ở trên còn mở, không đánh dấu Completed.

## Giai đoạn 2 · Checkpoint không thay đổi schema

- F03. `src/lib/judge0.ts` thêm AbortSignal theo thời gian polling còn lại và giới hạn sleep trong deadline. Không để một GET treo vượt ngân sách polling. Chưa có global limiter hoặc recovery/ownership chấm sau restart. Không dùng lại trường nghiệp vụ làm lease, không tạo bảng job. Chưa nghiệm thu fault injection Judge0.
- F04. `attempt-grading.repository.ts` chỉ đọc projection để tính điểm, gom các kết quả objective thành một `UPDATE FROM VALUES` tham số hóa trong transaction cũ. Điểm đa lựa chọn, tổng điểm, chấm lập trình chưa xong và release IMMEDIATE giữ nguyên. `sameIds` chỉ sort vế phải một lần. Test mới kiểm tra partial credit, GRADED/PUBLISHED/GRADING và số lần bulk write. Với N đáp án objective có ghi, lệnh ghi đáp án giảm từ N xuống 1 theo cấu trúc code; đây chưa phải benchmark latency.
- F05. `attempt-session.repository.ts` chuyển select toàn bộ + N update Promise.all thành một CTE/UPDATE/RETURNING. Chọn tối đa 200 phiên stale theo heartbeat/id; `FOR UPDATE OF session SKIP LOCKED` tránh các replica tranh cùng phiên. Giữ NOT_REQUIRED, chỉ xét attempt IN_PROGRESS, trả các phiên thực sự đã cập nhật để emit sự kiện. Phần tự nộp hết giờ vẫn giữ batch và ownership cũ; chưa khẳng định xử lý được spike lớn.
- F06. Không chỉnh index, schema hoặc pool. Deferred vì dữ liệu baseline chưa cho thấy hot query chậm và chưa có database lớn cô lập để EXPLAIN. Hướng rollback không phát sinh.
- F07. `teacher-exam-grading.repository.ts` đọc metadata tối thiểu để chọn đại diện bài gốc/ca dự phòng và total như cũ. Chỉ hydrate `submissionInclude` cho ID trong trang được chọn, trả lại thứ tự mã sinh viên. Test mới xác nhận whitelist ca dự phòng, ưu tiên bài dự phòng, trang rỗng và chỉ tải chi tiết trang đã chọn. Metadata vẫn phụ thuộc tổng số bài; chưa đạt toàn bộ tiêu chí pagination tại DB.
- F08. `student-portal.repository.ts` lấy đúng một attempt mới nhất cùng filtered count của sinh viên; `student-portal.service.ts` dùng count đó khi xác định còn lượt thi. Không tải toàn bộ attempt chỉ để tính length. Test mới kiểm tra một sinh viên hết lượt và một sinh viên còn lượt với cùng latest attempt EXPIRED. Không đổi release policy hoặc API điểm số; pagination scores cần xem xét riêng vì contract hiện trả toàn bộ items.
- Clean Code. Không thêm dependency runtime, migration hoặc bảng ứng dụng. Giảm projection và bỏ vòng cập nhật N dòng. Trách nhiệm truy vấn vẫn ở repository, policy trạng thái vẫn ở service. Không thay đổi AI prompt/model hoặc thuật toán camera.
- Xác minh SQL. Docker daemon hiện không chạy và không có PostgreSQL binary local. Đã dùng PGlite cài riêng trong `outputs/performance-sql-check` để chạy đúng SQL production trên fixture hoàn toàn trong bộ nhớ, không truy cập DB SOES. Qua kiểm tra làm tròn numeric(5,2), scope attempt, phiên fresh/ended/NOT_REQUIRED và chạy offline lặp không phát sinh cập nhật lần hai. Fixture bộ nhớ chỉ dùng các bảng tối thiểu tương ứng bảng hiện có, không thêm bảng vào schema SOES. Không coi đây là test nhiều kết nối hoặc EXPLAIN production. Thư mục outputs không commit.
- Benchmark và giới hạn. Chưa có latency/throughput hoặc p95 transaction trước/sau giai đoạn 2; không tạo số đo giả. Các kiểm tra mock/SQL fixture không chứng minh ownership khi nhiều replica hoặc recovery sau restart. Các mục giữ In Progress theo giới hạn trên.
- Rollback. Hoàn tác checkpoint giai đoạn 2 để khôi phục truy vấn và cách ghi cũ. Không có migration hoặc chuyển đổi dữ liệu. Khi rollback F04/F05, số query và mức hydrate quay về baseline.

## Giai đoạn 3 · Checkpoint AI và cache

- F12. `ai-agent/src/soes_agent/main.py` kiểm tra service secret trước admission, giới hạn mặc định 4 workflow đồng thời mỗi tiến trình bằng semaphore không chờ. Khi đầy trả 503 và giải phóng slot trong finally kể cả exception/cancellation. `ai-agent/.env.example` công khai cấu hình `AI_AGENT_MAX_CONCURRENT_REQUESTS`, bắt buộc số dương. Health không chiếm slot. Test `test_admission.py` kiểm tra overload, auth và nhận lại slot. Không đổi model, retry của provider, prompt hoặc workflow. Giới hạn tổng phải nhân theo worker/replica; chưa có quota reservation theo sinh viên hoặc cancel provider xuyên HTTP.
- F13. `course-material-buffer.cache.ts` giữ promise tải cùng storagePath/checksum; các request miss đồng thời dùng chung kết quả, lỗi giải phóng promise để lần sau thử lại. Không checksum vẫn tải riêng như cũ. `material_cache.py` dùng Future và lock ngắn để đồng bộ cùng content hash, không giữ lock toàn cache khi parse. `materials.py` gọi đường load này; TTL, LRU, key theo content/MIME và giới hạn cache giữ nguyên. Test TypeScript và Python xác nhận 20 yêu cầu dùng chung một loader và lỗi không bị cache. Đây là số lần gọi loader trong fixture, không phải latency tải tài liệu thực. Quyền truy cập tài liệu ở caller giữ nguyên. Buffer base64 và duplication giữa replica chưa xử lý.
- F15. `programming-practice.service.ts` bỏ đường nhận lại câu đã bị verify loại; sửa helper chỉ nhận lời giải qua toàn bộ test case, chạy tối đa 5 case đồng thời trong một lần verify. Judge unavailable trả lỗi 503 thay vì coi câu hợp lệ hoặc chấm sai 0 điểm. `student-practice.service.ts` thực sự nối collect/verify trước transaction lưu bài luyện. Sinh lại tối đa 3 lượt như giới hạn cũ, chỉ bù số câu thiếu và loại stem đã thử. `question_generation.py` không trả bản cuối còn câu bị verifier loại. Không sửa nội dung prompt hoặc vòng sửa; chỉ sửa điều kiện phát hành kết quả sau kiểm chứng theo F15 audit. Test mới và assertion cũ đều được giữ.
- File test. `programming-practice.service.test.ts`, `course-material-buffer.cache.test.ts`, `ai-agent/tests/test_admission.py`, `test_material_cache.py`, `test_question_generation.py`.
- Clean Code. Bỏ import Judge0Service không dùng và nhánh fail-open; tái dùng helper verify sẵn có. Không thêm thư viện runtime, bảng, migration, model hoặc thuật toán RAG mới.
- Kiểm thử. Backend build qua; suite 194/194 sau khi sửa ba lỗi baseline. Test Judge tập trung 5/5 qua sau bổ sung kiểm tra không chấm 0 khi dịch vụ lỗi. Python 117/117, gồm scope chương, RAG fallback và workflow mock hiện có. Chưa có API provider/Judge0 end-to-end hoặc đánh giá học thuật trên bộ đề thật. Không dùng fixture để khẳng định AI chính xác tuyệt đối.
- Benchmark và giới hạn. Không có cặp latency AI trước/sau cùng tài liệu/model. Kiểm tra toàn bộ test thay sample có thể tăng thời gian so với đường bỏ kiểm chứng cũ; đó là sửa lỗi đúng đắn, không tuyên bố nhanh hơn. Chưa có cache verify theo runtime/hash. F10, F14, F18 vẫn Pending, chưa hoàn tất toàn giai đoạn 3.
- Rollback. Hoàn tác checkpoint này để trở về admission/cache cũ; không có dữ liệu cần chuyển đổi. Rollback F15 đưa lại nguy cơ phát hành bài chưa kiểm chứng nên cần cân nhắc riêng, không nên tắt verify để tăng tốc.

## Giai đoạn 4 · Checkpoint quản lý tài nguyên

- F17. `fe/soes-fe/public/mediapipe/phone-yolo.js` giải phóng tất cả output tensor sau khi decode và input trong finally, cả khi decode thất bại. `tests/phone-yolo.test.mjs` bổ sung kiểm thử lifetime thành công/lỗi. Giữ nguyên model/hash, input shape, tiền xử lý, confidence, vùng quét và nhịp nhận diện. Vision suite 28/28 qua. Chưa có memory profile camera thật hoặc benchmark latency/precision/recall 9 vùng; không khẳng định đã khắc phục mọi memory growth.
- F19. `src/server.ts` await khởi tạo realtime trước listen. `proctoring-realtime.gateway.ts` gắn middleware auth trước khi chờ adapter, ngừng các connection duplicate nếu cấu hình adapter thất bại. `src/lib/redis-ready.ts` chịu trách nhiệm chờ ready có timeout 10 giây và gỡ listener/timer khi xong hoặc lỗi. File test tương ứng kiểm tra ready, error, end, timeout và cleanup. Không thêm endpoint hoặc đổi API contract. Không thêm infrastructure. Chưa có graceful drain, distributed job ownership, sticky routing hoặc chạy 2 replica qua load balancer.
- Clean Code. Helper Redis tách riêng vì là trách nhiệm lifecycle có kiểm thử độc lập, không đưa logic thêm vào gateway lớn. YOLO chỉ thay lifetime tensor; không viết lại detector hoặc sửa điều kiện vi phạm.
- Benchmark. Chưa đo bộ nhớ theo thời gian hoặc P95 reconnect trước/sau. Tests lifetime chỉ chứng minh resource cleanup trong các đường đã kiểm tra.
- Kiểm thử cuối checkpoint. Backend unit suite 196/196, vision 28/28; frontend production build qua, entry gzip vẫn 122,95 kB. Python 117/117 ở checkpoint AI. Lint toàn repository vẫn có debt baseline nêu tại F21; không tuyên bố toàn bộ quality gates đã xanh. Không chạy benchmark trên database thật.
- Rollback. Hoàn tác checkpoint tài nguyên; không có schema/data cần rollback. Khi hoàn tác F19, startup có thể listen trước khi realtime cấu hình xong như baseline.

## Phạm vi còn lại để tiếp tục

F10 (atomic signaling Redis), F14 (đo/tối ưu index hiện có), F18 (queue evidence bền vững và dedupe), phần recovery/limiter Judge0 của F03, drain deadline F05, phân trang DB đầy đủ F07/F08 và các tiêu chí kiểm thử tải/multi-replica chưa hoàn tất. Không dùng yêu cầu cấm thêm bảng để ngầm bỏ các mục này; cần giải pháp trên dữ liệu/infra hiện có. Không thay prompt, model hoặc thuật toán nhằm giảm thời gian. Không ghi Completed khi còn thiếu nghiệm thu.

Các commit đã tạo: `5c72ad6` (giai đoạn 0), `fc8fe3b` (giai đoạn 1), `135e44c` (checkpoint giai đoạn 2), `688aa27` (checkpoint giai đoạn 3). Không push. Không stage `research/`, `outputs/`, `scripts/measure-learning-ai.ts`.

## Phạm vi hiện hành · 27/11/2026

Người dùng yêu cầu giữ nguyên hoàn toàn Prisma. Đã gỡ bảy trường mới, hai migration chưa commit và worker chấm phục hồi phụ thuộc chúng. `git diff -- be/soes-be/prisma` rỗng. Generate lại client từ schema cũ chỉ cập nhật node_modules, không sửa DB. Những phương án thêm trường trước đây đã hết hiệu lực. Không migrate/db-push dữ liệu thật.

### F03/F05 · Chấm và jobs không đổi schema

- Giữ bulk chấm đã commit. Judge0 có limiter FIFO mặc định 6 active/64 chờ, deadline bao gồm queue + POST + poll. Không bỏ testcase. File: `lib/work-limiter.ts/.test.ts`, `lib/judge0.ts`, `.env.example`.
- `programming-grading.service.ts`: SYSTEM_ERROR lưu score null và dừng tổng hợp thay vì chốt sai 0 điểm. Không tạo trạng thái job bằng cách ghi giả vào trường nghiệp vụ hiện có.
- `student-take-exam.service.ts`: drain timeout tối đa 8 batch, ngân sách giữa batch 5 giây; giữ conditional transition/audit gốc. Một query chậm vẫn có thể vượt ngân sách.
- Durable grading ownership/recovery chưa hoàn tất. Hậu submit/force-submit dùng cơ chế nền hiện có; không tuyên bố exactly-once hoặc phục hồi mọi job sau crash. Cần phương án queue bền vững riêng, giữ nguyên Prisma. Limiter hiện theo process, cần budget tổng khi deploy nhiều replica.
- Tests limiter kiểm tra overflow/expiry/release. Rollback các file trên không cần migration.

### F07 · Phân trang DB

- `teacher-exam-grading.repository.ts`, `submission-page.repository.ts` và test: SQL tham số hóa xếp hạng theo sinh viên, ưu tiên ca dự phòng, giữ whitelist và scope môn/ca; trả count + IDs trang rồi hydrate đúng IDs. Không đổi API/index.
- PGlite chạy SQL kiểm tra whitelist, count, makeup ưu tiên dù cũ hơn ca gốc, trang rỗng và thứ tự mã sinh viên hợp lệ. Còn benchmark dữ liệu lớn/concurrent snapshot. Rollback repository/helper cùng nhau.

### F11/F12/F14 · Redis và AI

- Redis command fail nhanh, không giữ offline queue; reconnect backoff/jitter. `REDIS_RETRY_LIMIT=0` retry liên tục; test runner dùng 3. Chưa fault-inject Redis deployment thật.
- `practice-generation.lease.ts/.test.ts`: SET NX PX trên Redis hiện có, renew/release Lua chỉ owner được phép; TTL 15 phút, renew 60 giây. Trước lưu kiểm tra ownership, khóa dòng Student hiện có và đếm lại quota 10/24 giờ. Không giữ transaction xuyên inference. Redis lỗi thì guard từ chối, không fallback bỏ khóa; quota row lock vẫn bảo vệ ghi đồng thời.
- Test TypeScript kiểm tra concurrent student/provider failure/quota/stale token. Python chạy Lua production qua fakeredis kiểm tra owner cũ không renew/xóa owner mới. Chưa nghiệm thu Redis failover/partition. Rollback service/helper cùng nhau; lease tự hết TTL.
- Agent kiểm tra disconnect mỗi 250 ms, hủy task và trả semaphore trong finally; regression slot-release qua. Chưa khẳng định mọi SDK/provider hủy HTTP upstream tức thì.
- F14 đã commit `4dc2c71`: cache bounded 128 tokenized chunks + thread scoring, giữ model/prompt/fusion/chunking/fallback. Chưa có quality dataset hoặc AI latency end-to-end.

### F17/F18 · Inference và evidence

- `phone-yolo.js`: dispose mọi output/input trong finally, pool tối đa một input buffer, không dùng chung buffer khi đang inference đồng thời. Giữ model/hash/phép tính tiền xử lý/confidence/regions/tần suất. Vision 29/29 gồm ORT WASM thật với fake canvas, kết quả giữ nguyên. Chưa có precision/recall camera hoặc memory profile dài.
- `evidence-upload.ts`: admission tối đa 8 request trước Multer; giữ 3 ảnh × 2 MiB và giới hạn field/parts. Trả slot khi response finish/close hoặc request abort.
- `usePhoneViolationMonitor.ts`: retry đúng blob tới ACK, backoff 2–15 giây + online, cap 20 ảnh/12 MiB. `phone-evidence-id.ts/.test.ts`, `violation-report.service.ts/.test.ts`, `attempt-violation.repository.ts`: ID hash attempt/metadata/ảnh dùng Violation PK cũ, ACK lại cùng record. Test hai request trùng chỉ ghi/phát event một lần.
- Queue trong RAM, không sống qua reload. Không mở rộng retention ảnh vào browser storage. Còn network/camera end-to-end. Rollback frontend/backend dedupe đồng bộ, không xóa evidence cũ.

### F19/F21 · Lifecycle và refactor

- `server.ts`, ba periodic job modules, `performance.ts`, realtime gateway: stop nhận HTTP, drain periodic jobs, đóng socket/adapter/Prisma/Redis/timer, shutdown deadline 30 giây. Chưa drain đầy đủ grading fire-and-forget sau khi gỡ worker phụ thuộc schema; chưa rolling restart 2 replica/LB.
- Tách student service khoảng 1379 xuống 805 dòng thành violation-report/events, run-code, student-live-session và status policy; giữ reexport. ExamSubmissionsTab 1073 xuống 563 dòng; tách hai modal, columns/options, bỏ state thừa và hai catch:any. Không đổi UI/payload/validation. Còn module lớn nên không ghi Completed toàn F21.
- PGlite chỉ là dev dependency. npm audit fix trong range giảm findings 15→8, hết critical cũ; không force downgrade/nâng major. Rollback package.json/lock cùng nhau. Targeted ESLint qua; full lint còn debt baseline ngoài phạm vi, không disable rule để che lỗi.

### F04/F20 · PostgreSQL benchmark cô lập

Ngày 27/11/2026, PostgreSQL 16.16 loopback, fixture riêng 100 sinh viên, 100 câu/bài, 100 attempts và 10.000 answers. Source baseline `7f5302c` và source hiện tại dùng cùng dependency/client/schema cũ, máy và DB; một warmup/lượt, 20 lần chấm tuần tự/lượt, thứ tự baseline/current/current/baseline. Middleware đếm Prisma operations cả hai variant; đây không phải số SQL statements vì include có thể sinh nhiều query. Assert điểm tổng cả hai bằng 10. Không gọi AI/Judge0 hoặc thử tải DB thật.

| Lượt | Variant | P50 ms | P95 ms | P99 ms | Prisma operations / bài |
|---|---|---:|---:|---:|---:|
| 1 | Baseline | 179,13 | 699,77 | 1095,96 | 102 |
| 1 | Current | 20,22 | 27,36 | 29,39 | 3 |
| 2 | Current | 21,38 | 26,17 | 27,87 | 3 |
| 2 | Baseline | 101,54 | 250,69 | 292,01 | 102 |

Bulk chấm giảm overhead trong fixture mà không đổi schema. Cỡ mẫu nhỏ và máy local biến động; không suy ra P99 production, throughput HTTP, 5.000 users, tốc độ AI hoặc CPU/RAM toàn hệ thống. Artifact: `outputs/performance-services/repository-results.json`; runner và DB fixture ở outputs, không commit theo yêu cầu. PostgreSQL tạm dừng sau phép đo. Không dùng health endpoint để kết luận hiệu năng nghiệp vụ.

### Nghiệm thu checkpoint

- Backend build qua và 201/201 tests; Python 123/123; vision 29/29; frontend build/targeted lint qua. Browser regression autosave/modal đơn/modal bulk chạy lại đạt 3/3. Không tuyên bố full lint xanh.
- F08 pagination/average API và F19 `/ready` còn chờ duyệt contract theo mục 5 yêu cầu ban đầu; chưa triển khai phần phụ thuộc.
- Các tiêu chí load/outage/kill-restart/multi-replica/AI quality còn thiếu giữ In Progress. F03 recovery tạm Deferred theo ràng buộc giữ nguyên Prisma; không coi hiệu suất và durability là cùng một tiêu chí. Không thêm bảng/cột/migration hay hạ tầng production.

Backend/Agent checkpoint không đổi schema đã commit `b4ed59a`; source Prisma và migration giữ nguyên HEAD trước checkpoint. Các file research, outputs và measure-learning-ai không được stage. Chưa push.

## Tiếp tục triển khai sau khi được duyệt sửa Prisma · 27/11/2026

Sau khi hỏi có nên sửa Prisma, người dùng yêu cầu triển khai phương án được đề xuất. Phạm vi hiện hành cho phép năm trường quản lý job trên **ExamAttempt hiện có** và index đã đo; không tạo bảng mới. Student generation lease vẫn dùng Redis, không thêm trường Student. Các mô tả giữ nguyên Prisma/đang chờ API ở checkpoint trước đã hết hiệu lực.

### F03/F05/F19 · Durable grading và readiness

- Schema/migration: `prisma/schema.prisma`, `prisma/migrations/20261127010000_attempt_grading_recovery/migration.sql`. Năm cột: gradingPending, gradingClaimToken, gradingLeaseUntil, gradingRetryAt, gradingFailures. Backfill chỉ SUBMITTED/AUTO_SUBMITTED/GRADING có submittedAt và cả autoScore/totalScore/manualScore đều null; không regrade bài đã có điểm thủ công/công bố. Không có CREATE TABLE.
- Submit/timeout/force-submit đặt pending trong transaction kết thúc bài. `repositories/grading-job.repository.ts` claim bằng SKIP LOCKED, lease 90 giây; `jobs/attempt-grading.jobs.ts` tối đa hai tác vụ/process, renew 30 giây và poll phục hồi 5 giây. Không giữ transaction xuyên Judge HTTP.
- Các repository ghi điểm kiểm tra token/lease/status dưới row lock; chủ cũ không ghi được sau reclaim. Lease/retry dùng clock PostgreSQL để không phụ thuộc lệch giờ giữa API replica. Chốt điểm tay hủy pending/token; release không tự công bố AUTO_SUBMITTED còn pending. Retry exponential tối đa năm lỗi, sau đó giữ GRADING/pending để giảng viên xử lý; chưa có nút retry job riêng. Bài lập trình đã ghi score được bỏ qua ở lần retry có claim; SYSTEM_ERROR giữ null, không biến thành sai bài.
- `server.ts` kiểm tra các cột bắt buộc trước listen, fail-fast khi chưa migrate. Startup khởi động worker recovery; shutdown ngừng claim và drain các job đang chạy trong deadline 30 giây; job chưa hoàn tất còn lease để lần sau phục hồi.
- `lib/readiness.ts/.test.ts`, `middlewares/readiness.ts`, `app.ts`: GET /ready trả 200/503 theo DB/Redis, timeout probe một giây, coalesce/cached một giây và drain fail ngay. /health giữ nguyên. Không đưa chi tiết lỗi/kết nối ra response. Đây là readiness dependency lõi, không phải chứng nhận model/Judge đang khỏe.
- Tests `grading-job.repository.test.ts`, `attempt-grading.jobs.test.ts` và readiness kiểm tra SQL migration, stale/manual fencing, retry cap, active cap/status/drain, probe treo và concurrent probes. PGlite là fixture memory, không dùng DB thật.
- Fault test bổ sung PostgreSQL 16.16 riêng: kill process sau claim, chứng minh chưa reclaim khi lease còn hạn; đẩy lease hết hạn trong fixture rồi cho 10 claimant cạnh tranh, chỉ một owner. Ghi bằng token cũ bị chặn, owner mới chấm được 10 điểm và clear pending cùng commit. Thời gian chờ 90 giây được thay bằng cập nhật clock lease trong fixture; không gọi đó là phép đo wall-clock failover.
- Cùng fixture: 30 save/submit races, 30 late saves bị từ chối, 30 duplicate submit không đổi bài. Lượt này save thắng cả 30 races; nhánh submit trước được kiểm tra qua late-save sau commit, chưa suy ra mọi lịch thực thi đã được bao phủ. Artifact `outputs/performance-services/recovery-results.json`.
- Rollback: ngừng/drain worker trước hoàn tác code; giữ các cột để không xóa pending state. Không tự DROP cột/index hoặc chạy migration trên dữ liệu thật. Bản backend mới cần migration này trước khi chạy; migration hiện **chỉ được tạo để review**, chưa deploy thật.

### F06 · Index có bằng chứng

- Fixture PostgreSQL riêng tăng lên 100.100 attempts; EXPLAIN ANALYZE/BUFFERS, một warmup và 10 samples/query. Claim SELECT P50 execution 11,189→0,037 ms; P95 15,398→0,058 ms sau B-tree `(gradingPending, submittedAt, id)`.
- Index được khai báo trong schema và migration trên, không thêm bảng. Chưa tăng connection pool hoặc thêm các index khác khi thiếu workload evidence. Không suy ra latency HTTP từ execution time. Artifact `outputs/performance-services/pending-index-results.json`.
- CREATE INDEX trong migration có thể khóa ghi khi build trên DB lớn; cần lịch deploy được review. Không tự đổi thành concurrent migration hoặc thực thi trên dữ liệu thật. Rollback index phải review riêng; không làm trong phiên này.

### F04/F20 · Chấm đồng thời

Trên cùng PostgreSQL fixture, 20 lượt chấm 100 câu/lượt, concurrency năm, cùng dependencies và source baseline `7f5302c`, chạy baseline/current/current/baseline:

| Variant/lượt | P50 ms | P95 ms | P99 ms | Hoàn tất/giây | Prisma operations/bài |
|---|---:|---:|---:|---:|---:|
| Baseline 1 | 139,70 | 205,71 | 207,17 | 33,32 | 102 |
| Current 1 | 35,98 | 115,50 | 158,40 | 88,66 | 3 |
| Current 2 | 52,42 | 108,63 | 109,51 | 79,33 | 3 |
| Baseline 2 | 155,42 | 178,18 | 178,43 | 30,95 | 102 |

Mọi điểm tổng đều được assert bằng 10. Đây là throughput repository chấm trắc nghiệm, không phải HTTP RPS hoặc Judge throughput. Gọi trực tiếp không có claimToken, nên chưa bao gồm round-trip claim/row-fence của worker; không dùng số ba operations để mô tả toàn bộ durable workflow. Còn workload 20/50 câu và latency provider. Artifact `outputs/performance-services/repository-concurrent-results.json`, không commit outputs.

### F08 · Phân trang lịch thi và điểm số

- Backend: `repositories/schedule-page.repository.ts/.test.ts`, `score-page.repository.ts/.test.ts`, portal repository/service/validator và `services/score-summary.ts`. SQL xác định IDs/count/status trước hydrate, giữ enrollment, exam visibility, keyword, release policy, ca dự phòng và thứ tự ổn định bằng ID.
- Lịch thi giữ ưu tiên trạng thái đã nộp, còn đang làm dù ca đã qua endTime, upcoming/expired và tổng số lượt dùng. Tests SQL thực kiểm tra semester/enrollment/hidden exam/teacher keyword/status counts/pages.
- Điểm: page/pageSize tùy chọn (pageSize tối đa 100). Không gửi page giữ luồng items cũ. Có page trả pagination/averageScore/highestScore; chỉ hydrate chi tiết trong trang và kiểm lại student/release scope. Chỉ PUBLISHED + totalScore không null + schedule/parent đã cho công bố được chọn.
- Average giữ nguyên chính sách UI cũ: tối đa ba quiz đầu theo ngày công bố/tên tiếng Việt, trọng số quiz:midterm:final = 1:2:3, rồi trung bình đều giữa học phần. Vì collation tiếng Việt của JavaScript không bảo đảm tương đương mọi PostgreSQL deployment, DB trả projection summary tối thiểu trên tập đã dedupe để tính average tại server; không tải relation chi tiết toàn bộ. Phần summary vẫn O(n), không tuyên bố đã có aggregate SQL thuần/bounded memory cho lịch sử vô hạn.
- Frontend: `useStudentScorePage.ts`, `StudentScoresPage.tsx`, portal API. Fetch từng trang, debounce 250 ms, bỏ kết quả request cũ, reset trang khi đổi filter, dùng summary toàn bộ filter. Bỏ logic average/filter/slice trùng trong page. Không thay UI bố cục hoặc công thức điểm.
- Tests: release ẩn, scope khác, makeup ưu tiên, summary qua trang, quiz limit, legacy query, status counts và browser pagination (chỉ ba request cho initial/next/search). Browser autosave bổ sung 503→online retry đúng đáp án dirty, không gửi lại answer đã ACK.
- Rollback frontend/backend cùng nhau khi bỏ metadata mới. Request không có paging vẫn tương thích client cũ. Còn cần benchmark DB lớn cho hai danh sách và kiểm tra snapshot khi giáo viên công bố/thu hồi đồng thời với page query.

### F11/F15 · Reconnect và kiểm chứng được cache

- TCP fault fixture gọi chính ioredis config production: kill server hơn 5,1 giây, command bị từ chối khi down, retry không dừng sau ba lần, reconnect sau server quay lại mất khoảng 1.717 ms trong lượt này. Fixture chỉ mô phỏng RESP INFO/PING/CLIENT; không phải Redis persistence/failover hoặc kiểm thử Socket.IO/TURN. Artifact `outputs/performance-services/redis-reconnect-results.json`.
- `reference-verification.cache.ts`, programming practice service/test: SHA256 toàn question/reference/tests + endpoint + CPU/memory limits; chỉ cache khi toàn bộ testcase hợp lệ, tối đa 128 entries, TTL năm phút, single-flight. Không cache Judge unavailable hoặc kết quả sai. Test 10 request identical chỉ chạy đủ hai case một lần; thay expected output phải chạy lại và bị loại. Cache process-local; runtime được định danh bằng endpoint/language selector, không có binary attestation nếu Judge nâng runtime tại chỗ trong TTL. Không cache việc chấm bài người học.
- Giữ nguyên semantic verification, model, prompt, RAG và các giới hạn nhận diện camera. Rollback cache/helper cùng service; không có dữ liệu/schema cần chuyển đổi cho phần cache.

### Kiểm chứng, tài nguyên và việc còn lại

- Một lượt full test đồng thời build bị OOM trên máy local, không được tính là pass. Dừng các process kiểm thử của phiên, thêm `UNIT_TEST_CONCURRENCY=1..4` (default hai) vào runner; full suite chạy lại tuần tự đạt 209/209. Backend build và frontend build qua; targeted ESLint page/hook qua; browser năm test qua. Những thay đổi cuối về clock lease và UTC summary được chạy lại các suite SQL liên quan. Không dùng lỗi tài nguyên để bỏ assertion hoặc disable lint.
- Docker CLI có nhưng Docker Engine không chạy; không tự mở Docker Desktop hoặc thay hạ tầng. Chưa thực hiện hai API replicas qua Redis thật/LB/TURN, Redis failover có persistence, camera thật nhiều giờ, hoặc quality dataset có nhãn. Các mục đó tiếp tục In Progress, không thay bằng số liệu mô phỏng.
- F18 queue vẫn RAM, chưa sống qua reload; không tự lưu ảnh sinh viên dài hạn vào browser storage. Full lint debt ngoài module đã chỉnh vẫn còn. Không tuyên bố đã hoàn tất toàn bộ F01–F22 khi những tiêu chí này chưa qua.
- Chỉ commit source/test/report của checkpoint. Không stage `research/`, `outputs/`, `scripts/measure-learning-ai.ts`; không push và không migrate DB thật.
