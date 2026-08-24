# Chức năng và quy trình nghiệp vụ phía giảng viên

## 1. Mục tiêu

Tài liệu này mô tả các chức năng phía giảng viên trong hệ thống SOES và cách các chức năng phối hợp với nhau trong quy trình tổ chức thi trực tuyến.

Phía giảng viên tập trung vào các nghiệp vụ chính:

- Quản lý lớp học phần được phân công.
- Quản lý tài liệu học tập.
- Quản lý ngân hàng câu hỏi.
- Sử dụng AI để hỗ trợ sinh câu hỏi trắc nghiệm.
- Tạo đề thi thủ công hoặc sinh đề tự động.
- Lưu nháp, xem trước và công bố đề thi.
- Theo dõi ca thi trực tuyến.
- Chấm điểm, chấm lại thủ công và công bố điểm.
- Xuất bảng điểm phục vụ báo cáo.

## 2. Nguyên tắc nghiệp vụ chung

| Nguyên tắc | Giải thích |
|---|---|
| Giảng viên chỉ thao tác trên lớp mình phụ trách | Dữ liệu lớp học phần, sinh viên, đề thi và điểm số phải thuộc phạm vi giảng viên được phân công |
| Giảng viên không ghi danh sinh viên | Danh sách sinh viên do Admin hoặc bộ phận đào tạo quản lý để đảm bảo dữ liệu chính thức |
| AI chỉ là công cụ hỗ trợ | AI không tự công bố câu hỏi, không tự lưu vào ngân hàng và không tự đưa vào đề nếu chưa được giảng viên duyệt |
| Đề đã công bố phải khóa nội dung chính | Sau khi đề thi công bố, không được sửa câu hỏi, điểm câu hỏi hoặc phiên bản đề để tránh ảnh hưởng bài làm |
| Sinh đề tự động chỉ áp dụng cho trắc nghiệm | Bài lập trình cần test case và expected output nên phải do giảng viên tạo/chọn thủ công |
| Điểm sinh viên thấy phụ thuộc cấu hình công bố điểm | Có thể hiện ngay, ẩn chờ giảng viên công bố hoặc tự động công bố theo thời gian |

## 3. Tổng quan chức năng

| STT | Chức năng | Mục đích | Cách hoạt động |
|---|---|---|---|
| 1 | Dashboard giảng viên | Xem nhanh tình hình giảng dạy và thi | Hiển thị số lớp phụ trách, tổng sinh viên, đề đã công bố, cảnh báo cần xử lý |
| 2 | Lớp học phần | Quản lý phạm vi lớp được phân công | Xem thông tin lớp, tài liệu, sinh viên, bài thi, bảng điểm |
| 3 | Tài liệu học tập | Lưu tài liệu phục vụ học tập và AI | Giảng viên upload tài liệu theo lớp học phần, kiểm tra trùng tên tệp |
| 4 | Chọn tài liệu cho AI | Xác định tài liệu AI được phép dùng | Chỉ tài liệu được chọn mới được gửi cho AI xử lý |
| 5 | Ngân hàng câu hỏi | Lưu và tái sử dụng câu hỏi | Giảng viên tạo/sửa/xem câu hỏi trắc nghiệm hoặc lập trình |
| 6 | AI sinh câu hỏi | Hỗ trợ tạo câu hỏi trắc nghiệm từ tài liệu | AI sinh câu hỏi nháp, giảng viên duyệt rồi mới lưu |
| 7 | Rà soát câu hỏi | Kiểm tra chất lượng câu hỏi | Phát hiện thiếu đáp án, thiếu test case, trùng lựa chọn, thiếu giải thích |
| 8 | Quản lý đề thi | Quản lý danh sách đề | Xem đề nháp, đề đã công bố, đề đã đóng |
| 9 | Tạo đề thủ công | Tạo đề theo ý giảng viên | Chọn câu hỏi, nhập điểm, cấu hình thời gian, xáo trộn, hiển thị điểm |
| 10 | Sinh đề tự động | Tạo đề trắc nghiệm nhanh | Chọn môn, số câu theo độ khó, hệ thống bốc câu trắc nghiệm phù hợp |
| 11 | Phiên bản đề | Tạo các bản xáo trộn | Các phiên bản dùng cùng bộ câu hỏi, khác thứ tự câu và đáp án |
| 12 | Giám sát ca thi | Theo dõi ca thi đang diễn ra | Xem trạng thái sinh viên, tiến độ, IP, cảnh báo, xử lý sự cố |
| 13 | Nhật ký vi phạm và bằng chứng | Xem lại dữ liệu giám sát của một đề | Xem chuyển tab, thoát fullscreen, webcam, IP, ảnh bằng chứng |
| 14 | Bài nộp và chấm điểm | Xem kết quả làm bài | Hệ thống chấm tự động, giảng viên có thể ghi đè điểm chốt |
| 15 | Công bố điểm | Cho sinh viên xem điểm | Theo cấu hình: hiện ngay, công bố thủ công hoặc hẹn giờ |
| 16 | Xuất điểm | Xuất bảng điểm phục vụ báo cáo | Xuất điểm Quiz, Giữa kỳ, Cuối kỳ, điểm trung bình |

## 4. Quy trình quản lý lớp học phần

### 4.1. Mục đích

Giảng viên cần xem các lớp học phần mình phụ trách để quản lý tài liệu, sinh viên, bài thi và điểm số.

### 4.2. Quy trình

1. Giảng viên đăng nhập vào hệ thống.
2. Hệ thống xác định các lớp học phần giảng viên được phân công.
3. Giảng viên vào màn hình `Lớp học phần`.
4. Giảng viên chọn một lớp cụ thể để xem chi tiết.
5. Trong chi tiết lớp, giảng viên có thể:
   - Tải tài liệu học tập.
   - Chọn tài liệu cho AI.
   - Xem danh sách sinh viên.
   - Xem bài thi thuộc lớp.
   - Xem bảng điểm lớp.
   - Đăng thông báo lớp học nếu hệ thống hỗ trợ.

### 4.3. Quy tắc

- Sinh viên không tự đăng ký lớp học phần.
- Giảng viên không thêm/xóa/import sinh viên trong lớp.
- Danh sách sinh viên được quản lý bởi Admin hoặc bộ phận đào tạo.

## 5. Quy trình quản lý tài liệu học tập

### 5.1. Mục đích

Tài liệu học tập được dùng cho giảng dạy và làm nguồn dữ liệu cho AI sinh câu hỏi.

### 5.2. Quy trình

1. Giảng viên vào chi tiết lớp học phần.
2. Chọn tab tài liệu học tập.
3. Tải lên tài liệu dạng PDF, DOCX hoặc PPTX.
4. Hệ thống kiểm tra tên tệp có trùng trong cùng lớp không.
5. Nếu không trùng, tài liệu được lưu vào lớp học phần.
6. Giảng viên chọn tài liệu nào được phép dùng cho AI.

### 5.3. Quy tắc

- Một lớp học phần có nhiều tài liệu.
- Tài liệu thuộc về một lớp học phần cụ thể.
- AI chỉ được xử lý tài liệu đã được giảng viên chọn.

## 6. Quy trình quản lý ngân hàng câu hỏi

### 6.1. Câu hỏi trắc nghiệm

Giảng viên có thể tạo câu hỏi trắc nghiệm một đáp án hoặc nhiều đáp án.

Thông tin cần có:

- Môn học.
- Nội dung câu hỏi.
- Dạng câu hỏi.
- Độ khó.
- Danh sách phương án.
- Đáp án đúng.
- Giải thích nếu cần.

### 6.2. Câu hỏi lập trình

Câu hỏi lập trình dùng để sinh viên nộp mã nguồn và hệ thống chấm tự động.

Thông tin cần có:

- Nội dung đề bài.
- Ngôn ngữ hỗ trợ: Java, C, C++.
- Giới hạn thời gian.
- Giới hạn bộ nhớ.
- Test case.
- Input.
- Expected output.
- Trọng số từng test case.
- Test case công khai hoặc ẩn.

### 6.3. Quy tắc

- Câu hỏi thuộc quyền sở hữu của giảng viên tạo ra.
- Giảng viên có thể tái sử dụng câu hỏi của mình.
- Câu hỏi lập trình phải có test case trước khi đưa vào đề.

## 7. Quy trình AI sinh câu hỏi

### 7.1. Mục đích

AI hỗ trợ giảng viên tạo nhanh câu hỏi trắc nghiệm từ tài liệu học tập.

### 7.2. Quy trình

1. Giảng viên mở chức năng AI sinh câu hỏi.
2. Chọn tài liệu học tập được phép xử lý.
3. Nhập prompt hoặc yêu cầu bổ sung.
4. Chọn số lượng câu hỏi.
5. AI sinh câu hỏi trắc nghiệm nháp.
6. Giảng viên xem từng câu hỏi AI sinh ra.
7. Giảng viên có thể:
   - Chấp nhận câu hỏi.
   - Từ chối câu hỏi.
   - Chỉnh sửa câu hỏi nếu cần.
8. Chỉ câu hỏi được chấp nhận mới được lưu vào ngân hàng câu hỏi.

### 7.3. Quy tắc

- AI không tự công bố câu hỏi.
- AI không tự lưu câu hỏi vào ngân hàng.
- AI không tự đưa câu hỏi vào đề thi.
- Trong phạm vi MVP, AI chỉ sinh câu hỏi trắc nghiệm.
- Với bài lập trình, AI chỉ nên gợi ý nội dung, không tạo bài chính thức.

## 8. Quy trình rà soát chất lượng câu hỏi

### 8.1. Mục đích

Giúp giảng viên phát hiện các câu hỏi chưa đủ điều kiện đưa vào đề thi.

### 8.2. Các lỗi cần phát hiện

| Loại lỗi | Ý nghĩa |
|---|---|
| Thiếu đáp án đúng | Câu trắc nghiệm chưa đánh dấu đáp án |
| Trùng phương án | Hai hoặc nhiều phương án có nội dung giống nhau |
| Thiếu giải thích | Câu hỏi chưa có giải thích phục vụ xem lại |
| Thiếu test case | Bài lập trình chưa có bộ kiểm thử |
| Thiếu expected output | Test case chưa có kết quả mong đợi |

### 8.3. Quy tắc

- Đây là chức năng kiểm tra kỹ thuật.
- Không phải quy trình Admin duyệt câu hỏi.
- Giảng viên vẫn là người quyết định sửa và sử dụng câu hỏi.

## 9. Quy trình tạo đề thủ công

### 9.1. Mục đích

Cho phép giảng viên chủ động tạo đề thi theo nội dung mong muốn.

### 9.2. Quy trình

1. Giảng viên chọn `Tạo đề thi mới`.
2. Chọn cấu trúc đề:
   - Trắc nghiệm.
   - Lập trình.
   - Hỗn hợp.
3. Cấu hình thông tin bài thi:
   - Tên bài thi.
   - Loại bài thi: Quiz, Giữa kỳ, Cuối kỳ.
   - Lớp học phần áp dụng.
   - Thời gian bắt đầu.
   - Thời gian kết thúc.
   - Thời lượng làm bài.
   - Số lần làm.
   - Mật khẩu nếu có.
4. Chọn hoặc tạo câu hỏi.
5. Cấu hình điểm từng câu:
   - Tự chia đều điểm theo tổng điểm.
   - Hoặc nhập điểm thủ công từng câu.
6. Cấu hình xáo trộn câu hỏi/đáp án.
7. Cấu hình phiên bản đề.
8. Cấu hình hiển thị điểm.
9. Lưu nháp hoặc công bố.

### 9.3. Quy tắc

- Đề nháp có thể chỉnh sửa.
- Đề đã công bố không được sửa nội dung chính.
- Nếu đề có câu lập trình, câu lập trình phải có test case hợp lệ.

## 10. Quy trình sinh đề tự động

### 10.1. Mục đích

Giúp giảng viên tạo nhanh đề trắc nghiệm từ ngân hàng câu hỏi.

### 10.2. Quy trình

1. Giảng viên vào `Sinh đề tự động`.
2. Chọn môn học/lớp học phần.
3. Cấu hình bài thi:
   - Tên bài thi.
   - Loại bài thi.
   - Thời gian thi.
   - Thời lượng.
   - Số lần làm.
   - Mật khẩu nếu có.
   - Cách hiển thị điểm.
4. Chọn cách lấy câu hỏi:
   - Hệ thống tự bốc theo độ khó.
   - Hoặc giảng viên tự chọn câu hỏi từ ngân hàng.
5. Nếu tự bốc, giảng viên nhập số câu dễ, trung bình, khó.
6. Hệ thống kiểm tra ngân hàng có đủ câu hỏi trắc nghiệm theo từng độ khó không.
7. Nếu đủ, hệ thống sinh các phiên bản đề.
8. Giảng viên xem trước phiên bản đề.
9. Giảng viên lưu nháp.
10. Sau khi lưu nháp, giảng viên công bố cho lớp.

### 10.3. Quy tắc

- Sinh đề tự động chỉ bốc câu hỏi trắc nghiệm.
- Không tự động bốc câu hỏi lập trình.
- Bài lập trình phải do giảng viên tạo hoặc chọn thủ công.
- Phải lưu nháp trước khi công bố.

## 11. Quy trình phiên bản đề

### 11.1. Mục đích

Giảm khả năng sinh viên có cùng thứ tự câu hỏi và đáp án.

### 11.2. Cách hoạt động

- Một đề thi có thể có một hoặc nhiều phiên bản.
- Các phiên bản dùng cùng bộ câu hỏi.
- Khác nhau ở thứ tự câu hỏi và thứ tự đáp án.
- Khi sinh viên bắt đầu thi online, hệ thống tự gán một phiên bản.
- Sinh viên không cần nhập mã đề.

### 11.3. Quy tắc

- Khi đề còn nháp, giảng viên có thể xem trước/sửa phiên bản.
- Khi đề đã công bố, phiên bản đề bị khóa.
- Bài làm của sinh viên phải lưu lại phiên bản đề đã nhận.

## 12. Quy trình công bố đề thi

### 12.1. Mục đích

Đưa đề thi từ trạng thái nháp sang trạng thái chính thức để sinh viên có thể làm bài.

### 12.2. Quy trình

1. Giảng viên tạo đề.
2. Kiểm tra câu hỏi, điểm, thời gian, phiên bản đề.
3. Lưu nháp.
4. Xem trước đề.
5. Công bố đề cho lớp học phần.
6. Hệ thống khóa cấu hình chính của đề.
7. Sinh viên chỉ thấy đề khi:
   - Đề đã công bố.
   - Sinh viên thuộc lớp học phần.
   - Đúng thời gian mở đề.
   - Còn lượt làm.
   - Nhập đúng mật khẩu nếu đề có mật khẩu.

### 12.3. Quy tắc

- Không công bố đề nếu chưa lưu nháp.
- Không sửa nội dung chính sau khi công bố.
- Có thể đóng đề sau khi kỳ thi kết thúc.

## 13. Quy trình sinh viên làm bài

### 13.1. Điều kiện vào thi

Sinh viên được làm bài khi:

- Thuộc lớp học phần.
- Đề thi đã công bố.
- Đang trong thời gian diễn ra.
- Còn số lần làm bài.
- Nhập đúng mật khẩu nếu có.

### 13.2. Trong lúc làm bài

- Hệ thống tự gán phiên bản đề.
- Hệ thống hiển thị câu hỏi theo phiên bản đã gán.
- Sinh viên làm bài và có thể xem lại câu trả lời khi chưa nộp.
- Hệ thống tự lưu tiến độ định kỳ.
- Nếu mất kết nối hoặc tải lại trang, sinh viên có thể tiếp tục nếu thời gian còn hiệu lực.

### 13.3. Nộp bài

Bài thi kết thúc khi:

- Sinh viên chủ động nộp bài.
- Hoặc hết thời gian làm bài.

Sau khi nộp:

- Sinh viên không được sửa đáp án.
- Sinh viên không được xem lại nội dung đề và đáp án nếu chưa được phép.

## 14. Quy trình giám sát ca thi

### 14.1. Màn hình giám sát ca thi

Màn hình `Giám sát ca thi` dùng để theo dõi trực tiếp toàn bộ ca thi đang diễn ra.

Giảng viên có thể xem:

- Sinh viên đang online.
- Sinh viên đã nộp.
- Sinh viên bị cảnh báo.
- Tiến độ làm bài.
- Địa chỉ IP.
- Vi phạm mới phát sinh.

Giảng viên có thể thao tác:

- Cộng thêm thời gian khi có sự cố.
- Buộc nộp bài khi có lý do hợp lệ.

### 14.2. Nhật ký vi phạm trong chi tiết đề

Tab `Nhật ký vi phạm và bằng chứng` trong chi tiết đề dùng để xem lại dữ liệu giám sát của một đề cụ thể.

Dữ liệu gồm:

- Sinh viên vi phạm.
- Loại vi phạm.
- Thời gian vi phạm.
- Địa chỉ IP.
- Mức độ nghiêm trọng.
- Ảnh bằng chứng webcam nếu có.

### 14.3. Quy tắc

- Vi phạm không tự động hủy bài ngay.
- Mọi vi phạm phải được ghi log.
- Giảng viên xem xét vi phạm trước khi quyết định xử lý điểm hoặc phúc khảo.

## 15. Quy trình chấm điểm

### 15.1. Chấm tự động

Hệ thống chấm tự động sau khi sinh viên nộp bài:

- Câu trắc nghiệm được chấm theo đáp án đúng.
- Câu lập trình được chấm theo test case.

### 15.2. Điểm chốt

Điểm chốt là điểm cuối cùng dùng để công bố hoặc xuất bảng điểm.

Điểm chốt có thể bằng:

- Điểm tự động.
- Hoặc điểm giảng viên ghi đè thủ công.

### 15.3. Chấm lại thủ công

Giảng viên có thể sửa điểm khi:

- Có phúc khảo.
- Có lỗi chấm tự động.
- Có sự cố trong quá trình thi.
- Cần xử lý vi phạm.

Mỗi lần sửa điểm nên lưu:

- Người sửa.
- Thời gian sửa.
- Điểm cũ.
- Điểm mới.
- Lý do sửa.

## 16. Quy trình công bố điểm

### 16.1. Các chế độ hiển thị điểm

| Chế độ | Ý nghĩa |
|---|---|
| Hiện điểm ngay | Sinh viên thấy điểm sau khi nộp và hệ thống chấm xong |
| Ẩn điểm, giảng viên công bố sau | Sinh viên chưa thấy điểm cho đến khi giảng viên bật công bố |
| Tự động công bố theo thời gian | Sinh viên thấy điểm sau thời điểm đã cấu hình |

### 16.2. Quy tắc

- Công bố điểm áp dụng cho toàn bộ sinh viên trong bài thi.
- Không công bố riêng lẻ từng sinh viên.
- Bảng điểm và dashboard sinh viên chỉ hiển thị điểm đã đủ điều kiện công bố.

## 17. Quy trình xuất điểm

### 17.1. Mục đích

Giảng viên xuất bảng điểm lớp học phần để rà soát hoặc phục vụ báo cáo.

### 17.2. Dữ liệu xuất

- Mã sinh viên.
- Họ tên sinh viên.
- Điểm Quiz/Thường kỳ.
- Điểm Giữa kỳ.
- Điểm Cuối kỳ.
- Điểm trung bình.
- Điểm chữ nếu có.

### 17.3. Quy tắc

- Chỉ xuất điểm thuộc lớp giảng viên phụ trách.
- Chỉ dùng điểm đã đủ điều kiện hiển thị/công bố.
- Điểm trung bình tính theo quy định môn học hoặc cấu hình hệ thống.

## 18. Trạng thái chính trong hệ thống

| Đối tượng | Trạng thái | Ý nghĩa |
|---|---|---|
| Exam | DRAFT | Đề nháp, sinh viên chưa thấy, giảng viên được sửa |
| Exam | PUBLISHED | Đề đã công bố, sinh viên có thể thấy khi đúng điều kiện |
| Exam | CLOSED | Đề đã đóng, giữ lại để tra cứu |
| AI Question | PENDING_REVIEW | Câu AI sinh ra đang chờ duyệt |
| AI Question | APPROVED | Câu AI đã được giảng viên chấp nhận |
| AI Question | REJECTED | Câu AI bị từ chối |
| Submission | SUBMITTED | Sinh viên đã nộp bài |
| Submission | GRADING | Hệ thống đang chấm |
| Submission | GRADED | Đã có điểm |

## 19. Gợi ý dữ liệu Backend cần có

| Bảng/Entity | Dữ liệu quan trọng |
|---|---|
| CourseOffering | Môn học, học kỳ, giảng viên phụ trách, mã lớp |
| Enrollment | Sinh viên thuộc lớp học phần |
| Material | Tài liệu lớp học phần, loại file, đường dẫn, trạng thái chọn cho AI |
| Question | Nội dung, loại câu hỏi, độ khó, giảng viên sở hữu, môn học |
| QuestionOption | Phương án, đáp án đúng |
| TestCase | Input, expected output, weight, hidden/public |
| AIGeneration | Tài liệu dùng, prompt, model, thời gian sinh |
| AIDraftQuestion | Câu hỏi AI nháp, trạng thái duyệt |
| Exam | Cấu hình bài thi, trạng thái, thời gian, chế độ hiển thị điểm |
| ExamQuestion | Câu hỏi thuộc đề, điểm từng câu, thứ tự |
| ExamVariant | Phiên bản đề, seed xáo trộn, thứ tự câu/đáp án |
| Submission | Bài làm sinh viên, phiên bản đề được gán, thời gian nộp |
| Score | Điểm tự động, điểm ghi đè, điểm chốt |
| ViolationLog | Loại vi phạm, thời gian, mức độ, bằng chứng |
| AuditLog | Nhật ký thao tác quan trọng |

## 20. Phạm vi MVP và mở rộng

### 20.1. MVP nên có

- Quản lý lớp học phần phía giảng viên.
- Quản lý tài liệu.
- Ngân hàng câu hỏi trắc nghiệm/code.
- AI sinh câu hỏi trắc nghiệm có duyệt.
- Tạo đề thủ công.
- Sinh đề tự động cho trắc nghiệm.
- Lưu nháp và công bố đề.
- Phiên bản đề/xáo trộn.
- Thi online.
- Chấm tự động.
- Chấm lại thủ công.
- Công bố điểm.
- Giám sát vi phạm.
- Xuất bảng điểm.

### 20.2. Có thể mở rộng sau

- AI gợi ý bài lập trình nhưng giảng viên vẫn duyệt test case.
- Ngân hàng câu hỏi dùng chung giữa nhiều giảng viên.
- Quy trình Admin duyệt câu hỏi dùng chung.
- Thống kê theo chương, chủ đề, CLO.
- Phân tích độ khó câu hỏi dựa trên kết quả làm bài.
- Cảnh báo gian lận nâng cao bằng mô hình AI.
