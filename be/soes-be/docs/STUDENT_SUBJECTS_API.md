# Student Subjects API

## Mục đích

Trả về danh sách môn học mà sinh viên đã đăng ký trong một học kỳ, kèm theo danh sách học kỳ để Frontend render dropdown. Một lần gọi API duy nhất đủ để render toàn bộ trang.

---

## Endpoint

```
GET /api/student/subjects
```

---

## Authorization

Bắt buộc đăng nhập. Chỉ Student mới được truy cập.

```
Authorization: Bearer <accessToken>
```

---

## Query Parameters

| Parameter    | Type    | Required | Default | Mô tả |
|---|---|---|---|---|
| `page`       | integer | No       | `1`     | Trang hiện tại (min: 1) |
| `pageSize`   | integer | No       | `12`    | Số item mỗi trang (min: 1, max: 100) |
| `semesterId` | string  | No       | —       | Lọc theo học kỳ. Nếu không truyền thì lấy học kỳ hiện tại |
| `keyword`    | string  | No       | —       | Tìm kiếm theo tên môn học (không phân biệt hoa thường) |

---

## Response

### Thành công `200 OK`

```json
{
  "success": true,
  "message": "Student subjects loaded successfully",
  "data": {
    "items": [
      {
        "courseOfferingId": "uuid",
        "subjectId": "uuid",
        "subjectCode": "JAVA101",
        "subjectName": "Lập trình Java",
        "teacherName": "Tran Thi Bich",
        "materialCount": 3,
        "examCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "totalItems": 5,
      "totalPages": 1
    },
    "semesterOptions": [
      { "id": "uuid", "name": "Học kỳ 1 - 2025/2026" },
      { "id": "uuid", "name": "Học kỳ 2 - 2025/2026" }
    ],
    "currentSemesterId": "uuid"
  }
}
```

---

## Giải thích từng field

### `items[]`

| Field | Mô tả |
|---|---|
| `courseOfferingId` | ID của lớp học phần (dùng để gọi các API con) |
| `subjectId` | ID môn học |
| `subjectCode` | Mã môn học (ví dụ: JAVA101) |
| `subjectName` | Tên môn học |
| `teacherName` | Tên giảng viên phụ trách lớp |
| `materialCount` | Số tài liệu đã tải lên trong lớp |
| `examCount` | Số bài thi trong lớp mà student được phép nhìn thấy |

### `pagination`

| Field | Mô tả |
|---|---|
| `page` | Trang hiện tại |
| `pageSize` | Số item mỗi trang |
| `totalItems` | Tổng số môn học thỏa điều kiện |
| `totalPages` | Tổng số trang |

### `semesterOptions`

Danh sách các học kỳ mà sinh viên có đăng ký ít nhất một môn. Dùng để render dropdown lọc học kỳ ở Frontend.

### `currentSemesterId`

ID học kỳ đang được hiển thị. Là học kỳ được truyền qua `semesterId`, hoặc học kỳ hiện tại nếu không truyền. `null` nếu không tìm thấy học kỳ nào.

---

## Business Rules

- Chỉ trả về môn học mà sinh viên đã được ghi danh (`Enrollment`).
- Không truyền `semesterId` → lấy học kỳ có `status = ACTIVE`, nếu không có thì lấy học kỳ gần nhất.
- Tìm kiếm `keyword` chỉ theo `subject.name`, không phân biệt hoa thường.
- Kết quả sắp xếp A → Z theo tên môn học.
- `semesterOptions` luôn trả về danh sách học kỳ thật — không hardcode.
- `examCount` chỉ đếm ExamSchedule có `publishedAt != null`, `status in SCHEDULED/OPEN/CLOSED`, và Exam có `status in READY/LOCKED`.

---

## Các lỗi có thể xảy ra

| Status | Message | Nguyên nhân |
|---|---|---|
| `401` | Missing or invalid authorization header | Không có Bearer token |
| `403` | Student access required | Role không phải STUDENT |
| `404` | Semester not found | `semesterId` truyền lên không tồn tại |
| `422` | Validation failed | Query param không hợp lệ (ví dụ `page=0`, `semesterId` không phải UUID) |

---

## Ví dụ Request (Postman)

### 1. Default — lấy học kỳ hiện tại

```
GET /api/student/subjects
Authorization: Bearer <token>
```

### 2. Search theo tên môn

```
GET /api/student/subjects?keyword=java
Authorization: Bearer <token>
```

### 3. Filter theo học kỳ

```
GET /api/student/subjects?semesterId=<uuid>
Authorization: Bearer <token>
```

### 4. Pagination

```
GET /api/student/subjects?page=2&pageSize=5
Authorization: Bearer <token>
```

### 5. Không có dữ liệu (keyword không khớp)

```
GET /api/student/subjects?keyword=xyzxyz
Authorization: Bearer <token>
```

Response:
```json
{
  "data": {
    "items": [],
    "pagination": { "page": 1, "pageSize": 12, "totalItems": 0, "totalPages": 1 },
    "semesterOptions": [...],
    "currentSemesterId": "uuid"
  }
}
```

### 6. semesterId không tồn tại

```
GET /api/student/subjects?semesterId=00000000-0000-0000-0000-000000000000
Authorization: Bearer <token>
```

Response `404`:
```json
{ "success": false, "message": "Semester not found" }
```

---

## Hướng dẫn Frontend sử dụng

```typescript
// Gọi lần đầu — lấy học kỳ hiện tại
const res = await apiClient.get('/student/subjects')
const { items, pagination, semesterOptions, currentSemesterId } = res.data.data

// Render dropdown từ semesterOptions
// Mặc định chọn currentSemesterId

// Filter theo học kỳ khác
const res2 = await apiClient.get('/student/subjects', {
  params: { semesterId: selectedSemesterId }
})

// Search + phân trang
const res3 = await apiClient.get('/student/subjects', {
  params: { keyword: 'java', page: 1, pageSize: 12 }
})
```
