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

- Hệ thống hỗ trợ ba loại tài khoản:
- ADMIN
- TEACHER
- STUDENT
- Một người dùng có thể sở hữu một hoặc nhiều loại tài khoản.
Ví dụ một người đồng thời là STUDENT và TEACHER:
- STUDENT:
  - student_code: SV001
  - password: ****
- TEACHER:
  - teacher_code: GV001
  - password: ****
- Khi đăng nhập bằng student_code, hệ thống đăng nhập vào tài khoản STUDENT và chỉ cung cấp giao diện, chức năng của STUDENT.
- Khi đăng nhập bằng teacher_code, hệ thống đăng nhập vào tài khoản TEACHER và chỉ cung cấp giao diện, chức năng của TEACHER.
-  Hai tài khoản có thể liên kết với cùng một người dùng (User) để dùng chung thông tin cá nhân

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

- Mọi tài khoản phải đăng nhập trước khi truy cập hệ thống.
- Người dùng đăng nhập bằng mã tài khoản tương ứng với loại tài khoản.
- STUDENT đăng nhập bằng student_code.
- TEACHER đăng nhập bằng teacher_code.
- ADMIN đăng nhập bằng admin_code.
- Email không được sử dụng làm thông tin đăng nhập, Email là thông tin liên hệ.
- Mỗi mã tài khoản phải là duy nhất trong phạm vi loại tài khoản tương ứng.
- Mật khẩu của từng tài khoản phải được mã hóa an toàn trước khi lưu vào cơ sở dữ liệu.
- Nếu user vừa là teacher vừa student thì có thể đăng nhập tài khoản teacher, student ở 2 nơi khác nhau cùng lúc. Nhưng không thể đăng nhập đồng thời cùng 1 tài khoản student/teacher trên nhiều thiết bị
- Một tài khoản không được đăng nhập đồng thời trên nhiều thiết bị.
- Nếu một người có cả tài khoản STUDENT và TEACHER, hai tài khoản này có thông tin đăng nhập độc lập.
- Đăng nhập bằng student_code chỉ tạo phiên đăng nhập với quyền STUDENT.
- Đăng nhập bằng teacher_code chỉ tạo phiên đăng nhập với quyền TEACHER.
- Hệ thống không cho phép tài khoản STUDENT truy cập các chức năng dành cho TEACHER và ngược lại.

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

Sinh viên được thêm vào lớp học phần bởi ADMIN.

Trong phạm vi hệ thống thi trực tuyến, giảng viên chỉ xem danh sách sinh viên đã được ghi danh để giao bài thi, theo dõi làm bài và xem kết quả. Giảng viên không tự thêm, xóa hoặc nhập danh sách sinh viên vào lớp học phần, nhằm tránh sai lệch dữ liệu đào tạo chính thức.

Quy tắc:

- Một sinh viên có thể thuộc nhiều lớp học phần.
- Sinh viên có thể học lại cùng một môn ở các học kỳ khác nhau.
- Dữ liệu ghi danh của các học kỳ trước phải được lưu giữ.

---

## BR-07: Nhập danh sách sinh viên

Sinh viên có thể được thêm vào lớp học phần bằng nhiều cách.

Các phương thức hỗ trợ:

### Thêm thủ công

Quản trị viên tìm kiếm sinh viên theo mã số sinh viên và thêm trực tiếp vào lớp học phần.

### Nhập từ tệp Excel

Quản trị viên tải lên tệp Excel chứa danh sách sinh viên.

### Nhập từ tệp CSV

Quản trị viên tải lên tệp CSV chứa danh sách sinh viên.

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

Giảng viên có thể lựa chọn nhiều tài liệu thuộc lớp học phần để sử dụng khi sinh câu hỏi.
Việc lựa chọn tài liệu được lưu theo từng lần sinh câu hỏi.
Ví dụ:
Lần sinh câu hỏi 1:
- Chapter1.pdf
- Chapter3.pdf
Lần sinh câu hỏi 2:
- Chapter5.pdf
Một tài liệu có thể được sử dụng trong nhiều lần sinh câu hỏi khác nhau.

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

AI là dịch vụ hỗ trợ được tích hợp thông qua API của bên thứ ba. AI không tự quyết định nội dung cuối cùng được sử dụng trong hệ thống.

Quy trình:
1. Giáo viên lựa chọn tài liệu học tập được phép sử dụng.
2. Hệ thống gửi nội dung tài liệu được phép sử dụng đến API của dịch vụ AI bên thứ ba.
3. Các câu hỏi do AI sinh ra được lưu dưới dạng câu hỏi nháp và chưa thuộc ngân hàng câu hỏi.
4. AI phân tích nội dung tài liệu và sinh các câu hỏi trắc nghiệm.
5. Giảng viên xem xét và đánh giá từng câu hỏi.
6. Giảng viên có thể:
  - Chỉnh sửa câu hỏi.
  - Chỉnh sửa các phương án trả lời.
  - Thay đổi đáp án đúng.
  - Xóa câu hỏi.
  - Chấp nhận và lưu câu hỏi vào ngân hàng câu hỏi.
  - Thêm trực tiếp câu hỏi vào đề thi.

Phạm vi AI
- AI chỉ được sử dụng các tài liệu do giảng viên lựa chọn trong lần sinh câu hỏi tương ứng.
- Một tài liệu có thể được sử dụng trong nhiều lần sinh câu hỏi khác nhau.
- AI không tự động:
    Công bố câu hỏi.
    Công bố đề thi.
    Đưa câu hỏi vào ngân hàng câu hỏi.
    Đưa câu hỏi vào đề thi mà không có quyết định của giảng viên.

Loại câu hỏi AI:
- Trong phạm vi hiện tại, AI chỉ sinh:
    Câu hỏi trắc nghiệm một đáp án.
    Câu hỏi trắc nghiệm nhiều đáp án.
    AI không sinh câu hỏi lập trình trong quy trình này.
- Trạng thái câu hỏi AI
    PENDING_REVIEW: Câu hỏi đang chờ giảng viên xem xét.
    APPROVED: Câu hỏi đã được giảng viên chấp nhận.
    REJECTED: Câu hỏi bị giảng viên từ chối.
APPROVED chỉ thể hiện câu hỏi đã được giảng viên chấp nhận. Câu hỏi chỉ trở thành câu hỏi thuộc ngân hàng câu hỏi khi giảng viên thực hiện thao tác lưu vào ngân hàng.

## BR-12B: Lịch sử sinh câu hỏi bằng AI

Mỗi lần sinh câu hỏi bằng AI phải được lưu lại.
Thông tin lưu trữ:
- Giáo viên thực hiện.
- Lớp học phần.
- Danh sách tài liệu sử dụng.
- Thời gian sinh.
- Prompt gửi AI.
- Model AI sử dụng.
- Số lượng câu hỏi được sinh.
- Trạng thái xử lý.
Một lần sinh AI có thể tạo nhiều câu hỏi.
Câu hỏi sinh ra phải liên kết với lần sinh AI tương ứng.
-----

# 7. Quản lý kỳ thi

## BR-13: Loại đề thi

Hệ thống hỗ trợ:
- Đề thi trắc nghiệm một đáp án
- Đề thi trắc nghiệm nhiều đáp án
- Đề thi lập trình
- Đề thi hỗn hợp

Mỗi đề thi phải lưu loại đề thi để phục vụ:
- Hiển thị giao diện làm bài.
- Kiểm tra loại câu hỏi hợp lệ.
- Thống kê kết quả.
- Lọc và quản lý đề thi.

Đề thi hỗn hợp có thể bao gồm tất cả các loại câu hỏi.

---

## BR-14: Phương thức tạo đề thi

Giảng viên có thể tạo đề thi trong phạm vi lớp học phần mình phụ trách bằng một hoặc nhiều phương thức.

Giảng viên có thể lưu đề nháp (DRAFT), công bố đề thi (PUBLISHED), đóng đề thi (CLOSED).

Trong phạm vi MVP, đề thi không cần quản trị viên phê duyệt trước khi công bố. Trách nhiệm kiểm tra nội dung, cấu hình thời gian, cấu hình chống gian lận và danh sách câu hỏi thuộc về giảng viên phụ trách lớp học phần.

### Phương thức 1

Tạo câu hỏi thủ công.

### Phương thức 2

Chọn câu hỏi từ ngân hàng câu hỏi.

Với câu hỏi lập trình, giảng viên nên chọn thủ công các câu đã có đầy đủ test case, expected output, giới hạn thời gian/bộ nhớ và trọng số chấm điểm.

### Phương thức 3

Sinh câu hỏi bằng AI.

### Phương thức 4

- Kết hợp câu hỏi thủ công, câu hỏi từ ngân hàng và câu hỏi do AI sinh.
- Giảng viên phải được phép xem trước và chỉnh sửa câu hỏi trước khi công bố đề thi.

Mỗi đề thi phải lưu lại phương thức tạo đề:
- MANUAL:
  Giáo viên tự tạo câu hỏi.
- QUESTION_BANK:
  Giáo viên chọn câu hỏi từ ngân hàng.
- AI_GENERATED:
  Đề thi được tạo từ câu hỏi AI đã được giảng viên xem xét/chấp nhận.
- MIXED:
  Kết hợp nhiều nguồn câu hỏi.

Sinh đề tự động:
- Trong phạm vi MVP, chức năng sinh đề tự động chỉ bốc câu hỏi trắc nghiệm từ ngân hàng câu hỏi theo môn học và độ khó.
- Hệ thống phải kiểm tra đủ số lượng câu hỏi theo từng độ khó trước khi sinh đề.
- Câu hỏi lập trình không được tự động bốc theo số lượng vì cần giảng viên kiểm tra test case và cấu hình chấm.
- Nếu đề có câu lập trình, giảng viên tạo/chọn câu lập trình thủ công rồi hệ thống chỉ dùng phần xáo trộn/phiên bản sau khi nội dung đã được kiểm tra.

---

## BR-15: Công bố đề thi

Quy tắc:

- Mỗi đề thi chỉ thuộc một lớp học phần.
- Chỉ các đề thi đã được công bố mới hiển thị cho sinh viên.
- Đề thi ở trạng thái DRAFT chỉ hiển thị cho giảng viên để xem trước, chỉnh sửa hoặc xóa.
- Khi công bố, hệ thống khóa cấu hình chính của đề thi để đảm bảo tính nhất quán cho sinh viên.
- Giảng viên cấu hình:
  - Thời gian bắt đầu
  - Thời gian kết thúc
  - Thời lượng làm bài
  - Số lần được phép làm bài
  - Tạo mật khẩu để vào làm bài (không bắt buộc)

---

## BR-16: Xáo trộn câu hỏi

Quy tắc:

- Với thi trực tuyến, không bắt buộc sinh viên phải nhập mã đề. Hệ thống tự gán phiên bản đề hoặc thứ tự xáo trộn khi sinh viên bắt đầu làm bài.
- Một đề thi có thể có một hoặc nhiều phiên bản đề để phục vụ xem trước, in ấn hoặc gán tự động.
- Các phiên bản đề trong phạm vi MVP dùng cùng một bộ câu hỏi, khác thứ tự câu hỏi và/hoặc thứ tự đáp án.
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

Giảng viên cấu hình cách hiển thị điểm cho sinh viên ở cấp bài thi.

Quy tắc:

- Hệ thống hỗ trợ 3 chế độ hiển thị điểm:
  - `IMMEDIATE`: Sinh viên thấy điểm ngay sau khi nộp bài và hệ thống chấm xong.
  - `MANUAL`: Sinh viên chưa thấy điểm cho đến khi giảng viên công bố.
  - `SCHEDULED`: Sinh viên thấy điểm sau thời điểm công bố đã cấu hình.
- Với bài có câu lập trình, tự luận hoặc cần rà soát vi phạm, nên dùng `MANUAL` hoặc `SCHEDULED`.
- Việc công bố điểm áp dụng cho toàn bộ sinh viên tham gia bài thi.
- Không có trường hợp một sinh viên thấy điểm và sinh viên khác không thấy điểm trong cùng một bài thi.
- Publish điểm áp dụng toàn bộ sinh viên trong Course Offering.
- Student không thấy điểm khi chưa thỏa điều kiện hiển thị điểm của bài thi.

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

# 14. Quy tắc hiển thị điểm số
- Giáo viên có thể xem tất cả điểm số.
- Học sinh chỉ có thể xem điểm khi bài thi thỏa chế độ hiển thị điểm đã cấu hình.
- Việc công bố điểm áp dụng cho toàn bộ bài thi/lớp học.
- Các số liệu thống kê trên bảng điều khiển chỉ tính toán dựa trên những điểm số đã đủ điều kiện hiển thị.

# 15. Các quy tắc quản lý điểm số
- Điểm chỉ hiển thị khi:
    `resultReleaseMode = IMMEDIATE` và bài đã được chấm xong; hoặc
    `resultReleaseMode = MANUAL` và giảng viên đã công bố; hoặc
    `resultReleaseMode = SCHEDULED` và đã đến thời điểm công bố.
- Việc công bố điểm áp dụng cho toàn bộ sinh viên tham gia bài thi.
- Không có trường hợp một sinh viên thấy điểm và sinh viên khác không thấy điểm trong cùng một bài thi.
- Publish điểm áp dụng toàn bộ sinh viên trong Course Offering.
- Student không thấy điểm khi chưa thỏa điều kiện hiển thị điểm.
- Quiz:
    Có nhiều bài kiểm tra.
    Chỉ tính trung bình các Quiz đã đủ điều kiện hiển thị điểm.
- Midterm:
    Chỉ có một điểm.
    Không tính trung bình.
- Final:
    Chỉ có một điểm.
    Không tính trung bình.
- Dashboard:
    Không hiển thị môn chưa có điểm đủ điều kiện hiển thị.
    Không hiển thị giá trị null/0 thay thế.
    Chỉ render dữ liệu có published score.

---

# 16. Quy tắc giám sát webcam và màn hình

## BR-35: Cấu hình giám sát theo ca thi

- `enableWebcam = true` nghĩa là ca thi bắt buộc sử dụng đầy đủ nghiệp vụ giám sát webcam.
- Khi ca thi yêu cầu webcam, sinh viên phải cấp quyền camera trước khi bắt đầu làm bài.
- Nếu sinh viên không cấp quyền webcam, hệ thống không cho phép vào thi.
- Khi đã bật webcam, hệ thống tự động giám sát các dấu hiệu bất thường như không thấy mặt, nhiều khuôn mặt, camera bị che, camera mất kết nối.
- Khi đã bật webcam, giảng viên được phép xem live webcam của từng sinh viên theo nhu cầu.
- Khi đã bật webcam, hệ thống và giảng viên đều có thể tạo bằng chứng ảnh webcam cho các sự kiện nghi vấn.
- `enableScreenMonitoring = true` nghĩa là ca thi bắt buộc sinh viên chia sẻ màn hình để phục vụ giám sát.
- Nếu sinh viên không cấp quyền chia sẻ màn hình trong ca thi yêu cầu giám sát màn hình, hệ thống không cho phép vào thi.
- Giám sát màn hình dùng để giảng viên xem sinh viên đang thao tác gì trong lúc thi, bao gồm màn hình hiện tại, nội dung đang nhập và hành vi chuyển sang môi trường khác.

## BR-36: Ghi nhận vi phạm và bằng chứng

- Hệ thống chỉ ghi nhận sự kiện nghi vấn/vi phạm và lưu bằng chứng, không tự kết luận gian lận cuối cùng.
- Mỗi lần sinh viên tắt webcam, mất quyền webcam hoặc dừng chia sẻ màn hình trong lúc thi phải được ghi nhận thành một sự kiện vi phạm.
- Với các sự kiện có thời lượng, hệ thống phải lưu thời điểm bắt đầu, thời điểm kết thúc và số giây kéo dài.
- Mỗi lần tắt webcam phải hiển thị cảnh báo nhẹ cho sinh viên và đồng thời ghi nhận vi phạm ngay.
- Các vi phạm như chuyển tab, thoát fullscreen, dừng chia sẻ màn hình hoặc giảng viên chụp thủ công có thể sinh bằng chứng ảnh màn hình.
- Các vi phạm webcam như không thấy mặt, nhiều khuôn mặt, camera bị che hoặc giảng viên chụp thủ công có thể sinh bằng chứng ảnh webcam.
- Bằng chứng gian lận phải được lưu trong MinIO; Supabase chỉ dùng cho tài liệu học tập/materials và không dùng cho bằng chứng gian lận.

## BR-37: Giám sát realtime của giảng viên

- Giảng viên có thể xem dashboard realtime của ca thi để theo dõi trạng thái online, webcam, chia sẻ màn hình và số lượng vi phạm của từng sinh viên.
- Giảng viên có thể chọn một sinh viên để xem live webcam hoặc live màn hình.
- Trong cùng một thời điểm, giảng viên không xem đồng thời webcam và màn hình của cùng một sinh viên; giảng viên chọn một loại stream đang cần giám sát.
- Giảng viên có thể chuyển từ sinh viên này sang sinh viên khác trong cùng ca thi.
- Khi đang xem live webcam hoặc live màn hình, giảng viên có thể chụp bằng chứng thủ công.
- Các sự kiện vi phạm và bằng chứng mới phải được gửi realtime cho dashboard giảng viên.

## BR-38: Xử lý bài thi khi có vi phạm

- Hệ thống không tự động cưỡng chế nộp bài vì lý do gian lận.
- Quyền dừng bài thi của một sinh viên thuộc về giảng viên được phân công giám sát hoặc người có quyền quản trị phù hợp.
- Khi giảng viên dừng bài thi vì vi phạm, bài làm chuyển sang trạng thái `INVALIDATED`, thời điểm dừng và người dừng phải được ghi nhận.
- Bài thi bị dừng do giảng viên xử lý vi phạm được ghi nhận điểm 0 theo nghiệp vụ của ca thi.
- Lý do dừng bài phải được lưu để phục vụ đối soát và khiếu nại.

## BR-39: Lưu trữ bằng chứng trong MinIO

- Khi tạo ca thi, hệ thống tự sinh `proctoringStoragePath` để làm prefix lưu trữ bằng chứng gian lận.
- Prefix lưu trữ phải đủ thông tin để tránh nhầm lẫn giữa học kỳ, môn học, ca thi và định danh ca thi.
- Cấu trúc lưu trữ khuyến nghị:

```text
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/webcam/{attemptId}/{violationId}.jpg
proctoring/{semester}/{subject}/{schedule-slug}/{examScheduleId}/screen/{attemptId}/{violationId}.jpg
```

- Database chỉ lưu metadata và object key/path của bằng chứng; không lưu binary ảnh trực tiếp trong PostgreSQL.
