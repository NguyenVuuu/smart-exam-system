# Teacher Mobile Portal Implementation Plan

> **For Codex:** Implement task-by-task. Verify and create exactly one commit after each task before continuing.

**Goal:** Xây dựng cổng mobile cho giảng viên bằng API backend hiện có, ưu tiên thao tác xem và xử lý nhanh: xem đề, duyệt đề, CRUD nhóm duyệt, ngân hàng câu hỏi trắc nghiệm và sinh câu hỏi AI.

**Architecture:** Expo Router chỉ định tuyến. Mỗi feature tách `api`, `types`, `hooks`, `screens`, `components`, `schemas`; component trình bày không gọi API. Mobile dùng chung REST API, token và nghiệp vụ với web; backend luôn quyết định quyền cuối cùng.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19, Expo Router, TypeScript, NativeWind, Zustand, Axios, `lucide-react-native`, `react-native-svg`, `expo-document-picker`.

---

## Phạm vi đã chốt

Triển khai:

1. Khung ứng dụng và menu giảng viên dùng chung với sinh viên.
2. Dashboard, lớp học phần, bài viết đơn giản và lịch coi thi.
3. Xem đầy đủ đề thi; duyệt hoặc yêu cầu sửa theo từng câu.
4. Xem và CRUD nhóm duyệt khi `canManage=true`.
5. Ngân hàng câu hỏi cá nhân.
6. Tạo/chỉnh sửa thủ công câu một đáp án, nhiều đáp án và đúng/sai.
7. Gửi câu hỏi vào ngân hàng chung và duyệt câu hỏi theo quyền.
8. Sinh câu hỏi AI trắc nghiệm từ tài liệu lớp hoặc tệp tải lên.
9. Thông báo, deep link, hồ sơ và đăng xuất.

Không triển khai:

- Tạo/chỉnh sửa câu hỏi lập trình hoặc test case trên mobile.
- Tạo/chỉnh sửa toàn bộ đề thi, sinh đề tự động hoặc tạo ca thi.
- Giám sát nhiều camera/màn hình realtime.
- Chấm hàng loạt, chốt điểm, xuất bảng điểm hoặc nghiệp vụ backoffice.

## Quy tắc kỹ thuật

- Route trong `app/` không quá 20 dòng và không chứa API call.
- Screen mục tiêu dưới 120 dòng; presentational component dưới 100 dòng.
- Không `any`, emoji icon hoặc SVG viết trực tiếp; dùng `lucide-react-native`.
- Danh sách dài dùng `FlatList`, refresh và phân trang nếu API hỗ trợ.
- Mỗi màn có loading, empty, error và retry.
- Mutation có xác nhận, loading, chống bấm lặp và thông báo kết quả.
- Chỉ ẩn action ở UI là chưa đủ; mọi quyền phải được backend kiểm tra.
- Không cache offline hoặc log nội dung đề, đáp án và dữ liệu duyệt nhạy cảm.
- Câu hỏi tạo thủ công và AI trên mobile chỉ là trắc nghiệm.
- Trước mỗi commit chạy `npx tsc --noEmit`, `npx expo lint` và `git diff --check`.
- Chỉ stage file của task hiện tại; không dùng `git add .`.

---

### Task 1: Ổn định API client và dependency

**Files:** `src/api/client.ts`, `.env.example`, `package.json`, `package-lock.json`, `src/utils/role.ts`.

**Work:**

- Hoàn thiện `EXPO_PUBLIC_API_URL`, timeout, refresh token và lỗi mất kết nối.
- Không hard-code IP hoặc secret trong source.
- Cài `lucide-react-native`, `expo-document-picker` bằng `npx expo install`.
- Sửa nhãn `DEPARTMENT_HEAD` thành `Trưởng bộ môn`.
- Chạy Expo Doctor, dependency check, typecheck và lint.

**Done:** Đăng nhập từ thiết bị thật bằng URL `.env`; dependency tương thích SDK 58.

```bash
git add mobile/soes-mobile/src/api/client.ts mobile/soes-mobile/.env.example mobile/soes-mobile/package.json mobile/soes-mobile/package-lock.json mobile/soes-mobile/src/utils/role.ts
git commit -m "chore(mobile): stabilize api and teacher dependencies"
```

### Task 2: Portal shell và icon dùng chung

**Create:** `src/components/layout/PortalLayout.tsx`, `PortalSidebar.tsx`, `PortalTopBar.tsx`, `PortalUserFooter.tsx`, `src/navigation/navigation.types.ts`, `student-navigation.ts`, `teacher-navigation.ts`.

**Modify:** `src/components/student/StudentLayout.tsx`, `StudentSidebar.tsx`, `StudentTopBar.tsx`.

**Work:** Trích shell dùng chung, menu dạng data, Lucide icon, safe area và tự đóng sidebar sau điều hướng.

**Done:** Sinh viên và giảng viên dùng chung shell; navigation không còn emoji.

```bash
git add mobile/soes-mobile/src/components/layout mobile/soes-mobile/src/navigation mobile/soes-mobile/src/components/student
git commit -m "refactor(mobile): add reusable portal shell"
```

### Task 3: Route giảng viên, quyền menu và UI primitives

**Create:** `app/(app)/(teacher)/_layout.tsx`, `src/features/teacher/navigation/*`, `src/components/ui/{ScreenHeader,StatusBadge,SearchField,ScreenState,ConfirmSheet,SectionCard}.tsx`, `src/utils/date.ts`, `src/utils/status.ts`.

**Work:**

- Bảo vệ route cho `TEACHER`, `DEPARTMENT_HEAD`.
- Gọi `GET /teacher/review-group/access`; dựng menu theo quyền.
- Chuẩn hóa loading/error/empty/retry, badge, search, confirm sheet và ngày giờ.

**Done:** Menu không nhấp nháy mục bị cấm; primitives tái sử dụng được.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)" mobile/soes-mobile/src/features/teacher/navigation mobile/soes-mobile/src/components/ui mobile/soes-mobile/src/utils
git commit -m "feat(mobile): add teacher routing and ui primitives"
```

### Task 4: Dashboard giảng viên

**Create:** `src/features/teacher/dashboard/{api,types,useTeacherDashboard}.ts`, screen và các component thống kê/công việc/lịch gần nhất.

**Modify:** `app/(app)/(teacher)/dashboard.tsx`.

**Work:** Tải song song lớp, đề, ca coi thi, thông báo và đề chờ duyệt; mỗi khối xử lý lỗi độc lập; có refresh và quick action.

**Done:** Dashboard hữu ích trên màn hình nhỏ, route chỉ render screen.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/dashboard.tsx" mobile/soes-mobile/src/features/teacher/dashboard
git commit -m "feat(mobile): add teacher dashboard"
```

### Task 5: Xem lớp học phần phụ trách

**Create:** routes `courses/index.tsx`, `courses/[courseOfferingId].tsx`; feature `teacher/courses` gồm API, types, hooks, screens, card và tabs.

**API:** `GET /teacher/course-offerings`, `/:id`, `/:id/students`, `/:id/exams`.

**Work:** Danh sách tìm kiếm/lọc; chi tiết có Tổng quan, Sinh viên, Tài liệu, Bài viết, Đề thi; tải tab khi mở và phân trang sinh viên.

**Done:** Chỉ xem được lớp backend cho phép, không tải dư dữ liệu.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/courses" mobile/soes-mobile/src/features/teacher/courses
git commit -m "feat(mobile): add teacher course views"
```

### Task 6: Bài viết lớp học phần đơn giản

**Modify/Create:** `teacher/courses/api.ts`, types, `CoursePostList.tsx`, `CoursePostComposer.tsx`, course detail screen.

**API:** create/update/pin/status/delete post endpoints hiện có.

**Work:** Tạo/sửa bài viết văn bản ngắn, ghim, ẩn/hiện, xóa có xác nhận. Không rich text hoặc upload nhiều tệp.

**Done:** Giảng viên đăng thông báo ngắn cho lớp mà không cần mở web.

```bash
git add mobile/soes-mobile/src/features/teacher/courses
git commit -m "feat(mobile): add simple course post management"
```

### Task 7: Danh sách và trình xem đầy đủ đề thi

**Create:** routes `exams/index.tsx`, `exams/[examId].tsx`; feature `teacher/exams` gồm API, hooks, screens, `ExamCard`, `ExamSummary`, `ExamQuestionCard`, `ProgrammingQuestionViewer`.

**API:** `GET /teacher/exams`, `/:id`, `/:id/review-history`, `/:id/schedules`.

**Work:**

- Lọc đề theo trạng thái/loại.
- Chi tiết có Tổng quan, Câu hỏi, Lịch sử duyệt, Ca thi.
- Hiển thị ảnh, đáp án, lời giải, điểm và test case theo quyền.
- Câu lập trình chỉ xem, code hỗ trợ cuộn ngang.
- Không lưu đề/đáp án vào AsyncStorage.

**Done:** Xem đầy đủ đề trên mobile nhưng không có editor đề.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/exams" mobile/soes-mobile/src/features/teacher/exams
git commit -m "feat(mobile): add secure exam viewer"
```

### Task 8: Duyệt đề và yêu cầu sửa theo từng câu

**Create:** routes `approvals/index.tsx`, `approvals/[approvalId].tsx`; feature `teacher/approvals` với API, hooks, screens, question card, note sheet và sticky action bar.

**API:** list/detail/approve/reject trong `/teacher/exam-approvals`.

**Work:**

- Icon góp ý từng câu mở bottom sheet nhập note.
- `Yêu cầu sửa` chỉ bật khi có note; khi bấm chỉ hỏi xác nhận, không nhập lý do chung.
- `Duyệt đề` có xác nhận; khóa thao tác khi request chạy.
- Thành công cập nhật danh sách chờ và dashboard.

**Done:** Payload `questionNotes` đúng; không gửi trùng; backend chặn người ngoài nhóm.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/approvals" mobile/soes-mobile/src/features/teacher/approvals
git commit -m "feat(mobile): add per-question exam approval"
```

### Task 9: CRUD nhóm duyệt đề

**Create:** route `review-group.tsx`; feature `teacher/review-group` gồm API, types, hook, screen, group summary, member list, member picker và actions sheet.

**API:** `/teacher/review-group`, `/access`, `/candidates`, member và status endpoints.

**Work:**

- Thành viên thường chỉ xem; CRUD chỉ khi `canManage=true`.
- Tạo nhóm nếu chưa có, đổi tên, thêm/xóa giảng viên cùng bộ môn.
- Ngừng/kích hoạt lại thay vì xóa cứng.
- Confirm, loading, chống bấm lặp và refresh sau mutation.

**Done:** Không thêm người ngoài bộ môn; UI và backend cùng siết quyền.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/review-group.tsx" mobile/soes-mobile/src/features/teacher/review-group
git commit -m "feat(mobile): add review group management"
```

### Task 10: Ngân hàng câu hỏi cá nhân

**Create:** routes `question-bank/index.tsx`, `[questionId].tsx`; feature `teacher/question-bank` gồm API, types, hooks, list/detail screens, card và filters.

**API:** `GET /teacher/questions`, `/question-subjects`, archive/restore endpoints.

**Work:** Tìm kiếm/lọc theo môn, loại, độ khó, trạng thái; xem đáp án/lời giải/nguồn; lưu trữ/khôi phục có xác nhận. Câu lập trình chỉ xem.

**Done:** Danh sách phân trang, refresh đúng và không tải toàn bộ một lần.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/question-bank" mobile/soes-mobile/src/features/teacher/question-bank
git commit -m "feat(mobile): add personal question bank"
```

### Task 11: Tạo và chỉnh sửa câu hỏi trắc nghiệm thủ công

**Create:** routes `question-bank/create.tsx`, `[questionId]/edit.tsx`; schema, form hook, editor screen, type picker, answer editor và preview sheet.

**API:** `POST /teacher/questions`, `PUT /teacher/questions/:id`.

**Work:**

- Chỉ `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`.
- Bắt buộc nội dung, môn, độ khó, ít nhất hai phương án và đáp án đúng.
- Chặn phương án trùng, chuẩn hóa khoảng trắng, chống submit lặp.
- Một đáp án/đúng-sai có đúng một đáp án đúng; nhiều đáp án có ít nhất một.
- Không có trường lập trình hoặc test case.

**Done:** DTO khớp API web/BE; xem trước và lưu/chỉnh sửa thành công.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/question-bank" mobile/soes-mobile/src/features/teacher/question-bank
git commit -m "feat(mobile): add manual multiple-choice editor"
```

### Task 12: Gửi ngân hàng chung và duyệt câu hỏi

**Create:** routes `question-approvals/index.tsx`, `[approvalId].tsx`; feature `teacher/question-approvals` gồm API, types, hook, list/detail screens.

**Modify:** question detail screen và question bank API.

**API:** `POST /teacher/questions/:id/share`; list/approve/reject/remove trong `/teacher/question-approvals`.

**Work:**

- Gửi câu cá nhân lên ngân hàng chung sau xác nhận.
- Theo dõi chờ duyệt, đã duyệt, yêu cầu sửa, đã gỡ.
- Thành viên nhóm duyệt được duyệt/yêu cầu sửa theo quyền.
- Yêu cầu sửa mở đúng câu hỏi của tác giả để chỉnh và gửi lại.
- `share` không đồng nghĩa công bố; chỉ câu được duyệt mới vào ngân hàng chung.

**Done:** Luồng cá nhân → chờ duyệt → dùng chung nhất quán web.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/question-approvals" mobile/soes-mobile/src/features/teacher/question-approvals mobile/soes-mobile/src/features/teacher/question-bank
git commit -m "feat(mobile): add shared question approval flow"
```

### Task 13: Sinh câu hỏi AI trắc nghiệm

**Create:** route `ai-generator.tsx`; feature `teacher/ai-generator` gồm API, types, hook, wizard screen, source/config/review components.

**API:** materials, histories, source upload, generation và save-approved endpoints hiện có.

**Work:**

- Wizard Nguồn → Cấu hình → Xem câu nháp → Lưu câu được chọn.
- Nguồn từ tài liệu lớp hoặc `expo-document-picker`.
- Luôn gửi `targetQuestionType=MULTIPLE_CHOICE`; không có lựa chọn lập trình.
- Chấp nhận/từ chối và chỉnh nhẹ nội dung, phương án, đáp án.
- Chỉ câu được chấp nhận mới lưu vào ngân hàng cá nhân.
- Không persist file nguồn/nội dung AI nhạy cảm lâu dài.

**Done:** Sinh và lưu được câu AI trắc nghiệm bằng cùng API web; upload/generation có retry.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/ai-generator.tsx" mobile/soes-mobile/src/features/teacher/ai-generator
git commit -m "feat(mobile): add ai multiple-choice generation"
```

### Task 14: Lịch coi thi

**Create:** routes `invigilation/index.tsx`, `[assignmentId].tsx`; feature `teacher/invigilation` gồm API, types, hook, screens và assignment card.

**API:** `GET /teacher/proctor-assignments`.

**Work:** Chia sắp tới/đang diễn ra/đã kết thúc; lọc ngày/trạng thái; hiển thị phòng, thời gian, môn, lớp. Chỉ liên kết mở web nếu cần realtime, không triển khai WebRTC.

**Done:** Chỉ hiển thị ca được phân công và tra cứu nhanh.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/invigilation" mobile/soes-mobile/src/features/teacher/invigilation
git commit -m "feat(mobile): add teacher invigilation schedule"
```

### Task 15: Thông báo, deep link và hồ sơ

**Create:** routes `notifications.tsx`, `account.tsx`; features notifications/account; `src/navigation/notification-links.ts`.

**API:** notification list/read/read-all; `PATCH /auth/me`, `/auth/me/password`.

**Work:**

- Phân trang, đánh dấu đã đọc, đồng bộ badge.
- Thông báo đề/câu hỏi mở đúng detail hoặc approval.
- Sửa hồ sơ và đổi mật khẩu ở form riêng.
- Không lưu mật khẩu trong store/cache/log.

**Done:** Deep link đúng; auth store cập nhật sau sửa hồ sơ.

```bash
git add "mobile/soes-mobile/app/(app)/(teacher)/notifications.tsx" "mobile/soes-mobile/app/(app)/(teacher)/account.tsx" mobile/soes-mobile/src/features/teacher/notifications mobile/soes-mobile/src/features/teacher/account mobile/soes-mobile/src/navigation/notification-links.ts
git commit -m "feat(mobile): add teacher notifications and account"
```

### Task 16: QA và bàn giao

**Create:** `mobile/soes-mobile/docs/teacher-mobile-smoke-test.md`.

**Work:**

1. Chạy dependency check, Expo Doctor, typecheck và lint.
2. Loại bỏ `any`, emoji, API call trong route/presentational component và file quá dài.
3. Kiểm tra Android/iOS: role, menu, refresh, mất mạng, token hết hạn, logout.
4. Kiểm tra giảng viên thường, trưởng bộ môn, thành viên nhóm, người quản lý nhóm và người ngoài nhóm.
5. Kiểm tra mutation không gửi lặp khi bấm nhanh.
6. Xác nhận đề/đáp án không vào AsyncStorage hoặc log.
7. Ghi smoke test và kết quả mong đợi.

**Done:** Typecheck, lint, Expo Doctor và toàn bộ smoke test đạt.

```bash
git add mobile/soes-mobile
git commit -m "test(mobile): verify teacher portal workflows"
```

## Quy trình sau mỗi task

```bash
cd mobile/soes-mobile
npx tsc --noEmit
npx expo lint
cd ../..
git diff --check
git status --short
```

Không push sau mỗi task. Sau Task 16 mới push toàn bộ nhánh:

```bash
git push -u origin <ten-nhanh-mobile-giang-vien>
```

## Tiêu chí nghiệm thu tổng thể

- Giao diện thống nhất với cổng sinh viên, dùng Lucide icon và component tái sử dụng.
- Quyền UI khớp với backend; tài khoản trái quyền không gọi mutation thành công.
- Xem được đầy đủ đề; duyệt/yêu cầu sửa từng câu hoạt động đúng.
- CRUD nhóm duyệt chỉ khi `canManage=true`.
- Tạo thủ công và AI chỉ hỗ trợ trắc nghiệm trên mobile.
- Câu cá nhân phải qua duyệt trước khi vào ngân hàng chung.
- Không có soạn đề đầy đủ, tạo câu lập trình hoặc giám sát realtime trên mobile.
- Không có secret/IP cá nhân/mật khẩu/nội dung đề trong source, log hoặc cache không an toàn.
