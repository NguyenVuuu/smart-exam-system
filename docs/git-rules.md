# QUY TẮC QUẢN LÝ SOURCE CODE BẰNG GIT

## 1. Cấu trúc nhánh

Repository bao gồm các nhánh sau:

### master

- Chứa source code ổn định nhất.
- Chỉ merge vào khi tính năng đã hoàn thành và kiểm thử thành công.
- Không commit trực tiếp lên nhánh master.

### develop

- Nhánh phát triển chính của dự án.
- Tất cả tính năng mới đều được merge vào develop trước khi merge sang master.

### feature/\*

- Mỗi tính năng phải được phát triển trên một nhánh riêng.

Ví dụ:

feature/login
feature/exam-management
feature/ai-question-generation
feature/proctoring
feature/grading

---

## 2. Quy trình làm việc

Bước 1: Luôn cập nhật code mới nhất

git checkout develop
git pull origin develop

Bước 2: Tạo nhánh mới từ develop

git checkout -b feature/ten-tinh-nang

Ví dụ:

git checkout -b feature/login

Bước 3: Thực hiện code.

Bước 4: Commit code.

Bước 5: Push nhánh lên GitHub.

git push origin feature/login

Bước 6: Tạo Pull Request vào develop.

Bước 7: Thành viên còn lại review trước khi merge.

---

## 3. Tuyệt đối không được

- Không commit trực tiếp lên master.
- Không push force (--force) nếu chưa trao đổi với thành viên còn lại.
- Không sửa code của người khác khi chưa trao đổi.
- Không commit file build hoặc thư viện.

---

## 4. Quy tắc commit message

Sử dụng định dạng:

<type>: <mô tả>

Các type:

feat: thêm chức năng mới
fix: sửa lỗi
refactor: cải tiến code
style: chỉnh sửa format/code style
docs: cập nhật tài liệu
test: thêm hoặc sửa test
chore: công việc phụ trợ

Ví dụ:

feat: implement JWT authentication
feat: add exam creation API
fix: resolve login validation bug
docs: update ERD diagram
refactor: optimize question service

---

## 5. Quy tắc commit

- Mỗi commit chỉ nên chứa một mục đích.
- Commit thường xuyên.
- Không để quá nhiều thay đổi mới commit.

Ví dụ tốt:

feat: create login API
feat: add refresh token support

Ví dụ không tốt:

update project

---

## 6. Quy tắc Pull Request

Tên Pull Request:

[Feature] Login module
[Feature] AI question generation
[Fix] Resolve grading issue

Mỗi Pull Request cần mô tả:

- Chức năng đã thực hiện.
- Danh sách file chính được chỉnh sửa.
- Hình ảnh demo (nếu có).

---

## 7. Phân chia công việc

Mỗi thành viên phụ trách module riêng.

Ví dụ:

Thành viên A:

- Authentication
- User Management
- Course Management

Thành viên B:

- Exam Module
- Proctoring
- AI Module

Nếu cần chỉnh sửa module của người khác phải thông báo trước.

---

## 8. Trước khi bắt đầu code mỗi ngày

Thực hiện:

git checkout develop
git pull origin develop

Sau đó mới checkout sang nhánh đang làm.

---

## 9. Trước khi tạo Pull Request

Đảm bảo:

- Project chạy thành công.
- Không có lỗi compile.
- Không còn code debug.
- Đã kiểm tra chức năng vừa phát triển.

---

## 10. Quy trình release

feature/\* → develop → master

Chỉ merge develop vào master khi:

- Hoàn thành một milestone.
- Đã kiểm thử toàn bộ hệ thống.
