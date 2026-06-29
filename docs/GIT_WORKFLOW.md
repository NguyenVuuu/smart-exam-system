# GIT_WORKFLOW.md

# Quy định quản lý Source Code bằng Git

---

# 1. Mục đích

Tài liệu này quy định quy trình làm việc với Git của nhóm nhằm:

- Quản lý source code thống nhất.
- Hạn chế Merge Conflict.
- Đảm bảo lịch sử commit rõ ràng.
- Giúp các thành viên phối hợp hiệu quả.
- Dễ dàng review, rollback và release.

---

# 2. Cấu trúc nhánh

Repository sử dụng các nhánh sau.

## master

- Chứa source code ổn định nhất.
- Chỉ merge từ `develop`.
- Không commit trực tiếp lên `master`.
- Mỗi lần merge vào `master` tương ứng với một milestone hoặc release.

---

## develop

- Là nhánh phát triển chính.
- Tất cả tính năng mới đều merge vào `develop`.
- Không code trực tiếp trên `develop`.

---

## feature/\*

Mỗi tính năng phải được phát triển trên một nhánh riêng.

Ví dụ

```text
feature/login

feature/dashboard

feature/user-management

feature/course-management

feature/ai-module
```

---

# 3. Quy trình làm việc hằng ngày (Daily Workflow)

Trước khi bắt đầu code mỗi ngày:

```bash
git checkout develop

git pull origin develop
```

Sau đó checkout sang branch đang làm hoặc tạo branch mới.

Không làm việc trực tiếp trên `master` hoặc `develop`.

---

# 4. Quy trình phát triển một tính năng

## Bước 1. Đồng bộ develop

```bash
git checkout develop

git pull origin develop
```

---

## Bước 2. Tạo nhánh mới

```bash
git checkout -b feature/ten-tinh-nang
```

Ví dụ

```bash
git checkout -b feature/login
```

---

## Bước 3. Thực hiện code

Lập trình theo phạm vi của tính năng.

---

## Bước 4. Commit

Mỗi commit chỉ nên thực hiện một mục đích.

Ví dụ

```text
feat: create login page

feat: create login api

feat: implement jwt authentication

fix: validate username
```

---

## Bước 5. Push branch

```bash
git push -u origin feature/login
```

---

## Bước 6. Đồng bộ develop trước khi tạo Pull Request

```bash
git checkout develop

git pull origin develop

git checkout feature/login

git merge develop
```

Nếu xảy ra conflict:

- Resolve conflict.
- Build project.
- Kiểm tra lại chức năng.
- Commit nếu cần.

---

## Bước 7. Tạo Pull Request

Luồng merge

```text
feature/login
      │
      ▼
develop
```

Pull Request cần:

- Title rõ ràng.
- Description mô tả chức năng.
- Danh sách file chính.
- Hình ảnh demo (nếu có).

---

## Bước 8. Review

Thành viên còn lại kiểm tra:

- Coding Convention.
- Logic.
- Naming.
- Duplicate Code.
- Build thành công.
- Không còn code debug.

Sau khi review mới được merge.

---

## Bước 9. Merge vào develop

Sau khi Pull Request được approve:

- Merge vào `develop`.
- Xóa branch `feature/*`.

---

## Bước 10. Đồng bộ Local Repository

**Lưu ý**

Sau khi merge trên GitHub, repository trên máy **không tự cập nhật**.

Muốn local giống GitHub phải pull lại.

Ví dụ cập nhật develop

```bash
git checkout develop

git pull origin develop
```

Hoặc cập nhật master

```bash
git checkout master

git pull origin master
```

> Chỉ `git checkout` **không** tải code mới từ GitHub.

---

# 5. Quy tắc Commit Message

Định dạng

```text
<type>: <description>
```

Các type

```text
feat
fix
refactor
docs
style
test
chore
```

Ví dụ

```text
feat: create login api

feat: add jwt authentication

fix: resolve login validation bug

docs: update git workflow

refactor: optimize authentication service
```

Không sử dụng

```text
update

fix

abc

123
```

---

# 6. Quy tắc Commit

- Một commit chỉ nên có một mục đích.
- Commit thường xuyên.
- Không gom quá nhiều thay đổi vào một commit.

Ví dụ tốt

```text
feat: create login page

feat: create login api

feat: implement jwt
```

Ví dụ không tốt

```text
feat: complete login
```

---

# 7. Quy tắc Pull Request

Tên Pull Request

```text
[Feature] Login Module

[Feature] Dashboard

[Fix] Login Validation

[Docs] Update Git Workflow
```

Description nên bao gồm:

- Chức năng đã thực hiện.
- File chính được sửa.
- Hình ảnh demo (nếu có).
- Lưu ý khi review.

---

# 8. Checklist trước khi Push

Đảm bảo:

- Build thành công.
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

Không sử dụng

```bash
git push --force
```

nếu chưa trao đổi với thành viên còn lại.

Không tự ý sửa module của người khác.

Không commit:

```text
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

```text
feature/*
      │
      ▼
develop
      │
      ▼
master
```

Chỉ merge `develop` vào `master` khi:

- Hoàn thành milestone.
- Đã kiểm thử toàn bộ hệ thống.
- Không còn lỗi nghiêm trọng.

Sau khi merge vào `master` trên GitHub, cần đồng bộ local:

```bash
git checkout master

git pull origin master
```

Để local `master` giống với `master` trên GitHub.

Sau mỗi lần release nên tạo Tag.

Ví dụ

```text
v1.0.0

v1.1.0

v2.0.0
```
