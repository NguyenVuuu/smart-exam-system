# Authentication API

Base URL: `/api/auth`

## Overview

He thong ap dung kien truc **1 User = 1 Tai khoan duy nhat**:
- Moi nguoi dung chi co duy nhat 1 tai khoan `User` chua credentials: `password`, `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), va mang cac vai tro `roles: UserRole[]`.
- 5 vai tro duoc ho tro qua enum `UserRole`: `ADMIN`, `EDUCATION_OFFICER`, `TEACHER`, `DEPARTMENT_HEAD`, `STUDENT`.
- Cac bang profile `Student`, `Teacher`, `Admin` khong con luu cot `password`.
- Dang nhap chi bang `username`; gia tri nay chinh la ma tai khoan (vi du `22002885`). Email va ma profile khac khong phai thong tin dang nhap.

| Role | Identifier | Bang profile |
|---|---|---|
| `STUDENT` | `username` (ma tai khoan) | `Student` (studentCode) |
| `TEACHER` | `username` (ma tai khoan) | `Teacher` (teacherCode, position=LECTURER) |
| `DEPARTMENT_HEAD` | `username` (ma tai khoan) | `Teacher` (teacherCode, position=DEPARTMENT_HEAD) |
| `ADMIN` | `username` (ma tai khoan) | `Admin` (adminCode, role=ADMIN) |
| `EDUCATION_OFFICER` | `username` (ma tai khoan) | `Admin` (adminCode, role=EDUCATION_OFFICER) |

Access token payload:

```json
{
  "sub": "user-id",
  "profileId": "student-or-teacher-or-admin-id",
  "role": "STUDENT",
  "jti": "uuid"
}
```

Refresh token luu trong HttpOnly cookie va Redis theo key `refreshToken:${userId}:${role}`.

Session rule:

- Student chi co mot phien active tai mot thoi diem. Login khi da co session tra `409 Conflict`.
- Teacher/Admin/EducationOfficer/DepartmentHead co the dang nhap dong thoi tu nhieu thiet bi.
- User `status != ACTIVE` tra `403 Forbidden`.

---

## POST `/login`

Buoc 1 dang nhap: xac thuc tai khoan bang username va password.

Request:

```json
{
  "username": "SV000001", // Ma tai khoan, phai trung voi User.username
  "password": "yourpassword"
}
```

### Response khi User co 1 role (Single-role direct login)

HTTP `200` — Dang nhap thanh cong truc tiep, cookie `refreshToken` duoc set va tra ve access token:

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
      "email": "student@soes.edu.vn",
      "phoneNumber": null,
      "avatarUrl": null,
      "studentCode": "SV000001",
      "teacherCode": null,
      "adminCode": null,
      "availableRoles": ["STUDENT"]
    }
  }
}
```

### Response khi User co tu 2 role tro len (Multi-role selection required)

HTTP `200` — Yeu cau chon role, KHONG set cookie:

```json
{
  "success": true,
  "message": "Role selection required",
  "data": {
    "requireRoleSelection": true,
    "selectionToken": "uuid-v4",
    "availableRoles": [
      {
        "role": "TEACHER",
        "name": "Giảng viên",
        "profileId": "teacher-id",
        "code": "GV000002",
        "position": "LECTURER"
      },
      {
        "role": "STUDENT",
        "name": "Sinh viên",
        "profileId": "student-id",
        "code": "SV000002"
      }
    ],
    "user": {
      "id": "user-id",
      "fullName": "Le Minh Cuong",
      "avatarUrl": null
    }
  }
}
```

`selectionToken` het han sau 5 phut (luu trong Redis) va chi duoc su dung mot lan duy nhat.

Common errors:

- `401`: invalid credentials (tai khoan khong ton tai hoac sai mat khau).
- `403`: tai khoan bi khoa/inactive (`User.status != ACTIVE`).
- `409`: student dang co mot phien lam viec khac dang hoat dong.
- `422`: validation failed.

---

## POST `/select-role`

Buoc 2 dang nhap: chon role khi co nhieu role.

Goi sau khi nhan `requireRoleSelection: true` tu `/login`.

Request:

```json
{
  "selectionToken": "uuid-v4",
  "role": "TEACHER"
}
```

`role` phai la mot trong: `ADMIN`, `EDUCATION_OFFICER`, `TEACHER`, `DEPARTMENT_HEAD`, `STUDENT`.

Response `200` — dang nhap thanh cong, cookie `refreshToken` duoc set:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt",
    "user": { ... }
  }
}
```

Errors:

- `401`: selectionToken het han hoac khong hop le.
- `403`: role yeu cau khong co trong danh sach cho phep.
- `404`: profile khong tim thay.

---

## POST `/refresh-token`

Doc `refreshToken` tu cookie.

Response `200`:

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": { "accessToken": "jwt" }
}
```

Errors:

- `401`: missing/invalid/expired refresh token, token khong khop Redis, hoac account inactive.

---

## POST `/logout`

Yeu cau access token hop le de xoa refresh token trong Redis va blacklist access token con han.

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

---

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
    "role": "DEPARTMENT_HEAD",
    "fullName": "Tran Thi Bich",
    "email": "gv001@soes.edu.vn",
    "phoneNumber": null,
    "avatarUrl": null,
    "teacherCode": "GV000001",
    "studentCode": null,
    "adminCode": null,
    "position": "DEPARTMENT_HEAD",
    "departmentId": "dept-id",
    "permissions": ["APPROVE_SHARED_QUESTION", "APPROVE_FINAL_EXAM", "VIEW_DEPARTMENT_EXAMS", "VIEW_DEPARTMENT_REPORTS"]
  }
}
```

---

## PATCH `/me`

Cap nhat thong tin lien he cua `User`.

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

- `email` optional, co the `null` hoac chuoi rong de xoa.
- `phoneNumber` optional, toi da 20 ky tu.
- Email neu co phai unique trong `User`.

---

## PATCH `/me/password`

Doi mat khau profile dang dang nhap.

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

- `newPassword` dai 6-100 ky tu.
- Mat khau duoc hash bang bcrypt truoc khi luu.

---

## Response format

Success:

```json
{ "success": true, "message": "OK", "data": {} }
```

Error:

```json
{ "success": false, "message": "Invalid credentials" }
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "username", "message": "Username is required" }]
}
```
