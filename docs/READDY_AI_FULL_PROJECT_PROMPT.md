# Prompt thiết kế toàn bộ hệ thống SOES cho Readdy AI

Hãy thiết kế một ứng dụng web hoàn chỉnh tên **SOES - Smart Online Examination System**, là hệ thống thi trực tuyến thông minh dành cho trường đại học. Đây là ứng dụng nghiệp vụ thật, không phải landing page. Hãy tạo toàn bộ giao diện và prototype có thể thao tác xuyên suốt, dùng dữ liệu mẫu nhất quán giữa các vai trò.

**Ngôn ngữ bắt buộc:** toàn bộ nội dung hiển thị trên giao diện phải bằng tiếng Việt có dấu, bao gồm menu, tiêu đề, nhãn form, nút, tooltip, trạng thái, thông báo, validation, modal xác nhận, empty/error state và dữ liệu mẫu. Không trộn tiếng Anh trong UI, ngoại trừ tên công nghệ, mã định danh và thuật ngữ kỹ thuật bắt buộc như Java, C++, IP hoặc API. Các trạng thái nội bộ có thể dùng enum tiếng Anh trong code nhưng phải ánh xạ sang nhãn tiếng Việt khi hiển thị. Dùng định dạng ngày `dd/MM/yyyy`, giờ 24 tiếng và điểm theo thang điểm cấu hình của hệ thống.

## 1. Yêu cầu giao diện và kỹ thuật

- Công nghệ: React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, React Hook Form, Zod, TanStack Query, Socket.IO và Lucide Icons.
- Phong cách quản trị hiện đại, sạch, chuyên nghiệp, dễ sử dụng; nền xám nhạt, panel trắng, màu xanh là hành động chính. Admin có thể dùng thêm rose/amber để phân biệt.
- Không thiết kế kiểu trang marketing, không dùng banner hướng dẫn dài, không lạm dụng card, màu sắc hoặc chữ in đậm.
- Đồng bộ header, khoảng cách, input, dropdown, badge, table, modal và font trên toàn hệ thống.
- Tạo component dùng chung cho PageHeader, AppCard, AppButton, AppSelect, AppBadge, DataTable, SearchToolbar, Modal, ConfirmDialog, EmptyState, Pagination và Toast.
- Dropdown đẹp, không bị cắt trong modal; table header không xuống dòng; dữ liệu dùng cùng font size; icon-only button có tooltip.
- Responsive desktop, tablet và mobile; không để nội dung chồng lấn. Modal lớn có body cuộn và footer luôn nhìn thấy.
- Code sạch: page chỉ điều phối, chia component theo chức năng, tách hooks/services/types/constants/validation, không để file quá dài và không để code thừa.
- Mọi màn hình phải có loading, empty, error, disabled, permission denied, confirmation và success state.
- Tất cả nút trong prototype phải hoạt động: chuyển trang, mở modal, cập nhật mock data, xác nhận hoặc hiện toast; không để nút trang trí.

### Ngôn ngữ thiết kế phải giống giao diện SOES hiện tại

- Dùng font Roboto, cỡ chữ gốc khoảng 15–16px, màu chữ slate-800; dữ liệu thường font-normal, tiêu đề font-semibold, hạn chế font-bold.
- Layout ứng dụng gồm sidebar cố định bên trái, topbar mảnh phía trên và vùng nội dung gray-50. Sidebar có nhóm menu, icon Lucide, active item nền blue-600 chữ trắng; hỗ trợ thu gọn nhưng không tự đóng/mở nhóm khi đổi route.
- PageHeader cùng chiều cao và khoảng cách trên mọi trang: icon nền blue-50, tiêu đề, mô tả ngắn và cụm action bên phải. Không dùng hero, banner chào mừng lớn hoặc gradient trang trí.
- Card/panel trắng, `rounded-xl`, border gray-100, shadow-sm; khoảng cách 16–24px. Chỉ card dữ liệu lặp, modal và công cụ mới có khung; không bọc nhiều card lồng nhau.
- Nút chính blue-600, nút Admin có thể rose-600, nút phụ gray-100, nguy hiểm rose/red; chiều cao, padding và icon thống nhất. Icon quen thuộc dùng icon-only + tooltip.
- Filter bar một hàng trên desktop, gồm dropdown bên trái, nút Làm mới và ô tìm kiếm rộng 280–320px bên phải; xuống hàng hợp lý trên mobile. Admin có bộ lọc liên hoàn Khoa -> Bộ môn -> Môn học khi cần.
- DataTable nằm trong panel trắng, header gray-50 chữ nhỏ uppercase/semibold, không xuống dòng; row hover rất nhẹ; badge phẳng theo màu xanh lá/vàng/đỏ/xám. Không phóng to MSSV, thời gian, IP hoặc điểm.
- Modal xem đề/bài làm dùng gần toàn màn hình; modal form vừa phải. Dropdown render qua portal; menu bo góc và shadow; footer modal luôn thấy. Có transition 150–200ms tinh tế, không animation phô trương.
- Dashboard dùng KPI nhỏ gọn, biểu đồ đường/cột/histogram và danh sách công việc; tránh card quá cao hoặc chia hai card khổng lồ trên một hàng.

## 2. Đăng nhập và phân quyền

Hệ thống có ba vai trò: **ADMIN, TEACHER, STUDENT** và hai cổng đăng nhập:

- `/login`: dùng chung cho Giảng viên và Sinh viên.
- `/admin/login`: cổng riêng chỉ dành cho Admin.

Thiết kế đăng nhập, quên mật khẩu, đặt lại mật khẩu, đổi mật khẩu lần đầu, hồ sơ cá nhân, đăng xuất, tài khoản bị khóa và trang không có quyền. Sau đăng nhập phải chuyển đúng dashboard theo vai trò. Admin đăng xuất về cổng Admin; Giảng viên/Sinh viên về cổng chung. Frontend và Backend đều kiểm tra role; không cho đổi role bằng local state.

**Trưởng bộ môn không phải role thứ tư.** Đây là Giảng viên có `position = DEPARTMENT_HEAD` và được cấp thêm quyền `APPROVE_SHARED_QUESTION`, `APPROVE_FINAL_EXAM`, `VIEW_DEPARTMENT_EXAMS`, `VIEW_DEPARTMENT_REPORTS` trong đúng bộ môn phụ trách. Trưởng bộ môn đăng nhập tại `/login` và dùng layout Giảng viên; hệ thống chỉ hiện thêm chức năng Duyệt chuyên môn. Admin được quyền bổ nhiệm/gỡ chức danh và phạm vi bộ môn nhưng không tự duyệt nội dung học thuật.

## 3. Mô hình nghiệp vụ chính

- **Môn học** có nhiều **Lớp học phần** theo học kỳ.
- Lớp học phần có Giảng viên, Sinh viên, tài liệu, bài đăng và bảng điểm.
- **Đề thi (Exam)** là nội dung đề gốc có thể tái sử dụng, không gắn cố định với một lớp.
- Một Exam có thể áp dụng cho nhiều lớp bằng nhiều **Ca thi (ExamSchedule)** khác nhau.
- Mỗi lần Sinh viên làm bài tạo một **ExamAttempt** riêng.
- Khi Sinh viên bắt đầu, hệ thống random thứ tự câu/đáp án theo cấu hình và lưu snapshot cố định cho Attempt. Refresh hoặc vào lại vẫn phải đúng bài đã nhận.
- Không dùng mã đề hoặc phiên bản cố định 101/102/103.
- Chỉ có câu hỏi: một đáp án, nhiều đáp án, đúng/sai và lập trình console Java/C/C++.
- Không có tự luận và không có đáp án ngắn.
- Đề hỗn hợp chỉ gồm phần trắc nghiệm và phần lập trình.

## 4. Giao diện Admin

Sidebar Admin:

1. Dashboard.
2. Học kỳ và Môn học.
3. Lớp học phần và Xếp lớp.
4. Người dùng và Tài khoản.
5. Theo dõi đề thi và trạng thái duyệt.
6. Quản lý ngân hàng câu hỏi chung.
7. Lịch thi và Phân công coi thi.
8. Giám sát thi.
9. Báo cáo.
10. Audit Log và Cấu hình.

Chức năng Admin:

- Dashboard có KPI người dùng, lớp học, đề/câu hỏi đang chờ duyệt chuyên môn, ca thi sắp diễn ra, tỷ lệ tham gia, điểm và vi phạm.
- Quản lý học kỳ: danh sách, tìm kiếm, tạo, sửa, mở/đóng/lưu trữ.
- Quản lý năm học, kỳ thi và đợt thi; thiết lập học kỳ hiện tại, mở/đóng đợt giữa kỳ và cuối kỳ.
- Quản lý Khoa, Bộ môn, phạm vi chuyên môn và bổ nhiệm Trưởng bộ môn.
- Quản lý môn học: mã môn, tên, số tín chỉ, mô tả và trạng thái.
- Quản lý lớp học phần: môn, học kỳ, mã lớp, Giảng viên, sĩ số và trạng thái.
- Quản lý người dùng: danh sách Sinh viên/Giảng viên/Admin, tìm kiếm, tạo/import, khóa/mở khóa và reset mật khẩu; bổ nhiệm Giảng viên làm Trưởng bộ môn và giới hạn đúng department phụ trách.
- Ghi danh Sinh viên bằng tay hoặc import Excel/CSV; có màn hình preview dòng hợp lệ và dòng lỗi.
- Quản lý vận hành ngân hàng câu hỏi chung theo môn: tìm kiếm/lọc, xem câu đã được Trưởng bộ môn duyệt, lịch sử phiên bản và người đóng góp; lưu trữ/gỡ câu khỏi phạm vi dùng chung nhưng vẫn bảo toàn đề và bài làm cũ. Admin không sửa hoặc duyệt nội dung học thuật thay Trưởng bộ môn.
- Theo dõi đề cuối kỳ/đề chuẩn hóa và lịch sử duyệt; chỉ đề đã được Trưởng bộ môn duyệt mới được Admin chọn để tạo lịch thi tập trung.
- Quản lý lịch thi cuối kỳ/tập trung: chọn đề đã duyệt, tạo một hoặc nhiều ca, gán một hoặc nhiều lớp cùng môn, thời gian, phòng/IP và phân công một hoặc nhiều Giảng viên coi thi. Kiểm tra trùng lịch lớp, phòng và giám thị.
- Quản lý phòng thi/phòng máy: mã phòng, sức chứa, dải IP, thiết bị, trạng thái; có lịch dạng bảng và calendar, xuất lịch thi Excel/PDF.
- Xem giám sát realtime toàn trường và báo cáo tổng hợp.
- Cấu hình hệ thống: quy tắc mã tài khoản, giới hạn upload, cấu hình AI/Judge0, ngưỡng cảnh báo chống gian lận và thời gian lưu bằng chứng. Không cho cấu hình tự động trừ điểm hoặc tự hủy bài.
- Audit Log ghi lại đăng nhập, thay đổi tài khoản, duyệt, sửa điểm, hủy ca và các thao tác quan trọng.

## 5. Giao diện Giảng viên

Sidebar Giảng viên:

1. Trang chủ.
2. Lớp học phần.
3. Ngân hàng câu hỏi.
4. Rà soát câu hỏi.
5. Quản lý đề thi.
6. Sinh đề tự động.
7. Giám sát ca thi.
8. Thống kê phổ điểm.
9. Duyệt chuyên môn (chỉ hiện khi Giảng viên là Trưởng bộ môn).

### Dashboard và lớp học phần

- Dashboard hiển thị lớp đang phụ trách, tổng Sinh viên, đề nháp, ca thi sắp tới, lịch coi thi được Admin phân công, cảnh báo và công việc cần xử lý.
- Giảng viên được Admin phân công coi thi sẽ thấy ca đó trong lịch giám sát. Quyền coi thi chỉ cho phép xem thông tin cần thiết, giám sát, ghi nhận và xử lý sự cố của ca; không tự động cho quyền sửa đề, sửa điểm hoặc quản lý lớp không phụ trách.
- Danh sách lớp có tìm kiếm và lọc theo học kỳ, môn, trạng thái.
- Chi tiết lớp gồm các tab: Tài liệu và AI, Danh sách Sinh viên, Bảng tin, Bài thi, Bảng điểm.
- Giảng viên upload/download tài liệu PDF/Word/PowerPoint, bật quyền dùng tài liệu cho AI, đăng thông báo và xem danh sách Sinh viên.
- Bảng điểm hiển thị Quiz, Giữa kỳ, Cuối kỳ, Tổng kết và trạng thái công bố; hỗ trợ xuất Excel.
- Có trang lịch coi thi được phân công và trung tâm thông báo; ca do Admin gán phải liên kết trực tiếp đến màn hình giám sát đúng ca.

### Ngân hàng câu hỏi

- Có ngân hàng cá nhân và ngân hàng chung theo môn học.
- Danh sách có tìm kiếm, lọc môn, loại câu, độ khó, nguồn và trạng thái duyệt.
- Cho phép xem, tạo, sửa, lưu trữ và gửi câu hỏi cá nhân vào ngân hàng chung.
- Form trắc nghiệm hỗ trợ một đáp án, nhiều đáp án và đúng/sai.
- Form lập trình có đề bài, input/output, ngôn ngữ, starter code, giới hạn thời gian/bộ nhớ và test case mẫu/ẩn.
- Rà soát câu hỏi là hệ thống kiểm tra rule bắt buộc: thiếu nội dung, thiếu đáp án, đáp án trùng, sai loại câu, code thiếu test case hoặc sai tổng trọng số. Mỗi lỗi có mức độ và nút mở đúng modal câu hỏi để sửa.

### Duyệt chuyên môn dành cho Trưởng bộ môn

- Có hàng đợi câu hỏi chung và đề thi cuối kỳ thuộc đúng bộ môn được phân công.
- Xem đầy đủ nội dung, đáp án, độ khó, giải thích, cấu trúc, điểm và test case trước khi quyết định.
- APPROVE hoặc REJECT; từ chối bắt buộc nhập lý do để tác giả sửa và gửi lại.
- Không được tự duyệt câu hỏi/đề do chính mình soạn; hệ thống chuyển sang Trưởng bộ môn khác hoặc người duyệt được ủy quyền.
- Xem lịch sử duyệt và báo cáo chất lượng trong phạm vi bộ môn; không có quyền quản trị tài khoản, học kỳ hoặc cấu hình hệ thống.

### AI tạo câu hỏi

- Cho phép tải PDF/DOCX/TXT hoặc chọn tài liệu lớp đã bật AI.
- Có chế độ bóc tách câu hỏi có sẵn và sinh câu hỏi trắc nghiệm mới.
- Cho chọn môn, số lượng, độ khó, chủ đề và prompt.
- Hiển thị tiến trình và lịch sử AI.
- Kết quả AI luôn là bản nháp để Giảng viên xem, sửa, chọn hoặc loại bỏ; AI không tự công bố.

### Tạo và quản lý đề thi

Loại bài thi: Quiz, Giữa kỳ, Cuối kỳ. Loại đề: Trắc nghiệm, Lập trình, Hỗn hợp.

Tạo đề thủ công theo 5 bước:

1. Thông tin: môn, tên, loại bài thi, loại đề, mô tả.
2. Phần thi và điểm: tạo/sắp xếp phần, đặt điểm từng phần.
3. Câu hỏi: chọn từ ngân hàng, tạo mới hoặc AI từ file; gán câu vào phần.
4. Cấu hình đề: tổng điểm và thời lượng mặc định.
5. Preview: xem câu hỏi, đáp án, điểm và tổng điểm.

Điểm từng câu được tự chia đều theo điểm phần nhưng vẫn cho phép sửa trực tiếp. Tổng điểm thực tế phải luôn bằng tổng điểm mục tiêu. Card câu hỏi có đóng/mở; khi đóng chỉ hiện số thứ tự, nội dung ngắn, loại và điểm. Chuyển tab không làm mất dữ liệu hoặc trạng thái đóng/mở.

Sinh đề tự động:

- Chọn môn, tên đề, loại bài thi, tổng điểm, thời lượng và nguồn câu hỏi.
- Chế độ tự động chọn số câu Dễ/Trung bình/Khó hoặc Giảng viên chọn thủ công.
- Kiểm tra ngân hàng có đủ câu, tránh trùng, tự chia điểm và tạo một Exam DRAFT để preview/chỉnh sửa.
- Không cấu hình IP, chống gian lận, mật khẩu hoặc công bố điểm tại màn hình tạo đề.

Trạng thái Exam: DRAFT, PENDING_APPROVAL, REJECTED, READY/PUBLISHED, LOCKED, ARCHIVED. Đề nháp được sửa/xóa. Đề cuối kỳ gửi Trưởng bộ môn duyệt chuyên môn. Đề đã có Sinh viên bắt đầu làm phải khóa nội dung. Cho phép xem, sao chép đề thành bản nháp mới và lưu trữ đề cũ; không xóa dữ liệu bài làm.

Luồng kỳ thi: Quiz/Giữa kỳ do Giảng viên tạo đề và tạo ca trong lớp mình nếu chính sách trường cho phép. Cuối kỳ tập trung theo luồng: Giảng viên soạn và gửi đề -> Trưởng bộ môn duyệt chuyên môn -> Admin/khảo thí tạo ca, gán lớp/phòng/IP và phân công coi thi. Quy tắc này có thể cấu hình nếu trường áp dụng quy trình khác.

Trang chi tiết Exam gồm các tab rõ ràng: Ca thi/Lớp áp dụng; Giám sát realtime & bằng chứng; Bài nộp & chấm lại; Tổng quan cài đặt. Header có nút Xem đề gần toàn màn hình, Sao chép đề, Chỉnh sửa khi còn quyền và Lưu trữ/Ẩn khỏi Sinh viên. Không tạo tab phiên bản đề cố định.

### Ca thi và phân lớp

Từ chi tiết Exam, tạo một hoặc nhiều ca thi cho một/nhiều lớp cùng môn. Form ca thi gồm:

- Lớp áp dụng, ngày thi, giờ mở/đóng.
- Thời lượng mặc định lấy từ Exam nhưng có thể sửa trước khi có bài làm.
- Số lần làm, mật khẩu, cách công bố điểm và quyền xem lại bài.
- Chống gian lận: toàn màn hình, webcam, chặn copy/paste, chuột phải.
- Thi tại nhà/online hoặc giới hạn IP trường.
- Cách phân phối: cố định, xáo câu, xáo câu và đáp án, hoặc random tập con.
- Giảng viên coi thi.

Ca thi có trạng thái DRAFT, SCHEDULED, OPEN, CLOSED, CANCELLED. Ca chưa diễn ra được xem/sửa/hủy; ca đang mở chỉ giám sát; ca đã đóng chỉ được xem, chấm điểm, phúc khảo và công bố điểm, không còn nút cập nhật/hủy.

### Giám sát và chấm điểm

- Trang realtime bắt buộc chọn ca/lớp; có KPI online, đang làm, đã nộp, mất kết nối và cảnh báo.
- Bảng Sinh viên hiển thị MSSV, tên, lớp, tiến độ, thời gian còn lại, IP, thiết bị, webcam và vi phạm.
- Ghi nhận chuyển tab, thoát toàn màn hình, copy/paste, mất/nhiều khuôn mặt, camera bị chặn, IP thay đổi, mất heartbeat và đăng nhập nhiều phiên.
- Vi phạm chỉ là bằng chứng/cảnh báo, không tự động cho 0 điểm.
- Giảng viên có thể xem timeline bằng chứng, gửi cảnh báo, ghi chú, đánh dấu đã xem và xử lý có lý do.
- Danh sách bài nộp có thời gian nộp, điểm tự động, điểm sửa và điểm chốt.
- Modal xem bài gần toàn màn hình, hiển thị đúng snapshot câu hỏi, đáp án, code và kết quả test.
- Sửa điểm bắt buộc nhập lý do và lưu lịch sử điểm cũ/mới/người sửa/thời gian.
- Hỗ trợ công bố điểm, xem lại bài và xử lý yêu cầu phúc khảo.

## 6. Giao diện Sinh viên

Sidebar Sinh viên:

1. Dashboard.
2. Môn học.
3. Bài thi.
4. Tài liệu.
5. Thông báo.
6. Cài đặt.

Chức năng:

- Dashboard hiển thị môn đang học, bài thi sắp tới, thông báo và thống kê điểm đã công bố.
- Danh sách/chi tiết môn có bài đăng, tài liệu, thành viên, bài thi và điểm.
- Danh sách bài thi chỉ hiển thị ca thuộc lớp Sinh viên đã ghi danh.
- Chi tiết ca thi hiển thị đề, môn/lớp, giờ mở/đóng, thời lượng, số lần còn lại, mật khẩu, webcam, IP và quy định thi.
- Chỉ được bắt đầu đúng thời gian, đúng lớp, còn lượt, đúng mật khẩu/IP và không có Attempt khác đang hoạt động.
- Nếu bài đang làm còn hạn, hiển thị Tiếp tục làm bài thay vì tạo bài mới.

Màn hình làm bài:

- Header có tên bài, trạng thái lưu, kết nối, đồng hồ và nút Nộp bài.
- Danh sách câu cho biết chưa làm, đã làm và đánh dấu xem lại.
- Trắc nghiệm dùng radio/checkbox; lập trình có code editor, chọn ngôn ngữ và chạy test mẫu.
- Tự động lưu khi đổi đáp án và định kỳ; refresh/mất mạng phải phục hồi đúng bài, câu và đáp án.
- Thời gian do server quyết định; hết giờ tự nộp.
- Nộp thủ công cần xác nhận và báo số câu chưa làm; sau nộp không được sửa.
- Không hiển thị đáp án đúng hoặc hidden test khi chưa được phép.
- Bố cục thích ứng theo loại câu: trắc nghiệm hiển thị nội dung rộng; câu lập trình dùng Monaco Editor, console và test mẫu; đề hỗn hợp chuyển section rõ ràng. Không cố định chia đôi màn hình cho mọi câu.
- Có bước kiểm tra trước khi thi: webcam, quyền camera, kết nối, fullscreen, IP và mật khẩu; hiển thị lỗi cụ thể và cho kiểm tra lại.

Kết quả:

- Hiển thị điểm chốt, thời gian làm, số câu đúng và test code đạt.
- Chính sách điểm theo ca: hiện ngay, Giảng viên công bố, hẹn giờ hoặc chưa công bố.
- Quyền xem lại bài độc lập: không xem, chỉ xem điểm, xem câu trả lời không có đáp án, hoặc xem đầy đủ trong thời gian cho phép.
- Sinh viên có thể gửi phúc khảo trong thời hạn, theo dõi trạng thái và nhận thông báo khi điểm thay đổi.
- Có trang lịch sử bài thi, chi tiết bài đã nộp, trạng thái chờ chấm/chưa công bố, trung tâm thông báo, hồ sơ và bảo mật tài khoản.

## 7. Chấm tự động, bảo mật và dữ liệu

- Trắc nghiệm một đáp án/đúng-sai chấm đúng hoặc sai; nhiều đáp án mặc định phải chọn đúng toàn bộ.
- Code chạy bằng Judge0 hoặc sandbox tương đương, chấm theo trọng số test case; không lộ hidden test.
- ExamAttempt lưu snapshot để chấm, xem lại và phúc khảo chính xác.
- Autosave, Start, Submit và gửi code phải chống tạo trùng khi người dùng nhấn nhiều lần.
- Backend là nguồn thời gian và phân quyền chính thức.
- JWT/refresh token an toàn, password hash, RBAC và ownership cho API, rate limit, validate file/input và signed URL cho bằng chứng webcam.
- Ưu tiên khóa/lưu trữ/xóa mềm; không xóa User, Question, Exam, Schedule đã có dữ liệu liên quan.
- Notification cho lịch thi, thay đổi/hủy ca, duyệt/từ chối, công bố điểm và phúc khảo.
- Audit Log cho thao tác quản trị, duyệt, sửa điểm, hủy ca và xử lý vi phạm.

## 8. Dữ liệu mẫu và yêu cầu bàn giao

Dùng dữ liệu nhất quán: học kỳ `HK1_2026`, môn `CS101 - Lập trình Java`, lớp `JAVA_01_HK1_2026` và `JAVA_02_HK1_2026`, Giảng viên Nguyễn Văn An, Sinh viên `SV2026001` Trần Minh Nam và `SV2026002` Lê Thị Thu Thảo, đề `Bài thi Giữa kỳ Lập trình Java` 10 điểm/60 phút, hai ca 08:00 và 13:00, bài làm 8.5 điểm và một bài được sửa lên 10 điểm có lý do.

Hãy bàn giao:

1. Sitemap và nested route đầy đủ của ba vai trò và hai cổng đăng nhập.
2. Design system và component library dùng chung.
3. Toàn bộ page, table, card, modal và form đã mô tả.
4. Prototype tương tác xuyên suốt Admin quản trị/tổ chức kỳ thi, Giảng viên tạo câu hỏi/đề/ca/giám sát/chấm, Trưởng bộ môn duyệt chuyên môn và Sinh viên vào thi/nộp/xem kết quả/phúc khảo.
5. Mock data và service layer nhất quán, sẵn sàng thay bằng API thật.
6. Responsive, accessibility, loading/empty/error/permission/confirm đầy đủ.
7. Không có tự luận, đáp án ngắn, mã đề cố định; không đặt cấu hình ca thi trong Exam; ca CLOSED không được cập nhật/hủy; không làm lộ điểm, đáp án hoặc hidden test khi chưa được phép.
8. Đầy đủ route và màn hình: Auth; Admin Dashboard/Năm học-Học kỳ/Khoa-Bộ môn/Môn/Lớp/Người dùng/Ngân hàng chung/Đề thi/Lịch-Phòng thi/Phân công/Giám sát/Báo cáo/Audit/Cấu hình; Teacher Dashboard/Lớp/Câu hỏi/AI/Rà soát/Đề thủ công-Sinh tự động/Chi tiết đề-Ca thi/Giám sát/Bài nộp-Phúc khảo/Phổ điểm/Duyệt chuyên môn; Student Dashboard/Môn-Timeline-Bài đăng-Tài liệu-Thành viên-Điểm/Lịch thi/Pre-check/Phòng thi/Kết quả-Phúc khảo/Thông báo/Hồ sơ.
9. Giữ nhận diện giao diện SOES hiện tại, không thay thành theme glassmorphism, landing page hoặc dashboard template xa lạ.

Ưu tiên tính đúng nghiệp vụ, giao diện dễ thao tác, dữ liệu rõ ràng và clean code có thể mở rộng. Không thêm chức năng làm thay đổi các quy tắc cốt lõi trên.
