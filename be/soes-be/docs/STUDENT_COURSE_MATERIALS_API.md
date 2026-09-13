# Student Course Materials API

API cho sinh viên xem và tải tài liệu học tập riêng trong bảng `Material`. API này khác với attachment của bài đăng.

## Authorization

Yêu cầu student đã đăng nhập và đã ghi danh vào lớp học phần.

```http
Authorization: Bearer <student_access_token>
```

---

## List Materials

### GET `/api/student/course-offerings/:courseOfferingId/materials`

Response:

```json
{
  "success": true,
  "message": "Materials loaded successfully",
  "data": {
    "items": [
      {
        "id": "material-uuid",
        "title": "Slide chương 1",
        "fileName": "chapter-1.pdf",
        "fileType": "PDF",
        "fileSize": "2.4 MB",
        "contentType": "application/pdf",
        "uploadedAt": "2026-09-13T08:00:00.000Z"
      }
    ]
  }
}
```

Business rules:

- Chỉ sinh viên thuộc lớp học phần được xem.
- Trả về `404` nếu lớp không tồn tại hoặc sinh viên không thuộc lớp.
- Danh sách sắp xếp theo `createdAt DESC`.
- Nếu chưa có tài liệu, trả `items: []`.

---

## Download Material

### GET `/api/student/course-offerings/:courseOfferingId/materials/:materialId`

Trả binary file với header:

```http
Content-Type: <material.contentType>
Content-Disposition: attachment; filename*=UTF-8''<encoded-file-name>
```

Business rules:

- Chỉ tải được material thuộc chính course offering trên URL.
- Trả `404` nếu material không tồn tại, không thuộc lớp, hoặc sinh viên không có quyền truy cập lớp.
