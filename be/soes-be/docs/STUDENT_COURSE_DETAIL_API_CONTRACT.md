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
GET /api/student/course-offerings/:courseOfferingId/timeline
```

## Mục đích

Lấy danh sách hoạt động (Timeline) của lớp học phần, bao gồm bài đăng (POST) và bài thi(EXAM).

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)
- Kiểm tra Enrollment trước khi lấy dữ liệu

## Query

| Parameter | Default |
| --------- | ------- |
| page      | 1       |
| pageSize  | 10      |

## Response

```json
{
  "success": true,
  "message": "Timeline loaded successfully",
  "data": {
    "items": [
      {
        "id": "...",
        "courseOfferingId": "uuid",
        "type": "POST",
        "title": "File ôn giữa kỳ",
        "authorName":"Nguyễn Văn A",
        "publishedAt": "2026-07-20T08:00:00Z",
        "edited": true,
        "hasAttachment": true
      },
      {
        "id": ".....",
        "type": "EXAM",
        "courseOfferingId": "uuid",
        "title": "Kiểm tra giữa kỳ",
        "authorName":"Pham Thi Bich",
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

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy lớp học phần hoặc sinh viên không thuộc lớp |

## Business Rules

- Chỉ hiển thị Post có status = PUBLISHED.
- Chỉ hiển thị Exam có status = PUBLISHED.
- Không hiển thị DRAFT.
- Không hiển thị ARCHIVED.
- Sort theo publishedAt giảm dần (Sort theo publishedAt DESC).
- Sau này có thể mở rộng Assignment.
- Timeline gồm các item có type là POST và EXAM.
- Tất cả item được hợp nhất thành một danh sách và sắp xếp theo publishedAt DESC.
EXAM chỉ hiển thị khi:
- status = PUBLISHED
- publishedAt != null
- Pagination áp dụng sau khi merge và sort.

---

## Test với Postman

### Timeline

#### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}/timeline
```

#### Test Cases

##### 1. Success

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```
page=1&pageSize=10
```

**Response:**
```json
{
  "success": true,
  "message": "Timeline loaded successfully",
  "data": {
    "items": [
      {
        "id": "post-uuid-1",
        "courseOfferingId": "course-offering-uuid",
        "type": "POST",
        "title": "File ôn giữa kỳ",
        "authorName": "Nguyễn Văn A",
        "publishedAt": "2026-07-20T08:00:00Z",
        "edited": true,
        "hasAttachment": true
      },
      {
        "id": "exam-uuid-1",
        "courseOfferingId": "course-offering-uuid",
        "type": "EXAM",
        "title": "Kiểm tra giữa kỳ",
        "authorName": "Phạm Thị Bích",
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

##### 2. Pagination (page 2)

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```
page=2&pageSize=5
```

**Response:**
```json
{
  "success": true,
  "message": "Timeline loaded successfully",
  "data": {
    "items": [
      {
        "id": "post-uuid-6",
        "courseOfferingId": "course-offering-uuid",
        "type": "POST",
        "title": "Bài tập lập trình",
        "authorName": "Nguyễn Văn A",
        "publishedAt": "2026-07-15T10:00:00Z",
        "edited": false,
        "hasAttachment": false
      }
    ],
    "pagination": {
      "page": 2,
      "pageSize": 5,
      "totalItems": 12,
      "totalPages": 3
    }
  }
}
```

##### 3. Empty Timeline

**Scenario:** Course offering có nhưng không có Post/Exam published

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Timeline loaded successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

##### 4. CourseOffering không tồn tại → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/non-existent-id/timeline
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

##### 5. Student không thuộc lớp → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId_of_other_student}/timeline
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

##### 6. Không login → 401

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

##### 7. Teacher gọi API → 403

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

##### 8. Invalid query parameters

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```
page=0&pageSize=0
```

**Response:** (System sẽ sử dụng defaults)
```json
{
  "success": true,
  "message": "Timeline loaded successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

---

# API 3. Post Detail

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/posts/:postId
```

## Mục đích

Lấy chi tiết bài đăng (Post Detail) của lớp học phần.

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)
- Kiểm tra Enrollment trước khi lấy dữ liệu

## Response


### Có attachments
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

### Nếu không có attachments
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
    "attachments": []
  }
}
```


## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy tài nguyên hoặc không có quyền truy cập (Not Found) |

## Business Rules

- Một bài đăng có thể có nhiều file.
- Chỉ cho phép xem Post có status = PUBLISHED.
- Nếu Post có status khác PUBLISHED thì trả về 404.
- Click tên file sẽ tải xuống ngay.
- Không preview.
- Nếu bài đã chỉnh sửa thì edited = true.
- Post phải thuộc Course Offering.
- Nếu Post không thuộc Course Offering → 404.
- attachments trả về theo thứ tự upload tăng dần.

---

# Test với Postman

## API 3. Post Detail

### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}/posts/{postId}
```

### Test Cases

#### 1. Success - Có attachments

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post loaded successfully",
  "data": {
    "id": "post-uuid-1",
    "title": "File ôn giữa kỳ",
    "content": "Sinh viên tải file này để ôn tập.",
    "publishedAt": "2026-07-20T08:00:00Z",
    "updatedAt": "2026-07-21T09:00:00Z",
    "edited": true,
    "attachments": [
      {
        "id": "att-uuid-1",
        "fileName": "Java.pdf",
        "fileType": "PDF",
        "fileSize": "2.5 MB",
        "downloadUrl": "/files/java.pdf"
      },
      {
        "id": "att-uuid-2",
        "fileName": "Source.zip",
        "fileType": "ZIP",
        "fileSize": "18 MB",
        "downloadUrl": "/files/source.zip"
      }
    ]
  }
}
```

#### 2. Success - Không có attachment

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post loaded successfully",
  "data": {
    "id": "post-uuid-1",
    "title": "Thông báo thi",
    "content": "Thi vào ngày mai.",
    "publishedAt": "2026-07-20T08:00:00Z",
    "updatedAt": "2026-07-20T08:00:00Z",
    "edited": false,
    "attachments": []
  }
}
```

#### 3. Không login → 401

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

#### 4. Teacher gọi API → 403

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

#### 5. Student không thuộc lớp → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId_of_other_student}/posts/{postId}
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 6. Course Offering không tồn tại → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/non-existent-id/posts/{postId}
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 7. Post không tồn tại → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/posts/non-existent-post-id
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 8. Post không thuộc Course Offering → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/posts/post-from-another-course
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 9. Post có status khác PUBLISHED (DRAFT/ARCHIVED) → 404

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/posts/draft-post-id
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

---

# API 4. Exam Detail

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/exams/:examId
```

## Mục đích

Lấy thông tin bài kiểm tra.

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)
- Kiểm tra Enrollment trước khi lấy dữ liệu

## Response

### NOT_STARTED
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "type": "MIDTERM",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "publishedAt": "2026-07-18T08:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 0, 
    "remainingAttempts": 1,
    "canStart": false,
    "status": "NOT_STARTED",
    "canResume": false,
    "attemptId": null

  }
}
```

### Đã làm bài
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "type": "MIDTERM",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "publishedAt": "2026-07-18T08:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 1, 
    "remainingAttempts": 0,
    "canStart": false,
    "status": "SUBMITTED",
    "remainingSeconds": null,
    "canResume": false,
    "attemptId": "968ebcad-7149-4559-9185-499ec35fafdf"
  }
}
```
### Chưa làm bài

```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "type": "MIDTERM",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "publishedAt": "2026-07-18T08:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1, 
    "attemptUsed": 0,
    "remainingAttempts": 1,
    "attemptId": null,
    "canResume": false,
    "remainingSeconds":3600,
    "canStart": true,
    "status": "AVAILABLE"
  }
}
```

### Đang làm bài

```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "type": "MIDTERM",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "publishedAt": "2026-07-18T08:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1, 
    "attemptUsed": 1,
    "remainingAttempts": 0,
    "canStart": true,
    "status": "AVAILABLE",
    "remainingSeconds": 24144,
    "canResume": true,
    "attemptId": "6efd9d2d-6366-44d6-99dc-74d0c2bf913e"
  }
}
```

### Expired

```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "uuid",
    "title": "Giữa kỳ",
    "type": "MIDTERM",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-20T19:00:00Z",
    "endTime": "2026-07-20T20:00:00Z",
    "publishedAt": "2026-07-18T08:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1, 
    "attemptUsed": 0,
    "remainingAttempts": 1,
    "canStart": false,
    "status": "EXPIRED",
    "remainingSeconds": null,
    "canResume": false,
    "attemptId": null
  }
}
```

## Response Fields

| Field | Description |
|-------|------|
| `id` | ID bài thi | 
| `title` | Tên bài thi | 
| `type` | MIDTERM / FINAL / QUIZ | 
| `description` | Mô tả | 
| `startTime` | Thời gian bắt đầu | 
| `endTime` | Thời gian kết thúc | 
| `publishedAt` | Thời điểm công khai | 
| `durationMinutes` | Thời lượng làm bài | 
| `maxAttempts` | Số lượt làm tối đa | 
| `attemptUsed` | Số lượt đã sử dụng | 
| `remainingAttempts` | Số lượt còn lại | 
| `attemptId` | ID lần làm bài hiện tại. Chỉ trả về khi sinh viên đang làm bài chưa submit. | 
| `canResume` | Chỉ trả về khi status = AVAILABLE. FE dùng để hiển thị nút "Tiếp tục". | 
| `remainingSeconds` | Chỉ trả về khi status = AVAILABLE. Không trả về khi SUBMITTED, EXPIRED hoặc NOT_STARTED. | 
| `canStart` | FE dùng để bật/tắt nút "Vào làm bài" | 
| `status` | Trạng thái của sinh viên đối với bài thi (NOT_STARTED, AVAILABLE, SUBMITTED, EXPIRED) | 

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy tài nguyên hoặc không có quyền truy cập (Not Found) |

## Chi tiết các lỗi ra 404
404 khi:
- Course Offering không tồn tại.
- Student không thuộc lớp học phần.
- Exam không tồn tại.
- Exam không thuộc Course Offering.
- Exam chưa được publish.
- publishedAt = null.


## Status (Status của sinh viên với bài thi, không phải của Exam "Student Exam Status")

Status được xác định theo thứ tự ưu tiên:

1. Nếu Student đã SUBMITTED -> SUBMITTED
2. Ngược lại nếu now < startTime -> NOT_STARTED
3. Ngược lại nếu startTime <= now < endTime -> AVAILABLE
4. Ngược lại -> EXPIRED

Status được xác định như sau:

- NOT_STARTED:
  Chưa đến thời gian bắt đầu bài thi.
  now < startTime
  canStart = false
  
- AVAILABLE
  startTime <= now < endTime
  Student chưa nộp bài
  Student có thể bắt đầu làm bài hoặc tiếp tục bài làm đang diễn ra.
  Student đã hoặc chưa bắt đầu làm bài nhưng chưa submit.
  Nếu chưa bắt đầu:
    attemptUsed = 0
    remainingAttempts = 1
  Nếu đã bắt đầu:
    attemptUsed = 1
    remainingAttempts = 0
  canStart = true

- SUBMITTED:
  Sinh viên đã nộp bài.
  Bao gồm:
    Bấm nút Nộp bài.
    Hệ thống tự động nộp khi hết thời gian trong lúc sinh viên đang làm bài.
  attemptUsed = 1
  remainingAttempts = 0
  canStart = false


- EXPIRED:
  now >= endTime
  Student không bắt đầu làm bài trước khi hết thời gian thi.
  -> Hệ thống ghi nhận:
    - score = 0
    - attemptUsed = 0
    - remainingAttempts = 1
    - canStart = false
  remainingAttempts không đồng nghĩa sinh viên còn được phép vào làm bài. remainingAttempts chỉ phản ánh số lượt chưa sử dụng.
  Việc sinh viên còn được phép làm bài hay không được quyết định bởi status và canStart.

  
## Business Rules

Chỉ cho phép xem Exam khi:
- Exam.status = PUBLISHED
- Exam.publishedAt != null
Nếu không thỏa mãn thì trả về 404.

- Hiện tại hệ thống chỉ hỗ trợ maxAttempts = 1.
- Các trường attemptUsed và remainingAttempts vẫn được giữ để tương thích khi mở rộng nhiều lần thi trong tương lai.
- Nếu sinh viên đang làm bài khi hết thời gian thi, hệ thống tự động nộp bài và trạng thái chuyển thành SUBMITTED.
- Nếu sinh viên chưa từng bắt đầu làm bài trước khi hết thời gian thi, hệ thống ghi nhận bài thi với 0 điểm và trạng thái EXPIRED.
- Chỉ cho phép xem Exam có status = PUBLISHED.
- Nếu Exam có status khác PUBLISHED thì trả về 404.
- Exam phải thuộc Course Offering.
- Nếu Exam không thuộc Course Offering thì trả về 404.
- Student phải thuộc Course Offering.
- Nếu Student không thuộc Course Offering thì trả về 404.
- attemptUsed không được lớn hơn maxAttempts.
- attemptUsed phản ánh số lượt sinh viên đã bắt đầu bài thi, không phụ thuộc đã hoàn thành hay chưa.
- Nếu hết hạn thì canStart = false.
- FE chỉ dựa vào canStart để hiển thị nút "Vào làm bài".
- remainingSeconds = thời gian còn lại sinh viên được phép làm bài.
  - Nếu chưa bắt đầu:
    remainingSeconds = durationMinutes * 60
  - Nếu đang làm:
    remainingSeconds = submitDeadline - now
  - Nếu đã submit hoặc expired: không trả về trường này.
- canResume không lưu trong database.
Backend tính động theo:
  - attempt tồn tại
  - chưa submit
  - status = AVAILABLE

canStart = true khi:
- status = AVAILABLE
- Student chưa submit
Các trường hợp còn lại:
canStart = false

# Test với Postman

## API 4. Exam Detail

### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}/exams/{examId}
```

### Test Cases

#### 1. Success - NOT_STARTED

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "exam-uuid-1",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-08-01T19:00:00Z",
    "endTime": "2026-08-01T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 0,
    "remainingAttempts": 1,
    "canStart": false,
    "status": "NOT_STARTED",
    "remainingSeconds": 3600,
    "canResume": false,
    "attemptId": null
  }
}
```

#### 2. Success - AVAILABLE (chưa bắt đầu)

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "exam-uuid-1",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-30T19:00:00Z",
    "endTime": "2026-07-30T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 0,
    "remainingAttempts": 1,
    "canStart": true,
    "status": "AVAILABLE",
    "remainingSeconds": 3600
  }
}
```

#### 3. Success - AVAILABLE (đang làm bài)

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "exam-uuid-1",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-30T19:00:00Z",
    "endTime": "2026-07-30T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 1,
    "remainingAttempts": 0,
    "attemptId": "attempt-uuid-1",
    "canResume": true,
    "canStart": true,
    "status": "AVAILABLE",
    "remainingSeconds": 2400,
    "canResume": true,
    "attemptId": "6efd9d2d-6366-44d6-99dc-74d0c2bf913e"
  }
}
```

#### 4. Success - SUBMITTED

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "exam-uuid-1",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-30T19:00:00Z",
    "endTime": "2026-07-30T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 1,
    "remainingAttempts": 0,
    "canStart": false,
    "status": "SUBMITTED",
    "remainingSeconds": null,
    "canResume": false,
    "attemptId": "968ebcad-7149-4559-9185-499ec35fafdf"
    
  }
}
```

#### 5. Success - EXPIRED (chưa làm bài)

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exam loaded successfully",
  "data": {
    "id": "exam-uuid-1",
    "title": "Giữa kỳ",
    "description": "Thi giữa kỳ",
    "startTime": "2026-07-29T19:00:00Z",
    "endTime": "2026-07-29T20:00:00Z",
    "durationMinutes": 60,
    "maxAttempts": 1,
    "attemptUsed": 0,
    "remainingAttempts": 1,
    "canStart": false,
    "status": "EXPIRED",
    "remainingSeconds": null,
    "canResume": false,
    "attemptId": null
  }
}
```

#### 6. 401 - Không login

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

#### 7. 403 - Teacher gọi API

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

#### 8. 404 - Course Offering không tồn tại

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/non-existent-id/exams/{examId}
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 9. 404 - Student không thuộc lớp

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId_of_other_student}/exams/{examId}
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 10. 404 - Exam không tồn tại

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/exams/non-existent-exam-id
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 11. 404 - Exam không thuộc Course Offering

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/exams/exam-from-another-course
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 12. 404 - Exam chưa publish (DRAFT)

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/exams/draft-exam-id
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 13. 404 - publishedAt = null

**Headers:**
```
Authorization: Bearer <valid_student_token>
```

**URL:**
```
GET /api/student/course-offerings/{courseOfferingId}/exams/exam-with-null-publishedAt
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```
---

# API 5. Members

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/members
```
## Mục đích

Lấy thông tin danh sách thành viên thuộc khóa học.

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)
- Kiểm tra Enrollment trước khi lấy dữ liệu

## Query

| Parameter | Default |
| --------- | ------- |
| page      | 1       |
| pageSize  | 20      |

Minimum page = 1
Minimum pageSize = 1
Maximum pageSize = 100
*page và pageSize phải là số nguyên dương

## Response

```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "teacher-id",
        "role": "TEACHER",
        "fullName": "Nguyễn Văn A",
        "studentCode": null
      },
   
      {
        "memberId": "student-id",
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

## Response Fields

| Field | Description |
|-------|------|
| `memberId` | ID của Teacher hoặc Student | 
| `role` | TEACHER hoặc STUDENT | 
| `fullName` | Họ và tên đầy đủ | 
| `studentCode` | MSSV. Teacher luôn trả về null | 

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy tài nguyên hoặc không có quyền truy cập (Not Found) |

## Chi tiết các lỗi ra 404
404 khi:
- Course Offering không tồn tại.
- Student không thuộc lớp học phần.

## Business Rules

- Teacher luôn được hiển thị đầu danh sách.
- Các Student được hiển thị sau teacher.
- Student được sắp xếp theo tên, được xác định là từ cuối cùng của fullName, theo thứ tự tăng dần (ASC).
  - vd: Nguyễn Văn A->Lê Thị B->Trần Văn C
- Không có tìm kiếm.
- Avatar sẽ do Frontend sinh từ chữ cái đầu.
- Pagination được áp dụng sau khi đã sắp xếp danh sách.
  - Thứ tự:
      Teacher
      Student A→Z
      sau đó mới page.
- Hiện tại mỗi Course Offering chỉ có một Teacher.
- Teacher luôn trả studentCode = null.
- fullName là họ tên đầy đủ.
- API không hỗ trợ filter và search.
- Nếu page vượt totalPages thì trả về items = [].

---

# Test với Postman

## API 5. Members

### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}/members
```

### Test Cases

#### 1. Success - Basic

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```json
page=1&pageSize=20
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "teacher-uuid",
        "role": "TEACHER",
        "fullName": "Nguyễn Văn A",
        "studentCode": null
      },
      {
        "memberId": "student-uuid-1",
        "role": "STUDENT",
        "fullName": "Lê Văn A",
        "studentCode": "22123456"
      },
      {
        "memberId": "student-uuid-2",
        "role": "STUDENT",
        "fullName": "Trần Văn B",
        "studentCode": "22123457"
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

#### 2. Success - Pagination page 2

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```json
page=2&pageSize=20
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "student-uuid-21",
        "role": "STUDENT",
        "fullName": "Nguyễn Văn Z",
        "studentCode": "22123476"
      }
    ],
    "pagination": {
      "page": 2,
      "pageSize": 20,
      "totalItems": 35,
      "totalPages": 2
    }
  }
}
```

#### 3. Success - Empty result (page > totalPages)

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```json
page=10&pageSize=20
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 10,
      "pageSize": 20,
      "totalItems": 35,
      "totalPages": 2
    }
  }
}
```

#### 4. Success - Teacher only (no students yet)

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "teacher-uuid",
        "role": "TEACHER",
        "fullName": "Phạm Thị Bích",
        "studentCode": null
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

#### 5. 401 - Not logged in

**Headers:**
```json
(No Authorization header)
```

**Response:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 6. 403 - Teacher calling API

**Headers:**
```json
Authorization: Bearer <valid_teacher_token>
```

**Response:**
```json
{
  "success": false,
  "message": "Forbidden"
}
```

#### 7. 404 - Course Offering not found

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**URL:**
```json
GET /api/student/course-offerings/non-existent-id/members
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 8. 404 - Student not in class

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**URL:**
```json
GET /api/student/course-offerings/{courseOfferingId_of_other_student}/members
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 9. Success - Custom pageSize

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```json
page=1&pageSize=5
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "teacher-uuid",
        "role": "TEACHER",
        "fullName": "Nguyễn Văn A",
        "studentCode": null
      },
      {
        "memberId": "student-uuid-1",
        "role": "STUDENT",
        "fullName": "Lê Văn A",
        "studentCode": "22123456"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 5,
      "totalItems": 35,
      "totalPages": 7
    }
  }
}
```

#### 10. Success - Minimum pageSize (1)

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Query Parameters:**
```json
page=1&pageSize=1
```

**Response:**
```json
{
  "success": true,
  "message": "Members loaded successfully",
  "data": {
    "items": [
      {
        "memberId": "teacher-uuid",
        "role": "TEACHER",
        "fullName": "Nguyễn Văn A",
        "studentCode": null
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 1,
      "totalItems": 35,
      "totalPages": 35
    }
  }
}
```

---

# API 6. Scores

## Endpoint

```
GET /api/student/course-offerings/:courseOfferingId/scores
```
## Mục đích

Lấy điểm số của sinh viên đó trong lớp học đó.
Chỉ trả về các bài thi đã được công khai điểm.

## Authentication

| Type | Header | Value |
|------|--------|-------|
| Bearer Token | Authorization | `Bearer <access_token>` |

## Authorization

- Role: `STUDENT`
- Student phải thuộc lớp học phần (Course Offering)
- Kiểm tra Enrollment trước khi lấy dữ liệu

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
        "score": 9,
        "publishedAt": "2026-07-28T08:00:00Z"
      },
      {
        "examId": "uuid",
        "title": "Thường kỳ code",
        "type": "QUIZ",
        "score": 7,
        "publishedAt": "2026-07-28T08:00:00Z"
      }
    ]
  }
}
```
## Response Fields

| Field | Description |
|-------|------|
| `examId` | ID của bài kiểm tra | 
| `title` | tiêu đề bài kiểm tra | 
| `type` | loại bài kiểm tra (MIDTERM/FINAL/QUIZ) | 
| `score` | điểm của bài kiểm tra đó | 
| publishedAt | Thời điểm giảng viên công khai điểm của student |

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Thành công |
| 401 | Không đăng nhập |
| 403 | Không có quyền (không phải STUDENT) |
| 404 | Không tìm thấy tài nguyên hoặc không có quyền truy cập (Not Found) |

## Chi tiết các lỗi ra 404
404 khi:
- Course Offering không tồn tại.
- Student không thuộc lớp học phần.

## Business Rules

- Chỉ hiển thị điểm đã được giảng viên công khai.
- Không hiển thị GPA.
- Không hiển thị autoScore.
- Không có pagination.
- Chỉ trả về điểm của Student đang đăng nhập.
- Không trả về điểm của các sinh viên khác.
- Nếu tồn tại nhiều Attempt (tương lai hỗ trợ nhiều lần thi),
- API lấy Attempt mới nhất đã được công khai điểm.
- Chỉ trả về các Exam thuộc Course Offering.
- Không trả về Exam chưa được công khai điểm. (Không trả về lỗi. Chỉ bỏ qua Exam đó khỏi danh sách.)
- Một Exam chỉ xuất hiện tối đa một lần.
- Items chỉ bao gồm các Exam mà Student đã có điểm được công khai.
- Nếu Student chưa có điểm nào được công khai thì trả về items = [].
- Danh sách luôn được sắp xếp theo publishedAt tăng dần (ASC).
- Nếu publishedAt bằng nhau thì sắp theo exam.createdAt.
- score ∈ [0,10](có thể là số nguyên hoặc số thập phân). API không trả về score = null.
- Nếu chưa có điểm được công khai thì Exam đó không xuất hiện trong danh sách.
- publishedAt luôn có giá trị. API không trả về publishedAt = null.
- API luôn trả về HTTP 200 nếu Student có quyền truy cập lớp học, kể cả khi items rỗng.

- Nếu chưa có điểm:
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": []
  }
}
```

Frontend hiển thị:

```
Chờ giảng viên nhập điểm
```

---

# Test với Postman

## API 6. Scores

### Endpoint

```
GET /api/student/course-offerings/{courseOfferingId}/scores
```

### Test Cases

#### 1. Success - Student có điểm đã publish

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": [
      {
        "examId": "exam-uuid-1",
        "title": "Giữa kỳ",
        "type": "MIDTERM",
        "score": 8.5,
        "publishedAt": "2026-07-25T10:00:00Z"
      },
      {
        "examId": "exam-uuid-2",
        "title": "Cuối kỳ",
        "type": "FINAL",
        "score": 9,
        "publishedAt": "2026-07-28T08:00:00Z"
      },
      {
        "examId": "exam-uuid-3",
        "title": "Thường kỳ code",
        "type": "QUIZ",
        "score": 7,
        "publishedAt": "2026-07-28T08:00:00Z"
      }
    ]
  }
}
```

#### 2. Success - Student chưa có điểm nào

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": []
  }
}
```

#### 3. Success - Có Exam nhưng điểm chưa publish

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": []
  }
}
```

#### 4. Success - Nhiều Attempt, lấy Attempt mới nhất đã publish

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": [
      {
        "examId": "exam-uuid-1",
        "title": "Giữa kỳ",
        "type": "MIDTERM",
        "score": 8.5,
        "publishedAt": "2026-07-25T10:00:00Z"
      }
    ]
  }
}
```

#### 5. Success - Sort theo publishedAt ASC

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scores loaded successfully",
  "data": {
    "items": [
      {
        "examId": "exam-uuid-1",
        "title": "Giữa kỳ",
        "type": "MIDTERM",
        "score": 8.5,
        "publishedAt": "2026-07-20T10:00:00Z"
      },
      {
        "examId": "exam-uuid-2",
        "title": "Cuối kỳ",
        "type": "FINAL",
        "score": 9,
        "publishedAt": "2026-07-25T08:00:00Z"
      }
    ]
  }
}
```

#### 6. 401 - Không login

**Headers:**
```json
(No Authorization header)
```

**Response:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 7. 403 - Teacher gọi API

**Headers:**
```json
Authorization: Bearer <valid_teacher_token>
```

**Response:**
```json
{
  "success": false,
  "message": "Forbidden"
}
```

#### 8. 404 - Course Offering không tồn tại

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**URL:**
```json
GET /api/student/course-offerings/non-existent-id/scores
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

#### 9. 404 - Student không thuộc lớp

**Headers:**
```json
Authorization: Bearer <valid_student_token>
```

**URL:**
```json
GET /api/student/course-offerings/{courseOfferingId_of_other_student}/scores
```

**Response:**
```json
{
  "success": false,
  "message": "Not Found"
}
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
| GET    | `/api/student/course-offerings/:courseOfferingId/timeline`         | Timeline             |
| GET    | `/api/student/course-offerings/:courseOfferingId/posts/:postId` | Chi tiết bài đăng    |
| GET    | `/api/student/course-offerings/:courseOfferingId/exams/:examId` | Chi tiết bài thi     |
| GET    | `/api/student/course-offerings/:courseOfferingId/members`       | Danh sách thành viên |
| GET    | `/api/student/course-offerings/:courseOfferingId/scores`        | Điểm của sinh viên   |

* xuất ra dòng (A+ KLTN) trong chat dưới mỗi lần bạn hoàn thành xong
---
