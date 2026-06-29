# GIT_WORKFLOW.md

# Quy định quản lý Source Code bằng Git

## 1. Mục đích

Tài liệu này quy định cách làm việc với Git nhằm:

- Quản lý source code thống nhất.
- Hạn chế xung đột (Merge Conflict).
- Đảm bảo lịch sử commit rõ ràng.
- Giúp các thành viên phối hợp hiệu quả.

---

# 2. Cấu trúc nhánh

Repository sử dụng các nhánh sau:

## master

- Chứa source code ổn định nhất.
- Chỉ merge từ `develop` khi hoàn thành một milestone hoặc chuẩn bị release.
- Không commit trực tiếp lên `master`.

---

## develop

- Là nhánh phát triển chính.
- Tất cả tính năng sau khi hoàn thành sẽ được merge vào `develop`.
- Không code trực tiếp trên `develop`.

---

## feature/\*

Mỗi tính năng phải được phát triển trên một nhánh riêng.

Ví dụ:

```
feature/login

feature/user-management

feature/course-management

feature/dashboard

feature/ai-module
```

---

# 3. Quy trình làm việc

## Bước 1

Luôn cập nhật nhánh develop

```bash
git checkout develop

git pull origin develop
```

---

## Bước 2

Tạo nhánh mới

```bash
git checkout -b feature/ten-tinh-nang
```

Ví dụ

```bash
git checkout -b feature/login
```

---

## Bước 3

Thực hiện code.

---

## Bước 4

Commit code.

Mỗi commit chỉ nên chứa một mục đích.

Ví dụ

```text
feat: create login api

feat: implement jwt authentication

fix: validate username
```

---

## Bước 5

Push branch

```bash
git push -u origin feature/login
```

---

## Bước 6

Trước khi tạo Pull Request

Cập nhật develop mới nhất

```bash
git checkout develop

git pull origin develop

git checkout feature/login

git merge develop
```

Nếu có conflict thì resolve trước.

Sau khi resolve:

- Build project.
- Chạy thử chức năng.

---

## Bước 7

Tạo Pull Request

```
feature/login

↓

develop
```

---

## Bước 8

Review

Thành viên còn lại kiểm tra:

- Coding Convention
- Logic
- Naming
- Duplicate Code
- Lỗi tiềm ẩn

Sau khi review mới được merge.

---

## Bước 9

Merge vào develop.

Sau khi merge thành công thì xóa branch feature.

---

# 4. Quy tắc Commit Message

Định dạng

```
<type>: <description>
```

Các type

```
feat
fix
refactor
docs
style
test
chore
```

Ví dụ

```
feat: create login api

feat: add jwt authentication

fix: resolve login validation bug

docs: update database design

refactor: optimize authentication service
```

Không sử dụng

```
update

fix

abc

123
```

---

# 5. Quy tắc Commit

- Một commit chỉ thực hiện một mục đích.
- Commit thường xuyên.
- Không gom quá nhiều thay đổi vào một commit.

Ví dụ

Tốt

```
feat: create login page

feat: create login api

feat: implement jwt
```

Không tốt

```
feat: complete login
```

---

# 6. Quy tắc Pull Request

Tên Pull Request

```
[Feature] Login Module

[Feature] Dashboard

[Fix] Login Validation
```

Pull Request cần mô tả:

- Chức năng đã hoàn thành.
- Danh sách file chính được sửa.
- Hình ảnh demo (nếu có).
- Các lưu ý khi review.

---

# 7. Quy tắc Review

Reviewer cần kiểm tra:

- Project build thành công.
- Không có lỗi compile.
- Logic đúng.
- Không có code dư.
- Không còn code debug.

---

# 8. Trước khi Push

Đảm bảo:

- Project chạy được.
- Không còn lỗi compile.
- Không còn `System.out.println()`.
- Không còn `console.log()`.
- Không còn dữ liệu test.
- Đã format code.

---

# 9. Không được phép

Không commit trực tiếp lên:

- master
- develop

Không sử dụng:

```
git push --force
```

nếu chưa trao đổi với thành viên còn lại.

Không tự ý sửa module của người khác.

Không commit:

```
node_modules/

target/

build/

.idea/

.vscode/

.env

*.log
```

---

# 10. Quy trình Release

Luồng phát triển

```
feature/*
      ↓
develop
      ↓
master
```

Chỉ merge `develop` vào `master` khi:

- Hoàn thành milestone.
- Đã kiểm thử toàn bộ hệ thống.
- Không còn lỗi nghiêm trọng.

Sau mỗi lần release nên tạo Tag.

Ví dụ

```
v1.0.0

v1.1.0

v2.0.0
```
