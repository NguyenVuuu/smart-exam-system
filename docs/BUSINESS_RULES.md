# BUSINESS RULES

# 1. Tổng quan

SOES (Smart Online Examination System) là hệ thống thi trực tuyến có tích hợp AI, được thiết kế nhằm hỗ trợ các cơ sở giáo dục trong việc tổ chức, quản lý, giám sát và chấm điểm các kỳ thi trực tuyến.

Hệ thống tập trung vào các chức năng:

- Quản lý học vụ.
- Quản lý tài liệu học tập.
- Tạo đề thi bằng AI.
- Tổ chức thi trực tuyến.
- Chấm điểm tự động.
- Giám sát chống gian lận.
- Quản lý điểm số.

Hệ thống hỗ trợ ba vai trò:

- ADMIN
- TEACHER
- STUDENT

---

# 2. Quản lý người dùng

## BR-01: Vai trò người dùng

Hệ thống hỗ trợ ba vai trò người dùng.

### ADMIN

Chịu trách nhiệm quản lý toàn bộ hệ thống.

Các nhiệm vụ chính:

- Quản lý người dùng.
- Quản lý học kỳ.
- Quản lý môn học.
- Giám sát hoạt động hệ thống.
- Quản lý cấu hình hệ thống.

### TEACHER

Chịu trách nhiệm giảng dạy và quản lý kỳ thi.

Các nhiệm vụ chính:

- Quản lý các lớp học phần được phân công.
- Tải lên tài liệu học tập.
- Tạo và công bố đề thi.
- Giám sát các kỳ thi.
- Xem xét các vi phạm.
- Chấm điểm bài thi.

### STUDENT

Chịu trách nhiệm tham gia các kỳ thi.

Các nhiệm vụ chính:

- Truy cập các lớp học phần được phân công.
- Tham gia kỳ thi.
- Nộp bài làm và mã nguồn.
- Xem kết quả thi.

---

## BR-02: Xác thực

- Mọi người dùng đều phải đăng nhập trước khi truy cập hệ thống.
- Email phải là duy nhất trong toàn hệ thống.
- Mật khẩu phải được mã hóa an toàn trước khi lưu vào cơ sở dữ liệu.
- Một người dùng không được đăng nhập đồng thời trên nhiều thiết bị.

---

# 3. Quản lý học vụ

## BR-03: Quản lý học kỳ

Chỉ ADMIN mới được phép quản lý học kỳ.

Mỗi học kỳ bao gồm:

- Tên học kỳ
- Ngày bắt đầu
- Ngày kết thúc
- Trạng thái

Ví dụ:

- Học kỳ 1 năm 2026
- Học kỳ 2 năm 2026

---

## BR-04: Quản lý môn học

Chỉ ADMIN mới được phép quản lý môn học.

Mỗi môn học bao gồm:

- Mã môn học
- Tên môn học
- Mô tả
- Trạng thái

Ví dụ:

- Lập trình Java
- Lập trình C++
- Cấu trúc dữ liệu

Một môn học có thể được mở ở nhiều học kỳ khác nhau.

---

## BR-05: Quản lý lớp học phần

Một lớp học phần đại diện cho:

**"Một giảng viên giảng dạy một môn học trong một học kỳ."**

Ví dụ:

| Học kỳ   | Môn học | Giảng viên   | Mã lớp | Trạng thái |
| -------- | ------- | ------------ | ------ | ---------- |
| Học kỳ 1 | Java    | Giảng viên A | Java01 | CLOSED     |
| Học kỳ 1 | Java    | Giảng viên B | Java02 | CLOSED     |
| Học kỳ 2 | Java    | Giảng viên A | Java03 | ACTIVE     |

Quy tắc:

- Một lớp học phần chỉ thuộc một học kỳ.
- Một lớp học phần chỉ thuộc một môn học.
- Một lớp học phần chỉ có một giảng viên phụ trách.
- Một giảng viên có thể giảng dạy nhiều lớp học phần.
- Mỗi lớp học phần phải có mã lớp duy nhất.

---

# 4. Quản lý sinh viên trong lớp học phần

## BR-06: Ghi danh sinh viên

Sinh viên **không tự đăng ký** lớp học phần.

Sinh viên được thêm vào lớp học phần bởi ADMIN hoặc TEACHER.

Quy tắc:

- Một sinh viên có thể thuộc nhiều lớp học phần.
- Sinh viên có thể học lại cùng một môn ở các học kỳ khác nhau.
- Dữ liệu ghi danh của các học kỳ trước phải được lưu giữ.

---

## BR-07: Nhập danh sách sinh viên

Sinh viên có thể được thêm vào lớp học phần bằng nhiều cách.

Các phương thức hỗ trợ:

### Thêm thủ công

Giảng viên hoặc quản trị viên tìm kiếm sinh viên theo mã số sinh viên và thêm trực tiếp vào lớp học phần.

### Nhập từ tệp Excel

Giảng viên hoặc quản trị viên tải lên tệp Excel chứa danh sách sinh viên.

### Nhập từ tệp CSV

Giảng viên hoặc quản trị viên tải lên tệp CSV chứa danh sách sinh viên.

Hệ thống phải kiểm tra tính hợp lệ của dữ liệu nhập và thông báo các bản ghi không hợp lệ.

---

# 5. Quản lý tài liệu học tập

## BR-08: Tải lên tài liệu

Giảng viên có thể tải lên tài liệu học tập cho các lớp học phần của mình.

Hệ thống phải có giới hạn kích thước tệp tối đa cho mỗi lần tải lên

Định dạng hỗ trợ:

- PDF
- DOCX
- PPTX

Quy tắc:

- Tài liệu thuộc về một lớp học phần.
- Một lớp học phần có thể có nhiều tài liệu.
- Mỗi giảng viên tự quản lý tài liệu của mình.
- Tài liệu không được tự động chia sẻ giữa các giảng viên.

---

## BR-09: Trùng tên tệp

Trong cùng một lớp học phần:

- Không được phép có hai tệp cùng tên.
- Không được ghi đè lên tệp đã tồn tại.
- Giảng viên phải đổi tên tệp trước khi tải lên nếu bị trùng.

Ví dụ:

Được phép:

- Chapter1.pdf
- Chapter2.pdf

Không được phép:

- Chapter1.pdf
- Chapter1.pdf

---

## BR-10: Lựa chọn tài liệu cho AI

Giảng viên chủ động lựa chọn những tài liệu sẽ được AI sử dụng để sinh câu hỏi.

Quy tắc:

- AI chỉ được sử dụng những tài liệu đã chọn.
- Những tài liệu chưa được chọn không được AI xử lý.

---

# 6. Quản lý ngân hàng câu hỏi

## BR-11: Các loại câu hỏi được hỗ trợ

Hệ thống hỗ trợ các loại câu hỏi sau.

### Câu hỏi trắc nghiệm một đáp án

Chỉ có một đáp án đúng.

### Câu hỏi trắc nghiệm nhiều đáp án

Có nhiều đáp án đúng.

### Câu hỏi lập trình

Sinh viên nộp mã nguồn.

Ngôn ngữ hỗ trợ:

- Java
- C
- C++

Các bài lập trình chỉ hỗ trợ chương trình chạy trên Console.

---

## BR-12: Quyền sở hữu câu hỏi

Các câu hỏi thuộc quyền sở hữu của giảng viên.

Quy tắc:

- Giảng viên có thể tạo câu hỏi của riêng mình.
- Giảng viên có thể tái sử dụng câu hỏi của mình.
- Giảng viên không được chỉnh sửa câu hỏi do người khác tạo.
- Câu hỏi có thể thuộc hoặc không thuộc một lớp học phần.

---

## BR-12A: AI Sinh câu hỏi

Câu hỏi được sinh bởi AI thì không tự động công bố

Giáo viên phải đánh giá lại câu hỏi được tạo ra trước khi sử dụng

Giáo viên có thể:

- Sửa câu hỏi được tạo ra
- Xóa câu hỏi được tạo ra
- Lưu câu hỏi được tạo ra vào trong ngân hàng câu hỏi
- Thêm trực tiếp câu hỏi được tạo ra vào bài thi

---

# 7. Quản lý kỳ thi

## BR-13: Loại đề thi

Hệ thống hỗ trợ:

- Đề thi trắc nghiệm một đáp án
- Đề thi trắc nghiệm nhiều đáp án
- Đề thi lập trình
- Đề thi hỗn hợp

Đề thi hỗn hợp có thể bao gồm tất cả các loại câu hỏi.

---

## BR-14: Phương thức tạo đề thi

Giảng viên có thể tạo đề thi bằng một hoặc nhiều phương thức.

Giảng viên có thể lưu đề nháp(DRAFT), công bố đề thi(PUBLISHED), đóng đề thi(CLOSED)

### Phương thức 1

Tạo câu hỏi thủ công.

### Phương thức 2

Chọn câu hỏi từ ngân hàng câu hỏi.

### Phương thức 3

Sinh câu hỏi bằng AI.

### Phương thức 4

Kết hợp câu hỏi thủ công, câu hỏi từ ngân hàng và câu hỏi do AI sinh.

Giảng viên phải được phép xem trước và chỉnh sửa câu hỏi trước khi công bố đề thi.

---

## BR-15: Công bố đề thi

Quy tắc:

- Mỗi đề thi chỉ thuộc một lớp học phần.
- Chỉ các đề thi đã được công bố mới hiển thị cho sinh viên.
- Giảng viên cấu hình:
  - Thời gian bắt đầu
  - Thời gian kết thúc
  - Thời lượng làm bài
  - Số lần được phép làm bài
  - Tạo mật khẩu để vào làm bài (không bắt buộc)

---

## BR-16: Xáo trộn câu hỏi

Quy tắc:

- Thứ tự câu hỏi phải được xáo trộn cho từng sinh viên.
- Thứ tự đáp án phải được xáo trộn.
- Mỗi sinh viên có thể nhận được thứ tự câu hỏi khác nhau.
- Không yêu cầu mỗi đề thi phải hoàn toàn khác nhau.

---

# 8. Tham gia kỳ thi

## BR-17: Điều kiện dự thi

Sinh viên chỉ được tham gia kỳ thi khi:

- Thuộc lớp học phần.
- Đề thi đang trong thời gian diễn ra.
- Còn số lần làm bài.
- Có mật khẩu (tùy giáo viên có đặt mật khẩu hay không)

---

## BR-18: Phiên làm bài

Quy tắc:

- Một sinh viên chỉ được có một phiên làm bài đang hoạt động cho mỗi kỳ thi.
- Phiên làm bài tự động kết thúc khi hết thời gian.
- Tiến độ làm bài phải được tự động lưu định kỳ.
- Nếu trình duyệt bị tải lại hoặc mất kết nối tạm thời, sinh viên có thể tiếp tục bài thi đang làm nếu thời gian thi vẫn còn hiệu lực.

---

## BR-19: Nộp bài

Bài thi được xem là hoàn thành khi:

- Sinh viên chủ động nộp bài.
- Hết thời gian làm bài.

Sau khi nộp bài, sinh viên không được phép chỉnh sửa đáp án.

---

## BR-19A: Xem lại bài thi

Trong thời gian làm bài và khi chưa nộp bài, sinh viên được phép xem lại toàn bộ bài làm của mình để chỉnh sửa đáp án nếu thời gian làm bài vẫn còn hiệu lực.

Sau khi bài thi đã được nộp hoặc hết thời gian làm bài:

- Sinh viên không được phép xem lại nội dung bài thi và đáp án.
- Chỉ giảng viên và quản trị viên mới được phép xem chi tiết bài làm của sinh viên.

---

# 9. Thi lập trình

## BR-20: Nộp mã nguồn

Sinh viên nộp mã nguồn trực tiếp trên trình duyệt.

Ngôn ngữ hỗ trợ:

- Java
- C
- C++

---

## BR-21: Bộ kiểm thử (Test Case)

Mỗi câu hỏi lập trình có một hoặc nhiều Test Case.

Mỗi Test Case bao gồm:

- Dữ liệu đầu vào (Input)
- Kết quả mong đợi (Expected Output)
- Trọng số điểm

---

## BR-22: Chấm điểm tự động

Các bài lập trình được chấm tự động dựa trên các Test Case đã định nghĩa.

Quy tắc:

- Điểm được tính tự động.
- Giảng viên có thể xem kết quả chấm.
- Giảng viên có thể điều chỉnh điểm thủ công khi cần thiết.

---

# 10. Quy tắc chống gian lận

## BR-23: Hạn chế trên trình duyệt

Trong quá trình thi:

- Không được sao chép.
- Không được dán.
- Không được nhấp chuột phải.
- Bắt buộc chế độ toàn màn hình.

---

## BR-24: Giám sát sự kiện trình duyệt

Hệ thống theo dõi và ghi nhận:

- Chuyển sang tab khác.
- Thoát chế độ toàn màn hình.
- Không hoạt động trên trình duyệt.
- Mất tiêu điểm cửa sổ trình duyệt.
- Hệ thống ghi nhận thời gian vi phạm.(ví dụ: sv chuyển tab lúc 09:15:32)

Các vi phạm không làm kết thúc bài thi ngay lập tức.

Tất cả sự kiện đều phải được ghi nhận để giảng viên xem xét.

---

## BR-25: Giám sát bằng webcam

Sinh viên bắt buộc phải bật webcam trong quá trình thi.

Hệ thống theo dõi:

- Không phát hiện khuôn mặt.
- Phát hiện nhiều khuôn mặt.

---

## BR-26: Lưu bằng chứng từ webcam

Khi phát hiện hành vi đáng ngờ:

- Hệ thống tự động chụp ảnh từ webcam.
- Ảnh được lưu làm bằng chứng.
- Giảng viên có thể xem lại sau khi kỳ thi kết thúc.

---

## BR-27: Ghi nhận vi phạm

Mỗi vi phạm phải bao gồm:

- Sinh viên
- Kỳ thi
- Loại vi phạm
- Thời gian
- Mức độ nghiêm trọng
- Bằng chứng (nếu có)

---

# 11. Quản lý chấm điểm và kết quả

## BR-28: Chấm điểm trắc nghiệm

Các câu hỏi trắc nghiệm một đáp án và nhiều đáp án được chấm tự động.

---

## BR-29: Chấm điểm lập trình

Các câu hỏi lập trình được chấm tự động thông qua các Test Case.

---

## BR-30: Chấm lại thủ công

Giảng viên có thể ghi đè điểm do hệ thống chấm tự động.

---

## BR-31: Công bố kết quả

Sinh viên chỉ được xem kết quả sau khi giảng viên công bố.

---

## BR-32: Quản lý điểm

Giảng viên có thể:

- Xem điểm của sinh viên.
- Xem chi tiết bài làm.
- Điều chỉnh điểm khi cần thiết.
- Giảng viên có thể xuất bảng điểm dưới dạng Excel.

---

# 12. Quản lý thông báo

## BR-33: Thông báo

Sinh viên nhận được thông báo về:

- Kỳ thi sắp diễn ra.
- Kết quả thi đã được công bố.
- Các thông báo quan trọng liên quan đến kỳ thi.

Giảng viên nhận được thông báo về:

- Sinh viên đã nộp bài.
- Các hoạt động đáng ngờ trong quá trình thi.

---

# 13. Nhật ký và kiểm toán

## BR-34: Nhật ký hệ thống

Hệ thống ghi lại các hoạt động quan trọng bao gồm:

- Đăng nhập và đăng xuất.
- Tải lên tài liệu.
- Tạo đề thi.
- Công bố đề thi.
- Điều chỉnh điểm.
- Ghi danh sinh viên.
- Các sự kiện vi phạm.

Nhật ký hệ thống phải được lưu trữ để phục vụ công tác quản trị và kiểm tra.
