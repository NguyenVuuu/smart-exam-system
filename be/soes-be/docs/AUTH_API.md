# Authentication API

Base URL: `/api/auth`

## Overview

Auth hiện dùng mã tài khoản theo vai trò, không dùng email làm identifier đăng nhập.

| Role | Identifier | Bảng profile |
|---|---|---|
| `STUDENT` | `SV...` | `Student.studentCode` |
| `TEACHER` | `GV...` | `Teacher.teacherCode` |
| `ADMIN` | `AD...` | `Admin.adminCode` |

Email và phone là thông tin liên hệ trong `User`.

Access token payload:

```json
{
  "sub": "user-id",
  "profileId": "student-or-teacher-or-admin-id",
  "role": "STUDENT"
}
```

Refresh token lưu trong HttpOnly cookie và Redis.

Session rule:

- Student chỉ có một phiên active. Nếu Redis đã có refresh token cho student đó, login tiếp trả `409`.
- Teacher/Admin có thể login lại từ nhiều thiết bị.
- Profile `INACTIVE` trả `403`.

## POST `/login`

Request:

```json
{
  "identifier": "SV000001",
  "password": "123456"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt",
    "user": {
      "id": "user-id",
      "profileId": "student-id",
      "role": "STUDENT",
      "fullName": "Nguyen Van A",
      "email": "student@example.com",
      "phoneNumber": null,
      "avatarUrl": null,
      "studentCode": "SV000001"
    }
  }
}
```

Cookie:

- `refreshToken`: HttpOnly.

Common errors:

- `401`: invalid credentials.
- `403`: inactive account.
- `409`: student account already signed in on another device.
- `422`: validation failed.

## POST `/refresh-token`

Đọc `refreshToken` từ cookie.

Response `200`:

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "jwt"
  }
}
```

Errors:

- `401`: missing/invalid/expired refresh token, token không khớp Redis, hoặc account inactive.

## POST `/logout`

Yêu cầu access token hợp lệ để xóa refresh token trong Redis và blacklist access token còn hạn.

Headers:

```http
Authorization: Bearer <accessToken>
```

Response `200`:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## GET `/me`

Headers:

```http
Authorization: Bearer <accessToken>
```

Response `200`:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "user-id",
    "profileId": "teacher-id",
    "role": "TEACHER",
    "fullName": "Tran Thi B",
    "email": "teacher@example.com",
    "phoneNumber": "0900000000",
    "avatarUrl": null,
    "teacherCode": "GV000001",
    "position": "LECTURER"
  }
}
```

## PATCH `/me`

Cập nhật thông tin liên hệ của `User`.

Headers:

```http
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "email": "new@example.com",
  "phoneNumber": "0912345678"
}
```

Rules:

- `email` optional, có thể `null` hoặc chuỗi rỗng để xóa.
- `phoneNumber` optional, tối đa 20 ký tự, có thể `null` hoặc chuỗi rỗng để xóa.
- Email nếu có phải unique trong `User`.

## PATCH `/me/password`

Đổi mật khẩu profile đang đăng nhập.

Headers:

```http
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

Rules:

- `newPassword` dài 6-100 ký tự.
- Mật khẩu được hash bằng bcrypt trước khi lưu.

## Response format

Success:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "identifier", "message": "Identifier is required" }
  ]
}
```
