# Authentication API

Base URL: `http://localhost:3000/api/auth`

---

## Tổng quan

Hệ thống hỗ trợ 3 loại người dùng với cách đăng nhập khác nhau:

| Loại       | Identifier             | Điều kiện                  |
|------------|------------------------|----------------------------|
| Admin      | Email                  | `isAdmin = true`           |
| Sinh viên  | Mã SV (bắt đầu bằng `SV`) | `studentCode != null`  |
| Giảng viên | Mã GV (bắt đầu bằng `GV`) | `teacherCode != null`  |

> Một người dùng có thể vừa là sinh viên vừa là giảng viên.

---

## Endpoints

### 1. Đăng nhập

```
POST /api/auth/login
```

**Request Body**

```json
{
  "identifier": "admin@gmail.com",
  "password": "123456"
}
```

| Field        | Type   | Mô tả                                          |
|--------------|--------|------------------------------------------------|
| `identifier` | string | Email (admin), mã SV (`SV000001`), mã GV (`GV000001`) |
| `password`   | string | Mật khẩu                                       |

**Response thành công `200`**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "Nguyen Van A",
      "email": "admin@gmail.com",
      "studentCode": null,
      "teacherCode": null,
      "isAdmin": true,
      "avatarUrl": null
    }
  }
}
```

> `refreshToken` được lưu tự động vào **HttpOnly Cookie** tên `refreshToken`, không xuất hiện trong response body.

**Các lỗi có thể xảy ra**

| Status | Trường hợp                                        |
|--------|---------------------------------------------------|
| `401`  | Không tìm thấy user hoặc sai mật khẩu            |
| `401`  | Đăng nhập bằng email nhưng `isAdmin = false`      |
| `403`  | Tài khoản đang bị `INACTIVE`                      |
| `422`  | Request body không hợp lệ (thiếu field)           |

---

### 2. Làm mới Access Token

```
POST /api/auth/refresh-token
```

Không cần request body. Tự động đọc `refreshToken` từ cookie.

**Response thành công `200`**

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Các lỗi có thể xảy ra**

| Status | Trường hợp                                    |
|--------|-----------------------------------------------|
| `401`  | Cookie không có `refreshToken`                |
| `401`  | `refreshToken` hết hạn hoặc không hợp lệ     |
| `401`  | User không tồn tại hoặc tài khoản `INACTIVE`  |

---

### 3. Đăng xuất

```
POST /api/auth/logout
```

Không cần request body hay Authorization header. Xóa cookie `refreshToken`.

**Response thành công `200`**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4. Lấy thông tin người dùng hiện tại

```
GET /api/auth/me
```

**Yêu cầu:** Bearer Token trong header.

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response thành công `200`**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "fullName": "Tran Thi B",
    "email": null,
    "studentCode": "SV000001",
    "teacherCode": "GV000001",
    "isAdmin": false,
    "avatarUrl": null
  }
}
```

**Các lỗi có thể xảy ra**

| Status | Trường hợp                                  |
|--------|---------------------------------------------|
| `401`  | Thiếu hoặc sai format Authorization header |
| `401`  | Access token hết hạn hoặc không hợp lệ     |

---

## JWT

| Token         | Thời hạn | Lưu ở đâu           |
|---------------|----------|---------------------|
| Access Token  | 15 phút  | Response body       |
| Refresh Token | 7 ngày   | HttpOnly Cookie     |

**Payload của Access Token**

```json
{
  "sub": "userId",
  "isAdmin": false,
  "studentCode": "SV000001",
  "teacherCode": null,
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Authorization Middlewares

Dùng các middleware này để bảo vệ route trong các module khác.

```typescript
import { authenticate } from '../modules/auth'
import { requireAdmin, requireStudent, requireTeacher, requireAdminOrTeacher } from '../modules/auth'
```

| Middleware               | Điều kiện cho phép                        |
|--------------------------|-------------------------------------------|
| `authenticate`           | Token hợp lệ (tất cả user đã đăng nhập)  |
| `requireAdmin()`         | `isAdmin === true`                        |
| `requireStudent()`       | `studentCode !== null`                    |
| `requireTeacher()`       | `teacherCode !== null`                    |
| `requireAdminOrTeacher()`| `isAdmin === true` hoặc `teacherCode !== null` |

**Ví dụ sử dụng trong route**

```typescript
import { authenticate } from '../auth'
import { requireAdmin, requireAdminOrTeacher } from '../auth'

// Chỉ admin
router.get('/users', authenticate, requireAdmin(), userController.list)

// Admin hoặc giảng viên
router.post('/exams', authenticate, requireAdminOrTeacher(), examController.create)

// Chỉ sinh viên
router.get('/my-enrollments', authenticate, requireStudent(), enrollmentController.myList)
```

---

## Ví dụ sử dụng với cURL

**Đăng nhập admin**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"identifier": "admin@gmail.com", "password": "123456"}'
```

**Đăng nhập sinh viên**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"identifier": "SV000001", "password": "123456"}'
```

**Gọi API cần xác thực**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

**Làm mới token**
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -b cookies.txt
```

**Đăng xuất**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## Chuẩn response

**Thành công**
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

**Lỗi**
```json
{
  "success": false,
  "message": "..."
}
```

**Lỗi validation**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "identifier", "message": "Identifier is required" }
  ]
}
```
