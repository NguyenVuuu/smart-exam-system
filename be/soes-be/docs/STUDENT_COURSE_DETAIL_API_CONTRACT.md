# Student Course Detail API

## Mục đích

Cung cấp toàn bộ dữ liệu để xây dựng trang **Student Course Detail**.

Trang gồm 3 tab:

- Bài đăng
- Thành viên
- Điểm

Chỉ sinh viên đã đăng ký lớp học phần mới được phép truy cập.

---

# Base URL

```
/api/student/course-offerings/:courseOfferingId
```

---

# API 1. Course Header

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId
```

## Mục đích

Lấy thông tin chung của môn học.

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)

## Response

```json
{
  "success": true,
  "message": "Course loaded successfully",
  "data": {
    "courseOfferingId": "uuid",
    "subjectId": "uuid",
    "subjectCode": "JAVA101",
    "subjectName": "Lập trình Java",
    "courseCode": "JAVA101 - Lớp 01",
    "teacherName": "Nguyễn Văn A"
  }
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `courseOfferingId` | string | ID của lớp học phần |
| `subjectId` | string | ID của môn học |
| `subjectCode` | string | Mã môn học |
| `subjectName` | string | Tên môn học |
| `courseCode` | string | Mã lớp học phần |
| `teacherName` | string | Tên giảng viên |

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy lớp học phần hoặc sinh viên không thuộc lớp |

---

# Test với Postman

## Course Header

### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}
```

### Test Cases

#### 1. Success

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Course loaded successfully",
  "data": {
    "courseOfferingId": "550e8400-e29b-41d4-a716-446655440000",
    "subjectId": "123e4567-e89b-12d3-a456-426614174000",
    "subjectCode": "JAVA101",
    "subjectName": "Lập trình Java",
    "courseCode": "JAVA101 - Lớp 01",
    "teacherName": "Nguyễn Văn A"
  }
}
```

#### 2. CourseOffering không tồn tại → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/non-existent-id
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 3. Student không thuộc lớp → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId_of_other_student}
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 4. Không login → 401

**Headers:**
```
(No Authorization header)
```

**Response:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 5. Teacher gọi API → 403

**Headers:**
```
Authorization: Bearer <valid_teacher_token>
```

**Response:**
```json
{
  "success": false,
  "message": "Forbidden"
}
```

---

# Base URL

```
/api/student/course-offerings/:courseOfferingId
```

---

# API 2. Timeline

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId
```

## Mục đích

Lấy thông tin chung của môn học.

## Response

```json
{
  "success": true,
  "message": "Course loaded successfully",
  "data": {
    "courseOfferingId": "uuid",
    "subjectId": "uuid",
    "subjectCode": "JAVA101",
    "subjectName": "Lập trình Java",
    "courseCode": "JAVA101 - Lớp 01",
    "teacherName": "Nguyễn Văn A"
  }
}
```

---

# API 2. Timeline

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/posts
```

## Query

| Parameter | Default |
| --------- | ------- |
| page      | 1       |
| pageSize  | 10      |

## Response

```json
{
  "success": true,
  "message": "Posts loaded successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "POST",
        "title": "File ôn giữa kỳ",
        "publishedAt": "2026-07-20T08:00:00Z",
        "edited": true,
        "hasAttachment": true
      },
      {
        "id": "uuid",
        "type": "EXAM",
        "title": "Kiểm tra giữa kỳ",
        "publishedAt": "2026-07-18T08:00:00Z",
        "startTime": "2026-07-20T19:00:00Z",
        "endTime": "2026-07-20T20:00:00Z",
        "durationMinutes": 60
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 12,
      "totalPages": 2
    }
  }
}
```

## Business Rules

- Chỉ hiển thị bài đã Publish.
- Không hiển thị Draft.
- Không hiển thị Hidden.
- Sort theo publishedAt giảm dần.
- Timeline gồm:
  - POST
  - EXAM
- Sau này có thể mở rộng Assignment.

---

# API 3. Post Detail

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/posts/:postId
```

## Response

```json
{
  "success": true,
  "message": "Post loaded successfully",
  "data": {
    "id": "uuid",
    "title": "File ôn giữa kỳ",
    "content": "Sinh viên tải file này để ôn tập.",
    "publishedAt": "2026-07-20T08:00:00Z",
    "updatedAt": "2026-07-21T09:00:00Z",
    "edited": true,
    "attachments": [
      {
        "id": "uuid",
        "fileName": "Java.pdf",
        "fileType": "PDF",
        "fileSize": "2.5 MB",
        "downloadUrl": "/files/abc"
      },
      {
        "id": "uuid",
        "fileName": "Source.zip",
        "fileType": "ZIP",
        "fileSize": "18 MB",
        "downloadUrl": "/files/xyz"
      }
    ]
  }
}
```

## Business Rules

- Một bài đăng có thể có nhiều file.
- Click tên file sẽ tải xuống ngay.
- Không preview.
- File hiển thị theo thứ tự upload.
- Nếu bài đã chỉnh sửa thì edited = true.

---

# API 4. Exam Detail

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/exams/:examId
```

## Response

```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 3,
    "attemptUsed": 1,
    "remainingAttempts": 2,
    "canStart": true,
    "status": "AVAILABLE"
  }
}
```

## Status

- NOT_STARTED
- AVAILABLE
- SUBMITTED
- EXPIRED

## Business Rules

- Nếu hết hạn thì canStart = false.
- Nếu làm nhiều lần thì trả attemptUsed và remainingAttempts.
- FE chỉ dựa vào canStart để hiển thị nút "Vào làm bài".

---

# API 5. Members

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/members
```

## Query

| Parameter | Default |
| --------- | ------- |
| page      | 1       |
| pageSize  | 20      |

## Response

```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "role": "TEACHER",
        "fullName": "Nguyễn Văn A",
        "studentCode": null
      },
      {
        "id": "uuid",
        "role": "ASSISTANT",
        "fullName": "Trần Văn B",
        "studentCode": null
      },
      {
        "id": "uuid",
        "role": "STUDENT",
        "fullName": "Lê Văn C",
        "studentCode": "22123456"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 35,
      "totalPages": 2
    }
  }
}
```

## Business Rules

- Teacher luôn đứng đầu.
- Assistant đứng sau Teacher.
- Student đứng cuối.
- Student sort A → Z theo tên.
- Không có tìm kiếm.
- Avatar sẽ do Frontend sinh từ chữ cái đầu.

---

# API 6. Scores

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/scores
```

## Response

```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": [
      {
        "examId": "uuid",
        "title": "Giữa kỳ",
        "type": "MIDTERM",
        "score": 8.5,
        "publishedAt": "2026-07-25T10:00:00Z"
      },
      {
        "examId": "uuid",
        "title": "Cuối kỳ",
        "type": "FINAL",
        "score": 9
      },
      {
        "examId": "uuid",
        "title": "Thường kỳ code",
        "type": "QUIZ",
        "score": 7
      }
    ]
  }
}
```

## Business Rules

- Chỉ hiển thị điểm đã được giảng viên công khai.
- Không hiển thị GPA.
- Không hiển thị autoScore.
- Không có pagination.
- Nếu chưa có điểm:

```json
{
  "items": []
}
```

Frontend hiển thị:

```
Chờ giảng viên nhập điểm
```

---

# Quyền truy cập

Áp dụng cho toàn bộ API.

- Chỉ Student được phép truy cập.
- Sinh viên không thuộc lớp học phần → 404.
- CourseOffering không tồn tại → 404.
- Bài đăng không thuộc lớp học phần → 404.
- Bài thi không thuộc lớp học phần → 404.

---

# Tổng kết API

| Method | Endpoint                                                        | Mục đích             |
| ------ | --------------------------------------------------------------- | -------------------- |
| GET    | `/api/student/course-offerings/:courseOfferingId`               | Header môn học       |
| GET    | `/api/student/course-offerings/:courseOfferingId/posts`         | Timeline             |
| GET    | `/api/student/course-offerings/:courseOfferingId/posts/:postId` | Chi tiết bài đăng    |
| GET    | `/api/student/course-offerings/:courseOfferingId/exams/:examId` | Chi tiết bài thi     |
| GET    | `/api/student/course-offerings/:courseOfferingId/members`       | Danh sách thành viên |
| GET    | `/api/student/course-offerings/:courseOfferingId/scores`        | Điểm của sinh viên   |
