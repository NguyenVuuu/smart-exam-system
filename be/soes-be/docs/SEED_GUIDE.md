# SOES Seed Guide

## Tổng quan

Hệ thống seed được thiết kế theo hướng có thể cấu hình — không hardcode số lượng bài thi, không hardcode trạng thái. Toàn bộ cấu hình tập trung tại một file duy nhất:

```
prisma/seeds/seed.config.ts
```

---

## Cấu hình quizCount theo môn học

Trong `seed.config.ts`, thay đổi map `QUIZ_COUNT_BY_SUBJECT_CODE`:

```ts
export const QUIZ_COUNT_BY_SUBJECT_CODE: Record<string, number> = {
  JAVA101:  4,   // Java có 4 bài thường kỳ
  SQL101:   2,   // SQL có 2 bài thường kỳ
  REACT101: 3,
  AI101:    1,
  CNPM101:  3,
  CPP101:   2,
}
```

Nếu một môn không có entry, hệ thống dùng `DEFAULT_QUIZ_COUNT = 2`.

Sau khi thay đổi, chạy lại seed để cập nhật database.

---

## Seed Mode

### demo (mặc định)

Tất cả bài thi đều có trạng thái `CLOSED`. Mọi sinh viên đều có điểm cho QUIZ, MIDTERM và FINAL.

Dùng để:
- Phát triển và test Dashboard
- Demo sản phẩm

### real

Bài thi có trạng thái phản ánh thực tế:

| Loại     | Trạng thái |
|----------|------------|
| QUIZ     | CLOSED     |
| MIDTERM  | PUBLISHED  |
| FINAL    | DRAFT      |

Chỉ các bài `CLOSED` mới được sinh `ExamAttempt`.

Dùng cho:
- Môi trường staging/production
- Test flow thi thật

---

## Cách chuyển mode

### Cách 1 — Biến môi trường (khuyến nghị)

Thêm vào `.env`:

```env
SEED_MODE=demo    # hoặc real
```

### Cách 2 — Sửa trực tiếp trong `seed.config.ts`

```ts
export const SEED_MODE: SeedMode = 'demo'
```

---

## Cách seed lại database

```bash
# Chạy seed (idempotent — an toàn khi chạy nhiều lần)
npx prisma db seed

# Nếu muốn reset hoàn toàn và seed lại
npx prisma migrate reset --force
```

> Lưu ý: `migrate reset` sẽ xóa toàn bộ dữ liệu. Các tài khoản dev (`AD000001`, `GV000001`, `SV000001`,...) sẽ bị xóa và tạo lại.

---

## Cấu trúc file seed

```
prisma/
├── seed.ts                         # Entry point — gọi các seed theo thứ tự
└── seeds/
    ├── seed.config.ts              # Cấu hình tập trung (quizCount, mode)
    ├── helpers.ts                  # Utilities (hashPassword, padCode)
    ├── settings.seed.ts
    ├── semesters.seed.ts
    ├── subjects.seed.ts
    ├── admins.seed.ts
    ├── teachers.seed.ts
    ├── students.seed.ts
    ├── course-offerings.seed.ts
    ├── enrollments.seed.ts
    ├── materials.seed.ts
    ├── questions.seed.ts
    ├── exams.seed.ts               # Đọc quizCount từ seed.config.ts
    ├── exam-attempts.seed.ts       # Seed theo SEED_MODE
    ├── exam-attempt-questions.seed.ts
    ├── student-answers.seed.ts
    └── notifications.seed.ts
```

---

## Lý do thiết kế

**Tại sao tập trung config vào một file?**

Trước đây mỗi lần muốn thêm/bớt bài thi thường kỳ phải sửa nhiều chỗ (`exams.seed.ts`, `exam-attempts.seed.ts`,...). Việc này dễ gây ra lỗi không đồng nhất. Bây giờ chỉ cần sửa `seed.config.ts` là toàn bộ pipeline tự điều chỉnh.

**Tại sao QUIZ luôn là CLOSED?**

QUIZ là bài kiểm tra thường kỳ, theo nghiệp vụ đã diễn ra trong quá khứ. Chỉ MIDTERM và FINAL mới có thể ở trạng thái PUBLISHED (đang mở) hoặc DRAFT.

**Tại sao dùng hash thay vì Math.random()?**

`deterministicScore(studentId, examId)` đảm bảo điểm không thay đổi giữa các lần seed. Điều này quan trọng để test Dashboard cho ra kết quả nhất quán.
