# KẾ HOẠCH KHỞI NGHIỆP DỰ ÁN SOES

## 1. Tên dự án

**SOES – Smart Online Examination System: Nền tảng tổ chức, giám sát và đánh giá thi trực tuyến thông minh cho cơ sở giáo dục.**

## 2. Tổng quan dự án

Quá trình tổ chức kiểm tra, thi giữa kỳ, thi cuối kỳ và đánh giá kết quả tại các trường đại học, cao đẳng vẫn thường phân tán qua nhiều công cụ. Nhà trường phải quản lý học vụ, ngân hàng câu hỏi, lịch thi, phòng thi, bài làm, giám sát và công bố điểm ở nhiều quy trình khác nhau. Điều này tạo ra các vấn đề chính:

1. Dữ liệu học vụ và dữ liệu thi bị phân tán, khó kiểm soát xuyên suốt từ môn học đến kết quả.
2. Việc tạo đề, quản lý ngân hàng câu hỏi, duyệt đề và lập lịch thi còn tốn nhiều thời gian của giảng viên và cán bộ đào tạo.
3. Thi trực tuyến khó bảo đảm tính nghiêm túc nếu thiếu cơ chế giám sát trình duyệt, webcam, chia sẻ màn hình và lưu bằng chứng.
4. Câu hỏi lập trình cần môi trường chạy thử, chấm tự động và xử lý nhiều test case nhưng thường phải dùng thêm công cụ bên ngoài.
5. Sinh viên thiếu công cụ học tập cá nhân hóa từ tài liệu môn học; việc dùng AI nếu không giới hạn nguồn có thể tạo ra câu trả lời không đáng tin cậy.
6. Quy trình chấm, phúc khảo, công bố kết quả và lưu vết thao tác cần minh bạch hơn.

SOES được xây dựng như một nền tảng EdTech khép kín, hỗ trợ ba nhóm người dùng chính: **quản trị viên/cán bộ đào tạo, giảng viên và sinh viên**. Hệ thống bao phủ vòng đời của một hoạt động đánh giá:

**Quản lý học vụ → quản lý học phần và tài liệu → xây dựng ngân hàng câu hỏi → tạo và duyệt đề → lập lịch thi → làm bài → giám sát → chấm điểm → công bố kết quả → phúc khảo và phân tích.**

Các điểm khác biệt cốt lõi của SOES gồm:

- **AI hỗ trợ có kiểm soát:** Gemini và AI Agent riêng hỗ trợ sinh câu hỏi từ tài liệu môn học, trích xuất đề, tạo bài luyện tập, giải thích kết quả và truy xuất tài liệu bằng RAG. AI chỉ đóng vai trò hỗ trợ; giáo viên vẫn là người duyệt nội dung trước khi đưa vào ngân hàng câu hỏi hoặc đề thi.
- **Giám sát thi đa tín hiệu:** theo dõi chuyển tab, thoát toàn màn hình, sao chép/dán, trạng thái webcam, khuôn mặt, điện thoại và chia sẻ màn hình; lưu sự kiện, bằng chứng và hỗ trợ giám sát realtime để cán bộ coi thi đưa ra quyết định.
- **Chấm thi đa dạng:** hỗ trợ trắc nghiệm một lựa chọn, nhiều lựa chọn, đúng/sai và câu hỏi lập trình. Câu hỏi lập trình được chạy/chấm qua Judge0 CE với test công khai và test ẩn.
- **Quản trị minh bạch:** phân quyền theo vai trò, audit log, quy trình duyệt câu hỏi/đề, công bố điểm theo chính sách và phúc khảo theo từng bài thi.
- **Blockchain bảo chứng đề thi:** tính SHA-256 của phiên bản đề đã công bố, neo mã băm lên Ethereum Sepolia và cho phép đối chiếu lại để phát hiện nội dung bị thay đổi. Blockchain chỉ lưu dấu vân tay và metadata tối thiểu, không lưu nội dung đề, đáp án hay thông tin sinh viên.
- **Kiến trúc có khả năng mở rộng:** frontend React/Vite, backend Express/TypeScript theo modular monolith, PostgreSQL/Prisma, Redis, Socket.IO, Supabase Storage, MinIO và các dịch vụ AI/chấm code chuyên biệt.

SOES hướng đến các trường đại học, cao đẳng, trung tâm đào tạo và đơn vị tổ chức kiểm tra nội bộ có nhu cầu số hóa đánh giá nhưng vẫn cần kiểm soát học vụ, bảo mật đề thi và tính toàn vẹn của bài làm.

## 3. Mục tiêu

### Mục tiêu ngắn hạn – 6 tháng đầu

- Hoàn thiện phiên bản MVP ổn định trên nền tảng Web cho ba vai trò Admin, Teacher và Student.
- Hoàn thiện các luồng cốt lõi: quản lý học vụ, ngân hàng câu hỏi, tạo đề, lập lịch, làm bài, autosave, nộp bài, chấm điểm và công bố kết quả.
- Hoàn thiện giám sát webcam, chia sẻ màn hình, vi phạm trình duyệt, bằng chứng và dashboard realtime ở mức pilot.
- Hoàn thiện AI sinh câu hỏi từ tài liệu với bước kiểm tra schema, chuẩn hóa, đánh giá và phê duyệt bởi giảng viên.
- Thí điểm tại một khoa hoặc một số học phần có quy mô khoảng 300–500 sinh viên.

### Mục tiêu trung hạn – 1 đến 2 năm

- Mở rộng SOES cho nhiều khoa, nhiều cơ sở đào tạo và các trung tâm khảo thí.
- Cung cấp báo cáo về chất lượng câu hỏi, mức độ khó, chủ đề học tập, kết quả lớp và xu hướng học tập.
- Mở rộng AI Agent cho trợ giảng, luyện tập theo tài liệu, giải thích kết quả và hỗ trợ giáo viên dựa trên dữ liệu đã được phân quyền.
- Chuẩn hóa triển khai cloud, giám sát vận hành, sao lưu và phục hồi dữ liệu.
- Xây dựng mô hình doanh thu thuê bao theo số lượng người dùng, học phần hoặc kỳ thi.

### Mục tiêu dài hạn – 3 đến 5 năm

- Trở thành nền tảng đánh giá trực tuyến chuyên sâu cho giáo dục đại học tại Việt Nam.
- Hỗ trợ nhiều mô hình đánh giá: thi học kỳ, kiểm tra thường xuyên, tuyển sinh, chứng chỉ nội bộ và đào tạo doanh nghiệp.
- Phát triển hệ sinh thái dữ liệu học tập có kiểm soát, giúp cơ sở giáo dục ra quyết định dựa trên bằng chứng.
- Mở rộng tích hợp với hệ thống quản lý đào tạo, nhận diện tập trung, kho học liệu và các nền tảng LMS khác.

## 4. Phạm vi dự án

### Phạm vi nghiệp vụ

SOES tập trung vào quản lý và đánh giá học tập trực tuyến, gồm:

- Quản lý người dùng, vai trò, khoa/bộ môn, học kỳ, môn học, lớp học phần và ghi danh.
- Quản lý bài đăng, tài liệu học tập và nội dung môn học.
- Quản lý ngân hàng câu hỏi với các loại: single choice, multiple choice, true/false và programming.
- Tạo đề thủ công, từ ngân hàng câu hỏi, bằng AI hoặc kết hợp; hỗ trợ section, snapshot câu hỏi và nhiều cách phân phối câu hỏi.
- Duyệt câu hỏi, duyệt đề, lập lịch thi thường kỳ và lịch thi cuối kỳ.
- Làm bài, lưu tiến độ, chạy thử code, nộp bài, tự động chấm và chấm bổ sung.
- Giám sát thi, ghi nhận vi phạm, lưu evidence, xem realtime và xử lý invalidate/force submit theo quyền.
- Công bố kết quả theo chính sách, xem lại bài, thông báo và phúc khảo.
- Bảo chứng tính toàn vẹn đề thi bằng hash SHA-256 và blockchain; xác minh hash trước các thao tác tổ chức ca thi theo chính sách hệ thống.
- Báo cáo, audit log và các trợ lý AI trong phạm vi dữ liệu được cấp quyền.

SOES chưa đặt mục tiêu thay thế toàn bộ hệ thống quản lý đào tạo hoặc thực hiện các nghiệp vụ tài chính, tuyển sinh và cấp bằng. Các nghiệp vụ này có thể được tích hợp ở giai đoạn mở rộng.

### Phạm vi công nghệ

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Socket.IO Client, Monaco Editor và MediaPipe/ONNX cho các chức năng hỗ trợ giám sát.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO và Zod.
- AI: Gemini trực tiếp và AI Agent Python dùng FastAPI/LangChain/LangGraph; RAG truy xuất từ tài liệu được phép sử dụng.
- Chấm lập trình: Judge0 CE; hỗ trợ Java, C và C++ theo cấu hình câu hỏi.
- Blockchain: Ethereum Sepolia Testnet, smart contract `ExamHashRegistry`, thư viện ethers; backend lưu `contentHash`, transaction hash và thời điểm anchor trong dữ liệu đề thi.
- Lưu trữ: Supabase Storage cho tài liệu học tập, ảnh câu hỏi và file nguồn AI; MinIO cho evidence giám sát.
- Hạ tầng cục bộ: Docker Compose cung cấp PostgreSQL, Redis, MinIO và Judge0; môi trường production sẽ được chuẩn hóa theo nhu cầu triển khai.

### Phạm vi nền tảng

Phiên bản thương mại hóa đầu tiên ưu tiên Web responsive cho Admin, Teacher và Student. Ứng dụng mobile có thể được phát triển tiếp cho các luồng học tập, thông báo và quản trị; việc làm bài thi chính thức chỉ được mở rộng khi đã đánh giá đầy đủ rủi ro bảo mật và khả năng giám sát trên thiết bị di động.

## 5. Lịch trình thực hiện

| Giai đoạn | Thời gian dự kiến | Hoạt động chính |
|---|---:|---|
| Khảo sát và đặc tả | 2 tuần | Khảo sát quy trình khảo thí, phỏng vấn Admin/Teacher/Student, chốt SRS và KPI pilot. |
| Hoàn thiện nền tảng học vụ | 2 tuần | Chuẩn hóa User, role, khoa, môn, học kỳ, lớp học phần, ghi danh và phân quyền. |
| Ngân hàng câu hỏi và tạo đề | 3 tuần | Hoàn thiện CRUD câu hỏi, câu hỏi lập trình, question bank, duyệt câu hỏi, exam editor và snapshot. |
| Bảo chứng Blockchain | 1 tuần | Tính hash phiên bản đề, anchor lên Sepolia, lưu transaction, verify integrity, retry khi lỗi và hiển thị trạng thái trên giao diện. |
| Lập lịch và làm bài | 3 tuần | Lập lịch thi, phân phối câu hỏi, autosave, heartbeat, nộp bài, timeout và các trạng thái attempt. |
| Chấm điểm và kết quả | 2 tuần | Chấm trắc nghiệm, Judge0, chấm thủ công, finalize, công bố kết quả, xem lại và phúc khảo. |
| Giám sát thi realtime | 3 tuần | Webcam, screen share, tab/fullscreen, phone detection, evidence, Socket.IO và dashboard giám sát. |
| AI hỗ trợ học tập | 3 tuần | Sinh câu hỏi từ tài liệu, RAG, luyện tập, giải thích kết quả, kiểm chứng nguồn và review của giáo viên. |
| Kiểm định và pilot | 3 tuần | Kiểm thử chức năng, bảo mật, hiệu năng, usability; triển khai thử cho một khoa/lớp học phần. |
| Cải tiến và thương mại hóa | 2 tuần | Phân tích phản hồi, sửa lỗi, hoàn thiện tài liệu vận hành, bảng giá và kế hoạch triển khai khách hàng đầu tiên. |

Tổng thời gian MVP/pilot dự kiến khoảng **23 tuần**, có thể điều chỉnh theo phạm vi của cơ sở giáo dục thử nghiệm.

## 6. Ngân sách khởi nghiệp dự kiến

Ngân sách khởi nghiệp tham khảo cho giai đoạn 6 tháng đầu là **500.000.000 VNĐ**. Đây là ngân sách đề xuất để lập kế hoạch, cần cập nhật sau khi xác định quy mô pilot và nhân sự thực tế.

- **50% – 250.000.000 VNĐ:** nhân sự phát triển, kiểm thử, phân tích nghiệp vụ và hỗ trợ triển khai.
- **25% – 125.000.000 VNĐ:** hạ tầng cloud, database, storage, backup, monitoring, Judge0, RPC provider và gas testnet/mainnet khi cần.
- **10% – 50.000.000 VNĐ:** chi phí AI, embedding/RAG, kiểm thử sinh câu hỏi và hỗ trợ tài liệu.
- **10% – 50.000.000 VNĐ:** triển khai pilot, đào tạo người dùng, tài liệu, chăm sóc khách hàng và truyền thông B2B.
- **5% – 25.000.000 VNĐ:** pháp lý, bảo mật, dự phòng sự cố và chi phí phát sinh.

Blockchain là một thành phần bảo mật của SOES, nhưng không thay thế các cơ chế nghiệp vụ khác. Tính minh bạch được bảo đảm kết hợp bằng phân quyền, snapshot đề, audit log, lưu evidence, trạng thái nghiệp vụ và cơ chế kiểm soát truy cập. Blockchain chỉ neo hash của đề đã được chuẩn hóa; nội dung đề, đáp án, dữ liệu sinh viên và khóa mã hóa luôn nằm ngoài chuỗi.

## 7. Phân công nhiệm vụ

| Công việc | Trưởng dự án/BA | Backend & Data | Frontend & UX | AI & QA |
|---|---|---|---|---|
| Khảo sát, đặc tả và quản lý backlog | A/R | C | C | C |
| Thiết kế mô hình học vụ và database | A | R | C | I |
| Backend, API và phân quyền | C | A/R | C | C |
| Frontend Admin, Teacher, Student | C | C | A/R | C |
| Ngân hàng câu hỏi và tạo đề | A | R | R | C |
| Hash đề thi và smart contract | C | A/R | C | C |
| AI sinh câu hỏi, RAG và trợ lý học tập | C | C | C | A/R |
| Làm bài, Judge0 và chấm điểm | C | A/R | R | C |
| Proctoring, realtime và evidence | A | R | R | C |
| Kiểm thử chức năng, bảo mật và hiệu năng | A | C | C | R |
| Triển khai, giám sát và hỗ trợ pilot | A/R | R | C | C |

Quy ước: **A** – chịu trách nhiệm cuối cùng; **R** – trực tiếp thực hiện; **C** – được tham vấn; **I** – được thông báo.

## 8. Quản lý chi phí

### 8.1. Chi phí nhân sự

| Nhóm nhân sự | Vai trò | Dự toán 6 tháng |
|---|---|---:|
| Quản lý/BA | Quản lý sản phẩm, khảo sát, đặc tả, phối hợp nhà trường | 90.000.000 |
| Backend & Data | API, database, auth, exam, grading, realtime | 105.000.000 |
| Frontend & UX | Giao diện Admin, Teacher, Student và trải nghiệm làm bài | 90.000.000 |
| AI & QA | AI Agent, RAG, kiểm thử AI, QA và tài liệu chất lượng | 60.000.000 |
| **Tổng** |  | **345.000.000** |

Phần nhân sự là dự toán theo giai đoạn khởi nghiệp; nhóm có thể tận dụng nhân sự nội bộ hoặc nguồn lực sẵn có để giảm chi phí tiền mặt.

### 8.2. Chi phí tài nguyên

| Tài nguyên | Mục đích sử dụng | Đơn vị dự toán |
|---|---|---|
| PostgreSQL và Redis | Dữ liệu nghiệp vụ, session, cache và trạng thái realtime | Theo tháng |
| Supabase Storage | Tài liệu học tập, ảnh câu hỏi và file nguồn AI | Theo dung lượng/lưu lượng |
| MinIO hoặc object storage | Evidence webcam, screen và bằng chứng vi phạm | Theo dung lượng |
| Judge0 CE | Biên dịch, chạy và chấm câu hỏi lập trình | Theo hạ tầng |
| Ethereum Sepolia/RPC provider | Ghi và đọc hash đề thi, kiểm tra transaction | Theo giao dịch/gói dịch vụ |
| Gemini/AI Agent | Sinh câu hỏi, RAG, luyện tập và giải thích | Theo lượt/token |
| Cloud, backup, monitoring | Vận hành staging và production | Theo tháng |
| Thiết bị webcam và kiểm thử | Kiểm thử giám sát trên các trình duyệt/thiết bị | Tận dụng hoặc mua bổ sung |

## 9. Quản lý rủi ro

### 9.1. Rủi ro thị trường và tiếp nhận

**Vấn đề:** Nhà trường có thể đã sử dụng LMS, hệ thống khảo thí hoặc công cụ họp trực tuyến; việc chuyển đổi quy trình thi cần thời gian. Giá trị của hệ thống cũng phụ thuộc vào việc giảng viên và cán bộ coi thi chấp nhận thay đổi.

**Giải pháp:** Bắt đầu bằng một pilot nhỏ theo khoa/học phần; tập trung vào các điểm có giá trị rõ ràng như tạo đề nhanh, kiểm soát ngân hàng câu hỏi, giám sát tập trung và giảm thời gian chấm. Cung cấp tài liệu hướng dẫn, đào tạo theo vai trò và cho phép tích hợp dữ liệu thay vì yêu cầu thay thế toàn bộ hệ thống hiện có ngay lập tức.

### 9.2. Rủi ro kỹ thuật và bảo mật

**Vấn đề:** Thi đồng thời có thể tạo tải lớn; mất mạng hoặc trình duyệt bị đóng có thể ảnh hưởng bài làm; các tín hiệu giám sát có thể phát hiện nhầm; dữ liệu đề thi, bài làm và evidence là dữ liệu nhạy cảm.

**Giải pháp:** Dùng deadline phía server làm nguồn sự thật, autosave và heartbeat; dùng transaction/unique key để chống ghi trùng; kiểm thử concurrency cho nộp bài và chấm điểm; phân quyền chặt theo User/role/course/attempt; mã hóa secret; lưu audit log; tách metadata và file binary; giới hạn thời gian lưu evidence; thực hiện backup và kiểm thử khôi phục.

Kết quả proctoring chỉ là tín hiệu hỗ trợ. Hệ thống không tự kết luận gian lận cuối cùng chỉ từ một cảnh báo; giáo viên hoặc cán bộ coi thi phải review và quyết định theo quy trình.

**Blockchain:** RPC, ví triển khai hoặc giao dịch Sepolia có thể tạm thời không sẵn sàng; transaction có thể chậm hoặc thất bại. Hệ thống phải phân biệt rõ các trạng thái `VALID`, `TAMPERED`, `NOT_ANCHORED` và `BLOCKCHAIN_UNAVAILABLE`; không được coi đề là đã xác minh khi chưa đọc được dữ liệu trực tiếp từ chain. Luồng anchor phải idempotent, có retry và không ghi nội dung đề lên blockchain.

### 9.3. Rủi ro phụ thuộc dịch vụ bên thứ ba và AI

**Vấn đề:** Gemini, AI Agent, Judge0, storage hoặc dịch vụ cloud có thể giới hạn tốc độ, gián đoạn hoặc thay đổi chất lượng. AI có thể sinh câu hỏi sai, thiếu nguồn hoặc không phù hợp mục tiêu học tập.

**Giải pháp:** Giới hạn quota, timeout và kích thước dữ liệu; theo dõi health check; cung cấp thông báo lỗi rõ ràng; cho phép tiếp tục nghiệp vụ không phụ thuộc AI; bắt buộc validate/normalize, kiểm tra nguồn, lưu lịch sử sinh và yêu cầu giáo viên duyệt. AI không được tự động đưa câu hỏi vào đề thi chính thức.

### 9.4. Rủi ro tài chính

**Vấn đề:** Chi phí AI, lưu trữ video/evidence và hạ tầng tăng theo số lượng kỳ thi; khách hàng giáo dục thường có chu kỳ mua sắm và phê duyệt dài.

**Giải pháp:** Theo dõi chi phí theo tenant/kỳ thi; đặt retention cho evidence; dùng tier lưu trữ; giới hạn lượt AI; cung cấp gói giá theo quy mô và pilot có thời hạn; ưu tiên doanh thu từ hợp đồng triển khai, phí thuê bao và phí hỗ trợ chuyên sâu.

## 10. Quản lý chất lượng

SOES áp dụng QA/QC xuyên suốt vòng đời phát triển, tập trung vào độ đúng nghiệp vụ và tính toàn vẹn của kỳ thi:

- **Kiểm thử nghiệp vụ:** xác minh các luồng đăng nhập, phân quyền, ghi danh, tạo đề, lập lịch, bắt đầu thi, autosave, submit, timeout, grading, publish và appeal.
- **Kiểm thử dữ liệu:** kiểm tra snapshot đề, thứ tự câu hỏi/đáp án, ownership, không truy cập attempt của sinh viên khác và tính nhất quán giữa Exam, ExamSchedule, ExamAttempt và StudentAnswer.
- **Kiểm thử proctoring:** mô phỏng mất webcam, mất chia sẻ màn hình, thoát fullscreen, chuyển tab, phát hiện nhiều khuôn mặt/điện thoại, mất kết nối và review evidence.
- **Kiểm thử AI:** đánh giá tính phù hợp với tài liệu, citation, duplicate, placeholder, câu hỏi sai schema và khả năng từ chối khi thiếu bằng chứng. Nội dung AI phải qua giáo viên duyệt.
- **Kiểm thử lập trình:** kiểm tra compile error, runtime error, wrong answer, timeout, memory limit, hidden test và chống tạo submission trùng.
- **Kiểm thử Blockchain:** kiểm tra hash ổn định theo cùng một phiên bản đề, anchor một lần, đọc lại hash trên Sepolia, phát hiện nội dung bị sửa, xử lý đề chưa anchor, RPC lỗi, transaction chậm và retry idempotent.
- **Kiểm thử hiệu năng:** đo tải đồng thời vào đăng nhập, danh sách đề, autosave, heartbeat, submit, dashboard realtime và chấm code; đặt ngưỡng phản hồi theo SLA của từng khách hàng.
- **Bảo mật:** kiểm tra JWT/refresh token, HttpOnly cookie, role guard, IDOR, upload file, dữ liệu nhạy cảm, rate limit và quyền đọc evidence.
- **Triển khai có kiểm soát:** build/lint/test tự động, migration có kiểm soát, staging trước production, backup trước release và có kế hoạch rollback.

## 11. Kế hoạch triển khai

### Giai đoạn 1: Staging nội bộ

Triển khai backend, frontend, database, Redis, storage, Judge0, AI Agent và cấu hình Ethereum Sepolia trong môi trường staging. Deploy smart contract registry trên testnet, nạp dữ liệu mẫu gồm khoa, môn, lớp học phần, câu hỏi, đề và sinh viên. Kiểm tra toàn bộ luồng từ tạo đề, anchor hash, xác minh integrity đến công bố kết quả.

### Giai đoạn 2: Pilot có kiểm soát

Chọn một khoa hoặc một nhóm học phần có quy mô vừa phải. Mời giảng viên, cán bộ coi thi và sinh viên sử dụng thật trong một đợt kiểm tra. Chưa mở rộng toàn trường khi chưa đánh giá xong tỷ lệ autosave, sự cố trình duyệt, cảnh báo nhầm và thời gian xử lý của cán bộ.

### Giai đoạn 3: Thu thập phản hồi và cải tiến

Theo dõi dashboard vận hành, ticket hỗ trợ, lỗi frontend/backend, chất lượng AI và phản hồi người dùng. Tổ chức buổi hướng dẫn trước kỳ thi, cung cấp checklist webcam/trình duyệt/mạng và xử lý hotfix theo mức độ ảnh hưởng.

### Giai đoạn 4: Triển khai chính thức

Mở rộng theo khoa hoặc theo học kỳ; ký thỏa thuận SLA, chính sách bảo vệ dữ liệu, thời hạn lưu evidence và quy trình hỗ trợ. Chuẩn hóa backup, monitoring, phân quyền quản trị và đào tạo người dùng trước mỗi kỳ thi lớn.

### Giai đoạn 5: Mở rộng sản phẩm

Bổ sung tích hợp LMS/SIS, mobile learning, báo cáo nâng cao, multi-tenant, SSO, hỗ trợ nhiều ngôn ngữ và các mô hình khảo thí ngoài trường đại học.

## 12. Đánh giá hiệu quả

Hiệu quả dự án được đánh giá hàng tháng trong giai đoạn pilot và theo từng học kỳ khi vận hành chính thức:

- **Hiệu quả vận hành:** thời gian tạo đề/lập lịch; thời gian chấm và công bố điểm; tỷ lệ thao tác được số hóa; số lượng yêu cầu hỗ trợ trên mỗi kỳ thi.
- **Tính ổn định:** uptime; tỷ lệ request lỗi; tỷ lệ autosave thành công; tỷ lệ nộp bài thành công; số sự cố mất dữ liệu hoặc duplicate submission.
- **Tính toàn vẹn kỳ thi:** số trường hợp truy cập sai quyền; tỷ lệ snapshot đề đúng; số vi phạm có evidence hợp lệ; thời gian xử lý một cảnh báo; số lần phúc khảo được xử lý đúng hạn.
- **Tính toàn vẹn Blockchain:** tỷ lệ đề được anchor thành công; tỷ lệ verify hash hợp lệ; thời gian xác nhận transaction; số lần phát hiện hash không khớp; số lỗi RPC/retry chưa xử lý.
- **Hiệu quả AI:** tỷ lệ câu hỏi AI được giáo viên chấp nhận sau review; tỷ lệ câu hỏi phải sửa; tỷ lệ câu trả lời có nguồn hợp lệ; thời gian sinh; tỷ lệ lỗi provider.
- **Trải nghiệm người dùng:** tỷ lệ sinh viên hoàn thành bài thi; tỷ lệ giảng viên sử dụng question bank; điểm hài lòng của Admin/Teacher/Student; tỷ lệ quay lại sử dụng ở kỳ tiếp theo.
- **Hiệu quả kinh doanh:** số cơ sở giáo dục thử nghiệm; tỷ lệ chuyển đổi từ pilot sang hợp đồng; doanh thu thuê bao/triển khai; chi phí phục vụ mỗi sinh viên và tỷ lệ gia hạn.

Mục tiêu pilot đề xuất là: tỷ lệ nộp bài thành công từ **99% trở lên**, không mất dữ liệu bài làm, 100% đề thi có snapshot và audit log, 100% đề đã công bố được anchor hoặc hiển thị rõ trạng thái chưa anchor, 100% nội dung AI đưa vào đề chính thức có người duyệt, đồng thời xử lý các cảnh báo proctoring theo quy trình review thay vì tự động kết luận.

---

**Ghi chú:** Các con số về ngân sách, tiến độ và KPI trong tài liệu này là kế hoạch khởi nghiệp đề xuất. Chúng cần được hiệu chỉnh sau khi xác định cơ sở giáo dục pilot, quy mô người dùng, chính sách bảo vệ dữ liệu và SLA thực tế.
