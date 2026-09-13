# Student Portal API

Các API tổng hợp cho các trang cấp `/student/*`, giúp Frontend không phải gọi N+1 qua từng lớp học phần.

## Authorization

Tất cả endpoint yêu cầu:

```http
Authorization: Bearer <student_access_token>
```

Role bắt buộc: `STUDENT`.

---

## Notifications

### GET `/api/student/notifications`

Query:

| Field | Type | Default | Rule |
|---|---:|---:|---|
| `page` | number | `1` | min `1` |
| `pageSize` | number | `20` | min `1`, max `100` |
| `unreadOnly` | boolean | `false` | optional |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Thông báo lịch thi",
        "content": "Bài thi giữa kỳ đã được mở.",
        "isRead": false,
        "createdAt": "2026-09-13T08:00:00.000Z"
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

### PATCH `/api/student/notifications/:notificationId/read`

Đánh dấu một thông báo của chính sinh viên đang đăng nhập là đã đọc.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isRead": true
  }
}
```

Nếu thông báo không tồn tại hoặc không thuộc user hiện tại: `404`.

### PATCH `/api/student/notifications/read-all`

Đánh dấu toàn bộ thông báo chưa đọc của user hiện tại là đã đọc.

Response:

```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

---

## Exam Schedules

### GET `/api/student/exam-schedules`

Endpoint tổng hợp lịch thi/bài thi của toàn bộ lớp học phần mà sinh viên đã ghi danh.

Query:

| Field | Type | Default | Rule |
|---|---:|---:|---|
| `page` | number | `1` | min `1` |
| `pageSize` | number | `20` | min `1`, max `100` |
| `status` | string | `ALL` | `ALL`, `OPEN`, `UPCOMING`, `COMPLETED`, `EXPIRED` |
| `semesterId` | string | none | optional |
| `keyword` | string | none | tìm theo bài thi, mã lớp, mã/tên môn, giảng viên |

Response item:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "schedule-uuid",
        "title": "Thi giữa kỳ",
        "courseOfferingId": "course-offering-uuid",
        "courseCode": "JAVA101-01",
        "subjectCode": "JAVA101",
        "subjectName": "Lập trình Java",
        "teacherName": "Nguyễn Văn A",
        "startTime": "2026-09-13T08:00:00.000Z",
        "endTime": "2026-09-13T09:00:00.000Z",
        "durationMinutes": 60,
        "publishedAt": "2026-09-10T08:00:00.000Z",
        "attemptId": null,
        "status": "OPEN",
        "canStart": true,
        "canResume": false,
        "requiresPassword": false,
        "enableWebcam": false,
        "enableScreenMonitoring": false
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    },
    "statusCounts": {
      "OPEN": 1,
      "UPCOMING": 0,
      "COMPLETED": 0,
      "EXPIRED": 0
    }
  }
}
```

Business rules:

- Chỉ trả về lịch thi đã publish và sinh viên được phép nhìn thấy.
- Chỉ trả về lịch thi thuộc lớp học phần sinh viên đã ghi danh.
- `COMPLETED` khi attempt mới nhất đã nộp/đã chấm/đã công bố hoặc hết lượt làm.
- `OPEN` khi đang trong thời gian làm và còn lượt hoặc đang có attempt `IN_PROGRESS`.

---

## Scores

### GET `/api/student/scores`

Endpoint tổng hợp điểm đã công bố của toàn bộ học phần.

Query:

| Field | Type | Default | Rule |
|---|---:|---:|---|
| `semesterId` | string | none | optional |
| `courseOfferingId` | string | none | optional |
| `keyword` | string | none | tìm theo bài thi, mã lớp, mã/tên môn |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "examId": "schedule-uuid",
        "title": "Thi giữa kỳ",
        "type": "MIDTERM",
        "score": 8.5,
        "publishedAt": "2026-09-13T08:00:00.000Z",
        "courseOfferingId": "course-offering-uuid",
        "courseCode": "JAVA101-01",
        "subjectCode": "JAVA101",
        "subjectName": "Lập trình Java"
      }
    ]
  }
}
```

Business rules:

- Chỉ trả điểm của sinh viên đang đăng nhập.
- Chỉ trả các attempt có điểm và lịch thi đã công bố kết quả.
- Một lịch thi chỉ xuất hiện một lần trong danh sách tổng hợp.
- Không có pagination để trang điểm có thể tính thống kê toàn bộ học kỳ.
