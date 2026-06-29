# SOES - Hệ thống Thi Trực tuyến Thông minh

## 1. Tổng quan dự án

**SOES (Smart Online Examination System)** là một nền tảng thi trực tuyến có tích hợp Trí tuệ nhân tạo (AI), được thiết kế nhằm hỗ trợ các cơ sở giáo dục tổ chức các kỳ thi trực tuyến một cách an toàn, thông minh và hiệu quả.

Hệ thống cung cấp các chức năng quản lý học kỳ, lớp học phần, tài liệu học tập, đề thi, chấm điểm tự động và các cơ chế chống gian lận trong quá trình thi.

---

## 2. Mục tiêu dự án

Các mục tiêu chính của dự án bao gồm:

- Số hóa quy trình tổ chức thi trong môi trường giáo dục.
- Giảm khối lượng công việc của giảng viên trong việc tạo đề và chấm điểm.
- Tự động sinh câu hỏi bằng AI.
- Hỗ trợ cả bài thi trắc nghiệm và bài thi lập trình.
- Phát hiện và ghi nhận các hành vi đáng ngờ trong quá trình thi.
- Nâng cao tính công bằng và tính trung thực trong các kỳ thi trực tuyến.

---

## 3. Đối tượng sử dụng

### Quản trị viên (Administrator)

Chịu trách nhiệm quản lý toàn bộ hệ thống.

Các nhiệm vụ chính:

- Quản lý tài khoản người dùng.
- Quản lý học kỳ.
- Quản lý môn học.
- Giám sát hoạt động của hệ thống.
- Quản lý cấu hình hệ thống.

### Giảng viên (Teacher)

Chịu trách nhiệm tổ chức và quản lý các kỳ thi.

Các nhiệm vụ chính:

- Quản lý các lớp học phần.
- Tải lên tài liệu học tập.
- Tạo đề thi.
- Sinh câu hỏi bằng AI.
- Xem xét và công bố đề thi.
- Giám sát sinh viên trong quá trình thi.
- Xem nhật ký và bằng chứng gian lận.
- Chấm điểm bài thi.
- Xem xét và quản lý kết quả thi.

### Sinh viên (Student)

Chịu trách nhiệm tham gia các kỳ thi.

Các nhiệm vụ chính:

- Truy cập các lớp học phần được phân công.
- Tham gia kỳ thi.
- Nộp đáp án và mã nguồn.
- Xem kết quả thi và phản hồi.

---

## 4. Các chức năng chính

### Quản lý học phần

- Quản lý học kỳ.
- Quản lý môn học.
- Quản lý lớp học phần.
- Phân công giảng viên cho lớp học phần.
- Ghi danh sinh viên vào lớp học phần.
- Nhập danh sách sinh viên từ tệp Excel hoặc CSV.

### Quản lý tài liệu học tập

- Tải lên tài liệu PDF, DOCX và PPTX.
- Quản lý tài liệu theo từng lớp học phần.
- Lựa chọn tài liệu để AI sử dụng trong việc sinh câu hỏi.
- Mỗi tài liệu thuộc về một lớp học phần cụ thể.
- Giảng viên tự quản lý tài liệu của mình một cách độc lập.
- Ngăn chặn việc trùng tên tệp trong cùng một lớp học phần.

### Sinh câu hỏi bằng AI

Sinh câu hỏi từ các tài liệu học tập đã được lựa chọn.

**AI chỉ đóng vai trò hỗ trợ, giảng viên là người đưa ra quyết định cuối cùng.**

Các loại câu hỏi được hỗ trợ:

- Câu hỏi trắc nghiệm một đáp án.
- Câu hỏi trắc nghiệm nhiều đáp án.
- Câu hỏi lập trình.

Giảng viên có thể:

- Sinh câu hỏi tự động.
- Xem trước các câu hỏi do AI tạo.
- Chỉnh sửa câu hỏi.
- Lưu câu hỏi vào ngân hàng câu hỏi.

### Quản lý ngân hàng câu hỏi

- Tạo và quản lý ngân hàng câu hỏi.
- Tổ chức câu hỏi theo môn học và quyền sở hữu.
- Tìm kiếm và lọc câu hỏi.
- Tái sử dụng câu hỏi trong các kỳ thi sau.

### Quản lý đề thi

Giảng viên có thể tạo đề thi bằng nhiều phương thức:

- Tạo câu hỏi thủ công.
- Chọn câu hỏi từ ngân hàng câu hỏi.
- Sinh câu hỏi bằng AI.
- Kết hợp câu hỏi thủ công, câu hỏi từ ngân hàng và câu hỏi do AI tạo.

Các loại đề thi được hỗ trợ:

- Đề thi trắc nghiệm một đáp án.
- Đề thi trắc nghiệm nhiều đáp án.
- Đề thi lập trình.
- Đề thi hỗn hợp.

### Thi lập trình

Các ngôn ngữ lập trình được hỗ trợ:

- Java
- C
- C++

Các bài lập trình được xây dựng theo dạng chương trình Console và được chấm điểm tự động bằng các bộ Test Case đã được định nghĩa.

### Chấm điểm tự động

Hệ thống tự động chấm:

- Bài thi trắc nghiệm.
- Bài thi lập trình dựa trên các Test Case.

Giảng viên có thể:

- Xem kết quả chấm.
- Điều chỉnh điểm thủ công khi cần thiết.

### Chống gian lận và giám sát thi

Hệ thống cung cấp nhiều cơ chế chống gian lận.

**Giám sát trình duyệt:**

- Phát hiện chuyển tab.
- Phát hiện thoát chế độ toàn màn hình.
- Chặn sao chép và dán.
- Chặn nhấp chuột phải.
- Phát hiện người dùng không hoạt động.

**Giám sát webcam:**

- Phát hiện không có khuôn mặt.
- Phát hiện nhiều khuôn mặt.
- Tự động chụp ảnh webcam khi phát hiện hành vi đáng ngờ.
- Ghi nhận các sự kiện gian lận.

Mọi hành vi đáng ngờ đều được ghi lại để giảng viên xem xét.

### Giám sát thời gian thực

Giảng viên có thể:

- Theo dõi tiến trình làm bài theo thời gian thực.
- Nhận cảnh báo khi phát hiện gian lận.
- Xem bằng chứng và lịch sử các sự kiện vi phạm.

### Quản lý kết quả

- Lưu trữ kết quả thi.
- Lưu trữ thông tin chấm điểm chi tiết.
- Cung cấp báo cáo điểm số.
- Cho phép sinh viên xem kết quả sau khi được công bố.
- Cung cấp chức năng xem chi tiết bài làm cho giảng viên và quản trị viên.
- Xuất báo cáo điểm dưới định dạng Excel.

---

## 5. Vai trò người dùng

Hiện tại hệ thống hỗ trợ ba vai trò:

| Vai trò | Mô tả                     |
| ------- | ------------------------- |
| ADMIN   | Quản trị viên hệ thống    |
| TEACHER | Giảng viên và người ra đề |
| STUDENT | Người tham gia kỳ thi     |

---

## 6. Công nghệ sử dụng

### Frontend

- React
- Vite
- Tailwind CSS
- TypeScript
- Shadcn UI
- TanStack Query
- Zustand
- Socket.IO Client
- Axios

### Backend

- Node.js
- Express.js
- Socket.IO
- Prisma ORM
- Xác thực JWT

### Cơ sở dữ liệu

- PostgreSQL
- Prisma ORM
- Redis

### Trí tuệ nhân tạo (AI)

- Gemini API

### Chống gian lận

- WebRTC (getUserMedia API)
- Giám sát sự kiện trình duyệt
- MediaPipe Face Detection
- Socket.IO

### Lưu trữ

- MinIO

### Thực thi mã nguồn

- Judge0 CE

### Triển khai hệ thống

- Vercel (Frontend)
- Railway hoặc VPS (Backend)
- Máy chủ PostgreSQL

---

## 6A. Tổng quan kiến trúc

Hệ thống áp dụng các mô hình kiến trúc sau:

- **Backend:** Kiến trúc Modular Monolith.
- **Thiết kế nội bộ Backend:** Kiến trúc phân tầng (Layered Architecture).
- **Frontend:** Kiến trúc theo tính năng (Feature-Based Architecture).
- **Giao tiếp:** REST API và Socket.IO(WebSocket) .

---

## 7. Yêu cầu phi chức năng

### Bảo mật

- Xác thực bằng JWT.
- Phân quyền theo vai trò (RBAC).
- Mã hóa mật khẩu an toàn.
- Môi trường làm bài được bảo vệ.

### Độ tin cậy

- Hệ thống tự động lưu tiến độ làm bài theo định kỳ.
- Cho phép sinh viên tiếp tục làm bài sau khi bị gián đoạn kết nối mạng tạm thời.

### Hiệu năng

- Hỗ trợ nhiều phiên thi đồng thời.
- Xử lý sự kiện theo thời gian thực.
- Nộp bài và chấm điểm nhanh.

### Khả năng mở rộng

- Kiến trúc dạng module.
- Dễ dàng mở rộng thêm các chức năng trong tương lai.

### Tính sẵn sàng

- Hệ thống phải hoạt động ổn định trong suốt thời gian diễn ra kỳ thi.
- Tự động lưu và bảo toàn tiến độ làm bài của sinh viên.

---

## 8. Định hướng phát triển trong tương lai

Các cải tiến tiềm năng bao gồm:

- Hỗ trợ ứng dụng trên thiết bị di động.
- Phát hiện hướng nhìn bằng AI nâng cao.
- Phát hiện lời nói trong quá trình thi.
- Hỗ trợ thêm nhiều ngôn ngữ lập trình.
- Ghi hình video trong suốt quá trình thi.
- Dashboard phân tích và thống kê chi tiết.
