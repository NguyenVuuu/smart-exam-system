# GIT_WORKFLOW_EXAMPLE.md

# Ví dụ quy trình làm việc với Git

Tài liệu này mô tả toàn bộ quy trình làm việc với Git của nhóm, từ khi khởi tạo project đến khi release.

---

# Bước 1. Khởi tạo Project

Repository vừa được tạo trên GitHub.

Hiện chỉ có một nhánh.

```text
master
```

Commit đầu tiên

```text
init project
```

---

# Bước 2. Tạo nhánh develop

Checkout sang `master` và cập nhật branch mới nhất.

```bash
git checkout master

git pull origin master
```

Tạo nhánh `develop`.

```bash
git checkout -b develop

git push -u origin develop
```

Repository lúc này

```text
master

develop
```

Từ thời điểm này trở đi **không làm việc trực tiếp trên `master`**.

---

# Bước 3. Bắt đầu phát triển tính năng Login

Luôn cập nhật `develop` trước.

```bash
git checkout develop

git pull origin develop
```

Tạo branch mới.

```bash
git checkout -b feature/login
```

Repository

```text
master

develop

feature/login
```

---

# Bước 4. Thực hiện code

Ví dụ tạo các commit.

```bash
git commit -m "feat: create login page"

git commit -m "feat: create login api"

git commit -m "feat: implement jwt authentication"
```

---

# Bước 5. Push branch

```bash
git push -u origin feature/login
```

GitHub lúc này sẽ có

```text
master

develop

feature/login
```

---

# Bước 6. Thành viên khác phát triển Dashboard

Trong khi đó, thành viên còn lại cũng bắt đầu từ `develop`.

```bash
git checkout develop

git pull origin develop

git checkout -b feature/dashboard
```

Repository

```text
master

develop

feature/login

feature/dashboard
```

Hai thành viên làm việc hoàn toàn độc lập.

---

# Bước 7. Chuẩn bị tạo Pull Request

Sau khi Login hoàn thành.

Cập nhật `develop` mới nhất.

```bash
git checkout develop

git pull origin develop

git checkout feature/login

git merge develop
```

Nếu có Merge Conflict:

- Resolve conflict.
- Build project.
- Kiểm tra lại chức năng.
- Commit nếu cần.

---

# Bước 8. Tạo Pull Request

Tạo Pull Request trên GitHub.

```text
feature/login
      │
      ▼
develop
```

Reviewer kiểm tra:

- Logic.
- Coding Convention.
- Build.
- Chức năng.

Sau khi review thành công, merge vào `develop`.

---

# Bước 9. Đồng bộ Local Repository

**Lưu ý**

Sau khi merge Pull Request trên GitHub, **repository trên máy chưa tự cập nhật**.

Ví dụ:

### GitHub

```text
develop

└── Login
```

### Local (VS Code)

```text
develop
```

Muốn local giống GitHub cần pull lại.

```bash
git checkout develop

git pull origin develop
```

Sau khi pull

### Local (VS Code)

```text
develop

└── Login
```

> Chỉ `git checkout develop` sẽ **không** tự tải code mới từ GitHub.

---

# Bước 10. Tiếp tục phát triển Dashboard

Dashboard cũng thực hiện quy trình tương tự.

```text
feature/dashboard
      │
      ▼
develop
```

Sau khi merge xong cũng cần đồng bộ local.

```bash
git checkout develop

git pull origin develop
```

---

# Bước 11. Release

Sau khi hoàn thành:

- Login
- Dashboard
- User Management

Tạo Pull Request.

```text
develop
      │
      ▼
master
```

Merge thành công.

GitHub lúc này

```text
master

└── Release v1.0.0
```

---

# Bước 12. Đồng bộ master về Local

Sau khi merge trên GitHub.

Local vẫn chưa thay đổi.

Cần cập nhật.

```bash
git checkout master

git pull origin master
```

Lúc này `master` trên máy sẽ giống với `master` trên GitHub.

Ví dụ thư mục mới như `docs/` hoặc source code mới sẽ xuất hiện sau khi pull.

---

# Bước 13. Tạo Tag Release

Sau mỗi milestone.

Ví dụ

```text
v1.0.0

v1.1.0

v2.0.0
```

---

# Sơ đồ Workflow

```text
                     master
                        ▲
                        │
                  Pull Request
                        │
                     develop
                 ▲       ▲
                 │       │
      Pull Request   Pull Request
                 │       │
      feature/login   feature/dashboard
```

---

# Checklist mỗi ngày

Trước khi bắt đầu làm việc

```bash
git checkout develop

git pull origin develop
```

Sau đó checkout sang branch đang làm.

---

# Checklist sau khi Merge Pull Request

Nếu merge vào `develop`

```bash
git checkout develop

git pull origin develop
```

Nếu merge vào `master`

```bash
git checkout master

git pull origin master
```

Việc `git pull` giúp đồng bộ repository trên máy với repository trên GitHub.

---

# Tổng kết

Luồng làm việc chuẩn của nhóm:

```text
master
   ▲
   │
develop
   ▲
   │
feature/*
```

Mỗi tính năng luôn bắt đầu từ `develop`, phát triển trên `feature/*`, merge vào `develop` thông qua Pull Request và chỉ merge `develop` sang `master` khi hoàn thành một milestone hoặc chuẩn bị release. Sau mỗi lần merge trên GitHub, các thành viên cần thực hiện `git pull` để đồng bộ repository trên máy với repository trên GitHub.
