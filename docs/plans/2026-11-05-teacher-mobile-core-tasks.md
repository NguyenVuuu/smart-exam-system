# Teacher Mobile Core Implementation Plan

**Goal:** Xây dựng giao diện mobile cho giảng viên với các chức năng cốt lõi, dùng lại API hiện có, đồng bộ bố cục với cổng sinh viên và giữ mã nguồn ngắn, rõ, dễ tái sử dụng.

**Architecture:** Route Expo Router chỉ chuyển tới màn hình feature. Mỗi feature tách `api`, `types`, `hooks`, `screens` và `components`; component giao diện không gọi API trực tiếp. Khung ứng dụng, sidebar, top bar, trạng thái tải/lỗi/rỗng và badge được dùng chung giữa sinh viên và giảng viên.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19, Expo Router, TypeScript, NativeWind, Zustand, Axios, `lucide-react-native`, `react-native-svg`.

---

## 1. Phạm vi phiên bản đầu tiên

### Chức năng triển khai

1. Dashboard giảng viên.
2. Danh sách và chi tiết lớp học phần phụ trách.
3. Danh sách và chi tiết đề thi ở chế độ xem/theo dõi.
4. Lịch coi thi được phân công.
5. Xem nhóm duyệt đề và duyệt chuyên môn khi tài khoản có quyền.
6. Thông báo.
7. Hồ sơ cá nhân và đăng xuất.

### Chưa triển khai trên mobile

- Soạn mới hoặc chỉnh sửa câu hỏi phức tạp.
- Tạo, chỉnh sửa và sinh đề tự động.
- Tạo ca thi hoặc cấu hình chống gian lận.
- Giám sát camera/màn hình realtime bằng WebRTC.
- Chấm hàng loạt, chốt điểm và xuất bảng điểm.
- Quản trị thành viên nhóm duyệt đề.

Các thao tác này tiếp tục thực hiện trên web vì biểu mẫu dài, cần màn hình lớn hoặc có rủi ro thao tác nhầm trên điện thoại.

## 2. Quy tắc kiến trúc và clean code

- File route trong `app/` không quá 20 dòng và không chứa logic nghiệp vụ.
- Screen container nên dưới 120 dòng; nếu dài hơn phải tách section hoặc component.
- Presentational component nên dưới 100 dòng và chỉ nhận dữ liệu qua props.
- Hook chỉ quản lý một luồng dữ liệu; không ghép nhiều API không liên quan.
- Hàm API chỉ gửi request và chuẩn hóa response; không điều hướng, không hiển thị thông báo.
- Không dùng `any`, emoji hoặc ký tự Unicode làm icon.
- Dùng icon import tĩnh từ `lucide-react-native`; không tạo SVG thủ công trong component.
- Danh sách dài dùng `FlatList`, có `keyExtractor`, pull-to-refresh và phân trang khi API hỗ trợ.
- Mỗi màn hình phải có đủ loading, empty, error và retry state.
- Dùng NativeWind cho style tĩnh; chỉ dùng `StyleSheet` cho giá trị động hoặc tối ưu render.
- Dùng chung formatter ngày giờ, nhãn trạng thái, màu badge và component xác nhận.
- Không sao chép type từ web nguyên khối; chỉ tạo DTO mobile đúng trường thực sự sử dụng.
- Mọi thao tác thay đổi dữ liệu phải có xác nhận, trạng thái đang xử lý và chống bấm lặp.

## 3. Cấu trúc thư mục mục tiêu

```text
mobile/soes-mobile/
├── app/(app)/(teacher)/
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   ├── courses/
│   │   ├── index.tsx
│   │   └── [courseOfferingId].tsx
│   ├── exams/
│   │   ├── index.tsx
│   │   └── [examId].tsx
│   ├── invigilation/
│   │   ├── index.tsx
│   │   └── [assignmentId].tsx
│   ├── approvals/
│   │   ├── index.tsx
│   │   └── [approvalId].tsx
│   ├── review-group.tsx
│   ├── notifications.tsx
│   └── account.tsx
└── src/
    ├── components/
    │   ├── layout/
    │   └── ui/
    ├── navigation/
    ├── features/teacher/
    │   ├── dashboard/
    │   ├── courses/
    │   ├── exams/
    │   ├── invigilation/
    │   ├── approvals/
    │   ├── review-group/
    │   ├── notifications/
    │   └── account/
    └── utils/
```

Mỗi feature có thể chứa `api.ts`, `types.ts`, `hooks/`, `screens/` và `components/`. Không tạo thư mục rỗng trước khi feature cần dùng.

---

### Task 1: Ổn định nền tảng mobile và thư viện icon

**Files:**
- Modify: `mobile/soes-mobile/package.json`
- Modify: `mobile/soes-mobile/nativewind-env.d.ts`
- Modify: `mobile/soes-mobile/src/types/course-detail.types.ts`
- Modify: `mobile/soes-mobile/app/(app)/(student)/course/[courseOfferingId]/exam/[scheduleId].tsx`
- Modify: `mobile/soes-mobile/src/utils/role.ts`

**Steps:**

1. Cài `lucide-react-native` bằng `npx expo install lucide-react-native`; giữ `react-native-svg` đúng phiên bản Expo SDK 58.
2. Bổ sung khai báo type cho import `global.css`.
3. Sửa các lỗi TypeScript hiện tại liên quan `ExamDetail` và ánh xạ trạng thái bài thi.
4. Sửa nhãn `DEPARTMENT_HEAD` thành `Trưởng bộ môn`.
5. Chạy `npx expo install --check`, `npx expo-doctor` và `npx tsc --noEmit`.

**Done when:** TypeScript không còn lỗi nền; ứng dụng sinh viên vẫn mở được; icon Lucide render trên Expo Go.

**Commit:**

```bash
git commit -m "chore(mobile): prepare teacher portal foundation"
```

### Task 2: Tạo khung giao diện dùng chung và thay emoji bằng icon

**Files:**
- Create: `mobile/soes-mobile/src/components/layout/PortalLayout.tsx`
- Create: `mobile/soes-mobile/src/components/layout/PortalSidebar.tsx`
- Create: `mobile/soes-mobile/src/components/layout/PortalTopBar.tsx`
- Create: `mobile/soes-mobile/src/components/layout/PortalUserFooter.tsx`
- Create: `mobile/soes-mobile/src/navigation/navigation.types.ts`
- Create: `mobile/soes-mobile/src/navigation/student-navigation.ts`
- Create: `mobile/soes-mobile/src/navigation/teacher-navigation.ts`
- Modify: `mobile/soes-mobile/src/components/student/StudentLayout.tsx`
- Modify: `mobile/soes-mobile/src/components/student/StudentSidebar.tsx`
- Modify: `mobile/soes-mobile/src/components/student/StudentTopBar.tsx`

**Steps:**

1. Trích sidebar, top bar, overlay và user footer thành component dùng chung.
2. Khai báo menu bằng data, nhận icon component từ `lucide-react-native`.
3. Giữ màu xanh, avatar, trạng thái active và cách mở/đóng menu giống phần sinh viên.
4. Thay toàn bộ emoji menu sinh viên bằng Lucide icon.
5. Sidebar đóng sau khi điều hướng trên điện thoại; trên màn hình rộng có thể giữ mở.
6. Kiểm tra tên dài, màn hình nhỏ, bàn phím và safe area.

**Done when:** Sinh viên và giảng viên dùng cùng một shell; không còn emoji trong navigation; shell không chứa logic gọi API.

**Commit:**

```bash
git commit -m "refactor(mobile): add reusable portal navigation shell"
```

### Task 3: Thiết lập route, menu và quyền truy cập giảng viên

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/_layout.tsx`
- Modify: `mobile/soes-mobile/src/navigation/teacher-navigation.ts`
- Create: `mobile/soes-mobile/src/features/teacher/navigation/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/navigation/useTeacherNavigation.ts`
- Modify: `mobile/soes-mobile/app/(app)/(teacher)/dashboard.tsx`

**Steps:**

1. Dùng `PortalLayout` cho toàn bộ route giảng viên.
2. Khai báo nhóm menu: Tổng quan, Giảng dạy, Khảo thí, Bộ môn và Tài khoản.
3. Gọi `GET /teacher/review-group/access` để chỉ hiển thị Nhóm duyệt đề/Duyệt chuyên môn khi BE cho phép.
4. Cho phép cả `TEACHER` và `DEPARTMENT_HEAD`; điều hướng role khác về đúng portal.
5. Route không được chứa API call hoặc JSX màn hình dài.

**Done when:** Menu đúng quyền, active route chính xác và không nhấp nháy mục bị cấm khi tải quyền.

**Commit:**

```bash
git commit -m "feat(mobile): add teacher portal navigation"
```

### Task 4: Tạo UI primitives và chuẩn dữ liệu dùng chung

**Files:**
- Create: `mobile/soes-mobile/src/components/ui/ScreenHeader.tsx`
- Create: `mobile/soes-mobile/src/components/ui/StatusBadge.tsx`
- Create: `mobile/soes-mobile/src/components/ui/SearchField.tsx`
- Create: `mobile/soes-mobile/src/components/ui/ScreenState.tsx`
- Create: `mobile/soes-mobile/src/components/ui/ConfirmSheet.tsx`
- Create: `mobile/soes-mobile/src/components/ui/SectionCard.tsx`
- Create: `mobile/soes-mobile/src/utils/date.ts`
- Create: `mobile/soes-mobile/src/utils/status.ts`

**Steps:**

1. Tạo loading skeleton, empty state, error state và nút retry dùng chung.
2. Tạo badge theo semantic tone thay vì truyền mã màu từ mỗi trang.
3. Tạo formatter ngày giờ theo `vi-VN` và timezone hiển thị thống nhất.
4. Tạo search field có debounce dùng lại cho lớp, đề và lịch coi thi.
5. Tạo confirm sheet cho thao tác duyệt/yêu cầu sửa/đánh dấu đã đọc.

**Done when:** Các feature sau không cần tự viết lại loading/error/empty/badge/search.

**Commit:**

```bash
git commit -m "feat(mobile): add reusable teacher ui primitives"
```

### Task 5: Dashboard giảng viên

**Files:**
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/useTeacherDashboard.ts`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/screens/TeacherDashboardScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/components/TeacherStatGrid.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/components/UpcomingInvigilationList.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/dashboard/components/PendingWorkList.tsx`
- Modify: `mobile/soes-mobile/app/(app)/(teacher)/dashboard.tsx`

**API:**
- `GET /teacher/course-offerings`
- `GET /teacher/proctor-assignments`
- `GET /teacher/exams`
- `GET /teacher/notifications`
- `GET /teacher/exam-approvals` khi có quyền duyệt

**Steps:**

1. Tải các khối độc lập song song; một khối lỗi không làm hỏng toàn màn hình.
2. Hiển thị số lớp phụ trách, đề thi, lịch coi thi sắp tới và công việc chờ duyệt.
3. Thêm danh sách lịch gần nhất và thông báo mới nhất.
4. Có pull-to-refresh và nút đi tới feature tương ứng.

**Done when:** Dashboard hữu ích trên màn hình nhỏ và screen container dưới 120 dòng.

**Commit:**

```bash
git commit -m "feat(mobile): add teacher dashboard"
```

### Task 6: Lớp học phần phụ trách

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/courses/index.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/courses/[courseOfferingId].tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/courses/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/courses/useTeacherCourses.ts`
- Create: `mobile/soes-mobile/src/features/teacher/courses/useTeacherCourseDetail.ts`
- Create: `mobile/soes-mobile/src/features/teacher/courses/screens/TeacherCoursesScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/screens/TeacherCourseDetailScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/components/CourseCard.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/components/CourseOverview.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/components/CourseStudentList.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/courses/components/CoursePostList.tsx`

**API:**
- `GET /teacher/course-offerings`
- `GET /teacher/course-offerings/:id`
- `GET /teacher/course-offerings/:id/students`

**Steps:**

1. Danh sách lớp có tìm kiếm, trạng thái, học kỳ và pull-to-refresh.
2. Chi tiết lớp chia tab Tổng quan, Sinh viên và Bài viết; tải tab khi người dùng mở.
3. Phiên bản đầu chỉ xem dữ liệu, tránh biểu mẫu upload/chỉnh sửa dài.
4. Danh sách sinh viên phân trang và không tải toàn bộ một lần.

**Done when:** Giảng viên chỉ xem được lớp mình phụ trách và các tab không lặp logic trạng thái.

**Commit:**

```bash
git commit -m "feat(mobile): add teacher course views"
```

### Task 7: Danh sách và chi tiết đề thi ở chế độ theo dõi

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/exams/index.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/exams/[examId].tsx`
- Create: `mobile/soes-mobile/src/features/teacher/exams/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/exams/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/exams/useTeacherExams.ts`
- Create: `mobile/soes-mobile/src/features/teacher/exams/useTeacherExamDetail.ts`
- Create: `mobile/soes-mobile/src/features/teacher/exams/screens/TeacherExamsScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/exams/screens/TeacherExamDetailScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/exams/components/ExamCard.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/exams/components/ExamSummary.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/exams/components/ExamScheduleList.tsx`

**API:**
- `GET /teacher/exams`
- `GET /teacher/exams/:id`
- `GET /teacher/exams/:id/review-history`
- `GET /teacher/exams/:id/schedules`

**Steps:**

1. Danh sách có tìm kiếm và lọc loại/trạng thái.
2. Chi tiết hiển thị thông tin, cấu trúc câu hỏi tóm tắt, lịch sử duyệt và các ca thi.
3. Không đưa trình soạn đề vào mobile.
4. Chỉ hiển thị action thực sự an toàn và đã có quyền từ BE.

**Done when:** Mobile theo dõi được vòng đời đề mà không sao chép editor của web.

**Commit:**

```bash
git commit -m "feat(mobile): add teacher exam tracking"
```

### Task 8: Lịch coi thi

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/invigilation/index.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/invigilation/[assignmentId].tsx`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/useInvigilationAssignments.ts`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/screens/InvigilationListScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/screens/InvigilationDetailScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/invigilation/components/AssignmentCard.tsx`

**API:**
- `GET /teacher/proctor-assignments`

**Steps:**

1. Hiển thị lịch sắp tới, đang diễn ra và đã kết thúc.
2. Có lọc theo trạng thái/ngày và thông tin phòng, thời gian, môn, lớp.
3. Chi tiết chỉ cung cấp thông tin ca thi và đường dẫn mở trang web giám sát nếu cần.
4. Không triển khai WebRTC trong task này.

**Done when:** Giảng viên tra cứu lịch nhanh, không nhìn thấy ca không được phân công.

**Commit:**

```bash
git commit -m "feat(mobile): add invigilation schedule"
```

### Task 9: Nhóm duyệt đề và duyệt chuyên môn

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/review-group.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/approvals/index.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/approvals/[approvalId].tsx`
- Create: `mobile/soes-mobile/src/features/teacher/review-group/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/review-group/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/review-group/screens/ReviewGroupScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/usePendingApprovals.ts`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/screens/ApprovalListScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/screens/ApprovalDetailScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/components/ApprovalQuestionCard.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/approvals/components/RevisionNoteEditor.tsx`

**API:**
- `GET /teacher/review-group/access`
- `GET /teacher/review-group`
- `GET /teacher/exam-approvals`
- `GET /teacher/exam-approvals/:id`
- `POST /teacher/exam-approvals/:id/approve`
- `POST /teacher/exam-approvals/:id/reject`

**Steps:**

1. Nhóm duyệt đề trên mobile chỉ xem thành viên và trạng thái.
2. Danh sách duyệt chỉ tải khi `canReview=true`.
3. Chi tiết đề chia section và dùng card câu hỏi; ghi chú sửa gắn từng câu.
4. Duyệt hoặc yêu cầu sửa phải xác nhận và khóa nút khi request đang chạy.
5. Thành công thì cập nhật danh sách chờ và hiển thị thông báo rõ ràng.

**Done when:** Tài khoản ngoài nhóm không thấy menu và không gọi API duyệt; yêu cầu sửa gửi đúng `questionNotes`.

**Commit:**

```bash
git commit -m "feat(mobile): add department exam approval"
```

### Task 10: Thông báo và hồ sơ giảng viên

**Files:**
- Create: `mobile/soes-mobile/app/(app)/(teacher)/notifications.tsx`
- Create: `mobile/soes-mobile/app/(app)/(teacher)/account.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/notifications/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/notifications/types.ts`
- Create: `mobile/soes-mobile/src/features/teacher/notifications/screens/TeacherNotificationsScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/account/api.ts`
- Create: `mobile/soes-mobile/src/features/teacher/account/screens/TeacherAccountScreen.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/account/components/ProfileForm.tsx`
- Create: `mobile/soes-mobile/src/features/teacher/account/components/PasswordForm.tsx`

**API:**
- `GET /teacher/notifications`
- `PATCH /teacher/notifications/:notificationId/read`
- `PATCH /teacher/notifications/read-all`
- `PATCH /auth/me`
- `PATCH /auth/me/password`

**Steps:**

1. Thông báo hỗ trợ phân trang, đánh dấu từng mục và tất cả đã đọc.
2. Top bar hiển thị số chưa đọc và mở đúng màn thông báo.
3. Hồ sơ cho sửa email/số điện thoại; đổi mật khẩu là form riêng.
4. Dùng chung validation và không lưu mật khẩu trong Zustand/SecureStore.

**Done when:** Badge chưa đọc đồng bộ sau thao tác; hồ sơ cập nhật lại auth store; form không lộ mật khẩu.

**Commit:**

```bash
git commit -m "feat(mobile): add teacher notifications and account"
```

### Task 11: Rà soát chất lượng và hoàn thiện bản bàn giao

**Files:**
- Modify: các file thuộc `mobile/soes-mobile/app/(app)/(teacher)` và `src/features/teacher`
- Create: `mobile/soes-mobile/docs/teacher-mobile-smoke-test.md`

**Steps:**

1. Chạy `npx expo install --check`.
2. Chạy `npx expo-doctor`.
3. Chạy `npx tsc --noEmit`.
4. Tìm và loại bỏ `any`, emoji icon, API call trong component trình bày và route file dài.
5. Kiểm tra iOS/Android: đăng nhập, chọn role, điều hướng, refresh, mất mạng, token hết hạn và đăng xuất.
6. Kiểm tra tài khoản `TEACHER`, `DEPARTMENT_HEAD`, thành viên nhóm duyệt và giảng viên ngoài nhóm.
7. Ghi lại smoke test có kết quả mong đợi cho từng luồng.

**Done when:** Không còn lỗi type/dependency; mọi màn có trạng thái tải/lỗi/rỗng; menu và API tuân thủ quyền BE.

**Commit:**

```bash
git commit -m "test(mobile): verify teacher portal flows"
```

## 4. Tiêu chí nghiệm thu chung

- Giao diện thống nhất với cổng sinh viên nhưng hiển thị đúng nhãn Giảng viên/Trưởng bộ môn.
- Không có emoji hoặc SVG viết trực tiếp trong component; icon lấy từ `lucide-react-native`.
- Route file mỏng, screen được chia section, không có component khổng lồ.
- API, state và UI không trộn trong cùng một file.
- Danh sách lớn dùng `FlatList`; request có retry thủ công và báo lỗi dễ hiểu.
- Không hiển thị chức năng bộ môn khi BE trả về không có quyền.
- Không triển khai lại nghiệp vụ đã có trên web nếu không phù hợp mobile.
- Mỗi task là một commit riêng và có thể review/rollback độc lập.

## 5. Thứ tự triển khai

Thực hiện Task 1 đến Task 5 trước để có nền tảng và dashboard. Sau đó Task 6, 7, 8 có thể triển khai độc lập. Task 9 cần hoàn tất quyền điều hướng ở Task 3. Task 10 thực hiện sau shell và top bar. Task 11 luôn chạy cuối cùng.
