# GIT_WORKFLOW_EXAMPLE.md

# Ví dụ quy trình làm việc với Git

Giả sử project vừa được khởi tạo.

Repository hiện có:

```
master
```

Commit đầu tiên

```
init project
```

---

# Bước 1

Tạo nhánh develop

```bash
git checkout master

git pull origin master

git checkout -b develop

git push -u origin develop
```

Repository

```
master

develop
```

---

# Bước 2

Bắt đầu phát triển Login

```bash
git checkout develop

git pull origin develop

git checkout -b feature/login
```

Repository

```
master

develop

feature/login
```

---

# Bước 3

Code Login

Ví dụ commit

```bash
git commit -m "feat: create login page"

git commit -m "feat: create login api"

git commit -m "feat: implement jwt authentication"
```

---

# Bước 4

Push branch

```bash
git push -u origin feature/login
```

---

# Bước 5

Trong lúc đó thành viên khác phát triển Dashboard

```bash
git checkout develop

git pull origin develop

git checkout -b feature/dashboard
```

Repository

```
master

develop

feature/login

feature/dashboard
```

Hai người làm việc độc lập.

---

# Bước 6

Login hoàn thành.

Cập nhật develop mới nhất

```bash
git checkout develop

git pull origin develop

git checkout feature/login

git merge develop
```

Nếu có conflict thì resolve.

Build project.

Kiểm tra chức năng.

---

# Bước 7

Tạo Pull Request

```
feature/login

↓

develop
```

Reviewer kiểm tra.

Merge thành công.

Repository

```
master

develop
```

Sau đó xóa

```
feature/login
```

---

# Bước 8

Dashboard hoàn thành.

Lặp lại quy trình.

```
feature/dashboard

↓

develop
```

---

# Bước 9

Sau khi Login + Dashboard + User Management đều hoàn thành

Tạo Pull Request

```
develop

↓

master
```

Merge thành công.

Repository

```
master
```

Commit

```
Release v1.0.0
```

Tạo Tag

```
v1.0.0
```

---

# Tổng quan Workflow

```
               master
                  ▲
                  │
             develop
             ▲   ▲   ▲
             │   │   │
feature/login
feature/dashboard
feature/user
```

Mỗi tính năng luôn bắt đầu từ `develop`, sau đó merge ngược về `develop`. Chỉ khi hoàn thành một milestone và đã kiểm thử toàn bộ hệ thống mới merge `develop` sang `master`.
