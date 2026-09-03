# Student Dashboard API

## Mục đích

Cung cấp toàn bộ dữ liệu cần thiết để render Student Dashboard trong một lần gọi API duy nhất.

Endpoint trả về:
- Lời chào cá nhân
- Thống kê tổng quan
- Dữ liệu biểu đồ điểm học tập
- Bài thi sắp diễn ra
- Thông báo mới nhất

---

## Endpoint

```
GET /api/student/dashboard
```

---

## Authorization

Bắt buộc đăng nhập. Chỉ Student mới được truy cập.

Header:
```
Authorization: Bearer <accessToken>
```

Lấy `accessToken` từ response của `POST /api/auth/login` hoặc `POST /api/auth/refresh-token`.

---

## Request

Không có request body hay query params.

`studentId` được đọc trực tiếp từ Access Token (`profileId` trong payload JWT) — không truyền qua URL hay body.

---

## Response

### Thành công `200 OK`

```json
{
  "success": true,
  "message": "Dashboard loaded successfully",
  "data": {
    "greeting": {
      "fullName": "Nguyen Van An"
    },
    "stats": {
      "subjectCount": 5,
      "examCount": 8,
      "gpa": 8.42,
      "upcomingExamCount": 2
    },
    "analytics": [
      {
        "subjectName": "Lập trình Java",
        "myScore": 8.5,
        "classAverage": 7.3
      }
    ],
    "upcomingExams": [
      {
        "id": "uuid",
        "title": "Lập trình Java - Giữa kỳ",
        "subjectName": "Lập trình Java",
        "startTime": "2026-07-17T06:30:00.000Z",
        "endTime": "2026-07-17T08:30:00.000Z",
        "durationMinutes": 60
      }
    ],
    "notifications": [
      {
        "id": "uuid",
        "title": "Có điểm mới",
        "content": "Điểm thi môn Java đã được công bố.",
        "isRead": false,
        "createdAt": "2026-07-01T07:00:00.000Z"
      }
    ]
  }
}
```

---

## Giải thích từng field

### `greeting`

| Field | Type | Mô tả |
|---|---|---|
| `fullName` | string | Tên đầy đủ của sinh viên lấy từ bảng `User` |

### `stats`

| Field | Type | Mô tả |
|---|---|---|
| `subjectCount` | number | Số môn học khác nhau student đã được ghi danh |
| `examCount` | number | Tổng số bài thi thuộc các lớp học phần của student |
| `gpa` | number \| null | GPA tính từ điểm các bài thi đã nộp, quy đổi về thang 10. `null` nếu chưa có bài thi nào được chấm |
| `upcomingExamCount` | number | Số bài thi sắp diễn ra mà student được phép nhìn thấy |

### `analytics`

Mỗi item đại diện cho một môn học có điểm.

| Field | Type | Mô tả |
|---|---|---|
| `subjectName` | string | Tên môn học |
| `myScore` | number | Điểm trung bình của student ở môn này, quy đổi thang 10, làm tròn 2 chữ số thập phân |
| `classAverage` | number | Điểm trung bình của toàn bộ sinh viên trong lớp ở môn này, thang 10 |

Trả về `[]` nếu student chưa có bài thi nào được chấm.

### `upcomingExams`

Sắp xếp theo `startTime` tăng dần. Tối đa 5 bài thi.

| Field | Type | Mô tả |
|---|---|---|
| `id` | string | UUID của bài thi |
| `title` | string | Tiêu đề bài thi |
| `subjectName` | string | Tên môn học |
| `startTime` | ISO 8601 | Thời điểm bắt đầu |
| `endTime` | ISO 8601 | Thời điểm kết thúc |
| `durationMinutes` | number | Thời lượng làm bài (phút) |

Trả về `[]` nếu không có bài thi sắp diễn ra.

### `notifications`

Sắp xếp mới nhất trước. Tối đa 10 thông báo.

| Field | Type | Mô tả |
|---|---|---|
| `id` | string | UUID của thông báo |
| `title` | string | Tiêu đề |
| `content` | string | Nội dung |
| `isRead` | boolean | Đã đọc hay chưa |
| `createdAt` | ISO 8601 | Thời điểm tạo |

Trả về `[]` nếu không có thông báo.

---

## Business Rules

- `subjectCount`: đếm số subject khác nhau từ tất cả enrollments của student.
- `examCount`: đếm số ExamSchedule student được phép nhìn thấy từ tất cả course offerings student đã enrolled.
- `gpa`: tính bằng `(totalScore / tổng điểm tối đa của đề thi) * 10`, lấy trung bình tất cả bài thi đã nộp có `status = SUBMITTED`.
- `upcomingExams`: chỉ lấy ExamSchedule có `publishedAt != null`, `status = SCHEDULED`, `startTime > now`, và Exam có `status in READY/LOCKED`.
- `analytics.classAverage`: tính từ tất cả attempt SUBMITTED của tất cả sinh viên trong các lớp liên quan đến môn đó.
- Dashboard luôn trả về `200 OK` dù student chưa có dữ liệu — các array rỗng `[]`, số về `0`, GPA về `null`.

---

## Các lỗi có thể xảy ra

| Status | Message | Nguyên nhân |
|---|---|---|
| `401` | Missing or invalid authorization header | Không có Bearer token |
| `401` | Token has been revoked | Token đã bị blacklist sau logout |
| `403` | Student access required | Token hợp lệ nhưng role không phải STUDENT |
| `404` | Student not found | profileId trong token không tồn tại trong DB |
| `500` | Internal server error | Lỗi không mong đợi |

---

## Ví dụ Postman

**1. Login lấy token**

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "identifier": "SV000001",
  "password": "123456"
}
```

Lấy `accessToken` từ response.

**2. Gọi Dashboard**

```
GET http://localhost:3000/api/student/dashboard
Authorization: Bearer <accessToken>
```

---

## Hướng dẫn Frontend sử dụng

```typescript
// Gọi API sau khi đã có accessToken trong Zustand store
const response = await apiClient.get('/student/dashboard')
const dashboard = response.data.data

// Greeting
dashboard.greeting.fullName

// Stats cards
dashboard.stats.subjectCount
dashboard.stats.examCount
dashboard.stats.gpa        // null nếu chưa có điểm
dashboard.stats.upcomingExamCount

// Chart data
dashboard.analytics.map(item => ({
  subject: item.subjectName,
  studentScore: item.myScore,
  classAverage: item.classAverage,
}))

// Upcoming exams list
dashboard.upcomingExams.map(exam => ({
  title: exam.title,
  date: new Date(exam.startTime).toLocaleDateString('vi-VN'),
  time: new Date(exam.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
}))

// Notifications
dashboard.notifications // isRead để đánh dấu badge chưa đọc
```

`apiClient` tự động đính kèm Bearer token thông qua axios interceptor đã cấu hình sẵn.
