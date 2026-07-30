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
    "status": "NOT_STARTED"
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
    "status": "SUBMITTED"
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
    "attemptId": "uuid",
    "canResume": true,
    "remainingSeconds":2400,
    "canStart": true,
    "status": "AVAILABLE"
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
    "status": "EXPIRED"
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
| GET    | `/api/student/course-offerings/:courseOfferingId/timeline`         | Timeline             |
| GET    | `/api/student/course-offerings/:courseOfferingId/posts/:postId` | Chi tiết bài đăng    |
| GET    | `/api/student/course-offerings/:courseOfferingId/exams/:examId` | Chi tiết bài thi     |
| GET    | `/api/student/course-offerings/:courseOfferingId/members`       | Danh sách thành viên |
| GET    | `/api/student/course-offerings/:courseOfferingId/scores`        | Điểm của sinh viên   |

A+ KLTN