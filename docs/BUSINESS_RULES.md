# Business Rules

Tai lieu nay mo ta rule nghiep vu dang duoc code ho tro. Nguon doi chieu chinh: `be/soes-be/prisma/schema.prisma`, `be/soes-be/src/app.ts`, cac validators/services trong `be/soes-be/src/modules`.

## 1. Vai tro va tai khoan

### BR-01: Vai tro va Tai khoan duy nhat

He thong ho tro 5 vai tro (dinh nghia qua enum `UserRole`):

- `STUDENT` — sinh vien, profile trong bang `Student`.
- `TEACHER` — giang vien, profile trong bang `Teacher` voi `position = LECTURER`.
- `DEPARTMENT_HEAD` — truong bo mon, profile trong bang `Teacher` voi `position = DEPARTMENT_HEAD`.
- `ADMIN` — quan tri vien, profile trong bang `Admin` voi `role = ADMIN`.
- `EDUCATION_OFFICER` — giao vu, profile trong bang `Admin` voi `role = EDUCATION_OFFICER`.

**Mo hinh tai khoan:**
- Moi nguoi dung chi co **DUY NHAT 1 TAI KHOAN** duoc dai dien boi thuc the `User`.
- Thong tin dang nhap va trang thai tai khoan duoc luu truc tiep tai bang `User`:
  - `password`: mat khau hash bcrypt cua tai khoan.
  - `status`: trang thai tai khoan (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
  - `roles`: danh sach cac vai tro nguoi dung so huu (`UserRole[]`).
  - `username`: ten dang nhap (unique, tuy chon).
  - `email`: dia chi email (unique, tuy chon).
  - `phoneNumber`, `fullName`, `avatarUrl`.
- Cac bang profile (`Student`, `Teacher`, `Admin`) **khong con luu mat khau**. Cac bang nay chi chua thong tin hoc vu va ma dinh danh nghiep vu:
  - `Student`: `studentCode` (prefix `SV`).
  - `Teacher`: `teacherCode` (prefix `GV`), `departmentId`, `position`.
  - `Admin`: `adminCode` (prefix `AD` hoac `GVO`), `role`.
- Mot `User` co the so huu 1 hoac nhieu vai tro trong mang `roles` va co cac ban ghi profile tuong ung (vi du: vua la giang vien vua la sinh vien).

**Identifier dang nhap:**
- Nguoi dung chi dang nhap bang `User.username`.
- `User.username` phai trung voi ma tai khoan; `User.email` va cac ma profile khong phai thong tin dang nhap.
- Mat khau duoc kiem tra mot lan duy nhat theo `User.password`.

### BR-02: Dang nhap va phien lam viec

- **Xac thuc dang nhap:**
  - Nguoi dung gui `username` (chinh la ma tai khoan) va `password`; email va ma profile khong duoc dung de dang nhap.
  - Kiem tra tai khoan `User.status == ACTIVE` va so khop `User.password` bang bcrypt.
- **Phan luong dang nhap:**
  - **Neu tai khoan chi co dung 1 role:**
    - Dang nhap thanh cong ngay lap tuc.
    - He thong cap phat Access Token (JWT) va Refresh Token (HttpOnly cookie).
    - Client chuyen huong truc tiep vao trang chu cua role do (`/student`, `/teacher`, hoac `/admin`).
  - **Neu tai khoan co tu 2 role tro len:**
    - He thong chua cap Access Token ngay, tra ve `requireRoleSelection: true`, kem `selectionToken` (luu trong Redis voi TTL 5 phut) va danh sach `availableRoles` ma nguoi dung so huu.
    - Tren giao dien hien thi cac box tuong ung voi tung role cua nguoi dung.
    - Nguoi dung nhap chon role muon lam viec -> client gui request `POST /api/auth/select-role` voi `selectionToken` va `role`.
    - Sau khi chon role hop le, he thong moi cap phat Access Token + Refresh Token va chuyen huong vao giao dien cua role duoc chon.
- **Phien lam viec va Token:**
  - Access token la JWT chua: `sub` (User.id), `profileId` (ID profile tuong ung voi role dang chon, neu co), `role` (vai tro dang su dung), `jti`.
  - Refresh token duoc luu trong HttpOnly cookie va Redis voi key theo phien vai tro: `refreshToken:${userId}:${role}`.
  - Student chi duoc co 1 active session tai mot thoi diem (single session enforcement).
  - Teacher, DEPARTMENT_HEAD, Admin, EDUCATION_OFFICER co the dang nhap dong thoi tu nhieu thiet bi.
  - Logout xoa refresh token tuong ung trong Redis va blacklist access token con hieu luc.
  - Route backend va frontend kiem tra quyen truy cap dua tren `role` trong token hien tai.

### BR-03 (cu BR-02b): Teacher va DEPARTMENT_HEAD

- Giang vien co `Teacher.position = LECTURER` tuong ung role `TEACHER`.
- Giang vien dam nhiem chuc vu truong bo mon co `Teacher.position = DEPARTMENT_HEAD` va role `DEPARTMENT_HEAD` trong `User.roles`.
- Ca hai role deu dung profile trong bang `Teacher` va co quyen truy cap cac route `/api/teacher/*`.
- `DEPARTMENT_HEAD` co them cac quyen dac thu: `APPROVE_SHARED_QUESTION`, `APPROVE_FINAL_EXAM`, `VIEW_DEPARTMENT_EXAMS`, `VIEW_DEPARTMENT_REPORTS`.

## 2. Hoc vu

### BR-04: Department, Semester, Subject

Admin quan ly cac du lieu hoc vu:

- Department: khoa/bo mon, trang thai `ACTIVE`/`INACTIVE`.
- Semester: hoc ky co `TERM_1`, `TERM_2`, `TERM_3`, trang thai `UPCOMING`, `ACTIVE`, `CLOSED`.
- Subject: mon hoc, so tin chi, khoa/bo mon, trang thai.

Moi `(academicYear, term)` chi co mot semester.

### BR-05: Course offering

`CourseOffering` dai dien cho mot lop hoc phan:

- Mot subject.
- Mot semester.
- Mot teacher phu trach.
- Mot code unique.
- Trang thai `ACTIVE` hoac `CLOSED`.

Teacher chi quan ly cac course offering minh phu trach, tru khi duoc phan cong proctor/permission khac theo module.

### BR-06: Enrollment

- Student khong tu ghi danh.
- Admin quan ly enrollment.
- Mot student khong duoc ghi danh hai lan vao cung mot course offering.
- Mot student khong duoc hoc trung cung subject trong cung semester.
- Du lieu enrollment lich su duoc giu theo semester/course offering.

## 3. Noi dung hoc tap

### BR-07: Bai dang

Teacher co the tao bai dang theo course offering:

- `DRAFT`: chua cong bo.
- `PUBLISHED`: hien thi cho student.
- `HIDDEN`: an khoi student.

Bai dang co the pin va co attachments.

### BR-08: Tai lieu hoc tap

Teacher tai lieu theo course offering minh phu trach.

Rule:

- Moi material thuoc mot course offering.
- File name unique trong cung course offering.
- Metadata file duoc luu trong DB.
- File hoc tap luu bang storage provider duoc cau hinh, hien tai uu tien Supabase cho materials.
- `aiEnabled` cho biet material co duoc phep dung trong AI generation hay khong.

## 4. Ngan hang cau hoi

### BR-09: Loai cau hoi

He thong ho tro:

- `SINGLE_CHOICE`
- `MULTIPLE_CHOICE`
- `TRUE_FALSE`
- `PROGRAMMING`

Do kho:

- `EASY`
- `MEDIUM`
- `HARD`

Nguon cau hoi:

- `MANUAL`
- `AI_GENERATED`
- `IMPORTED`

### BR-10: Cau hoi trac nghiem va true/false

- `SINGLE_CHOICE` co dung mot dap an dung.
- `MULTIPLE_CHOICE` co tu hai dap an dung tro len.
- `TRUE_FALSE` dung hai lua chon dung/sai va mot dap an dung.
- Options co `orderIndex` unique trong tung question.

### BR-11: Cau hoi lap trinh

Cau hoi `PROGRAMMING`:

- Ho tro ngon ngu `JAVA`, `C`, `CPP`.
- La bai console stdin/stdout.
- Co `QuestionProgrammingConfig`: time limit, memory limit, max code size.
- Co mot hoac nhieu `QuestionProgrammingTestCase`.
- Test case co the la sample hoac hidden.

### BR-12: Quyen so huu va chia se cau hoi

- Cau hoi co `ownerId` la teacher tao/so huu.
- Teacher khong duoc sua cau hoi cua teacher khac neu khong co rule rieng.
- Cau hoi co the archived thay vi xoa cung.
- Moi subject co mot `QuestionBank`.
- `QuestionBankItem` lien ket question vao bank va co trang thai `PENDING`, `APPROVED`, `REJECTED`.
- Remove khoi bank la soft remove qua `removedAt`, khong xoa question goc.

### BR-13: Audit chat luong cau hoi

Module teacher questions co cac rule audit cho objective va programming question. Teacher nen sua cac canh bao chat luong truoc khi dua cau hoi vao exam/question bank.

## 5. AI question generation

### BR-14: Pham vi AI

AI chi la cong cu ho tro. Teacher quyet dinh cau hoi nao duoc dung.

Mode ho tro:

- `GENERATE_FROM_MATERIAL`: sinh cau hoi tu course material.
- `EXTRACT_EXISTING_EXAM`: trich xuat cau hoi tu file de thi upload.

Source type:

- `COURSE_MATERIAL`
- `UPLOAD_FILE`

Target ho tro:

- Objective: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`.
- Programming: `PROGRAMMING`.

### BR-15: Luu vet AI

Moi lan AI generation luu vao `AIGenerationHistory`:

- Teacher, subject, optional course offering/exam.
- Prompt, AI model.
- Mode, source type.
- Source file metadata hoac danh sach `sourceFiles`.
- So cau hoi, trang thai, loi neu co.
- Links toi materials va questions duoc tao.

Trang thai: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.

### BR-16: Review cau hoi AI

Cau hoi AI co the co `aiReviewStatus`:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

`APPROVED` chi the hien teacher da chap nhan cau hoi; cau hoi vao question bank hay exam con phu thuoc thao tac cua teacher.

## 6. De thi va lap lich

### BR-17: Tach Exam va ExamSchedule

Code hien tai tach:

- `Exam`: noi dung de thi, section, snapshot cau hoi, format, type va lifecycle noi dung.
- `ExamSchedule`: ca thi/lap lich, thoi gian, target course/student, password, proctoring, distribution, result release.

Khong dat rule thoi gian thi, mat khau, proctoring vao `Exam`; cac rule nay thuoc `ExamSchedule`.

### BR-18: Loai va format de thi

`Exam.type`:

- `QUIZ`
- `MIDTERM`
- `FINAL`

`Exam.format`:

- `OBJECTIVE`
- `PROGRAMMING`
- `MIXED`

`Exam.creationMethod`:

- `MANUAL`
- `QUESTION_BANK`
- `AI_GENERATED`
- `MIXED`

### BR-19: Lifecycle Exam

`Exam.status`:

- `DRAFT`: dang soan.
- `READY`: san sang lap lich.
- `LOCKED`: khoa distribution/chinh sua de bao toan noi dung khi da co lich/attempt.
- `ARCHIVED`: luu tru.

Teacher chi lap lich regular exam khi exam `READY` va co cau hoi.

Final exam duoc lap lich tap trung boi Admin; teacher schedule service chan teacher tao schedule cho `FINAL`.

### BR-20: Exam sections va snapshots

- Exam co the co nhieu section.
- Section co type `OBJECTIVE` hoac `PROGRAMMING`.
- Cau hoi them vao exam duoc snapshot thanh `ExamQuestion`.
- Options, programming config va test cases cung duoc snapshot de tranh thay doi question bank lam anh huong exam da tao.

### BR-21: Lap lich thi

`ExamSchedule` chua:

- `startTime`, `endTime`, `durationMinutes`.
- `maxAttempts`.
- Optional password hash.
- Target course offerings va/hoac target students.
- Proctor assignments.
- Location mode `ONLINE` hoac `CAMPUS`.
- Optional allowed IP ranges.

`ExamSchedule.status`: `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `CANCELLED`.

### BR-22: Makeup schedule

- Makeup schedule lien ket schedule goc qua `makeupOfScheduleId`.
- Makeup dung exam goc nhung co lich/target rieng.
- Grading/submission queries co tinh den makeup schedule khi can.

### BR-23: Distribution

`distributionMode`:

- `FIXED_ORDER`
- `SHUFFLE_QUESTIONS`
- `SHUFFLE_OPTIONS`
- `SHUFFLE_QUESTIONS_AND_OPTIONS`
- `RANDOM_SUBSET`

Thu tu cau hoi va option cua tung attempt duoc luu trong `ExamAttemptQuestion`.

## 7. Lam bai

### BR-24: Dieu kien vao thi

Student chi bat dau bai thi khi:

- Duoc target boi schedule qua course/student.
- Schedule dang hop le theo thoi gian/trang thai.
- Chua vuot `maxAttempts`.
- Nhap dung password neu schedule co password.
- Neu `enableWebcam = true`, phai xac nhan webcam `ACTIVE`.
- Neu `enableScreenMonitoring = true`, phai xac nhan screen share `ACTIVE`.

### BR-25: Attempt

- Moi attempt thuoc mot student, course offering va exam schedule.
- `(examScheduleId, studentId, attemptNo)` la unique.
- Attempt co deadline rieng theo schedule duration.
- Attempt status: `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `GRADING`, `GRADED`, `PUBLISHED`, `INVALIDATED`.
- He thong autosave answers va draft source code.

### BR-26: Nop bai

Bai thi ket thuc khi:

- Student submit.
- Het gio va bi auto submit.
- System/proctor ket thuc theo rule xu ly.

Sau khi ket thuc, student khong duoc sua dap an.

### BR-27: Run code va submit programming

- Student co the run code cho cau lap trinh.
- Lan nop/cham chinh thuc tao `ProgrammingSubmission`.
- Moi submission co `clientRequestId` unique de tranh duplicate request.
- Ket qua tung test case luu vao `ProgrammingSubmissionTestResult`.

## 8. Proctoring va vi pham

### BR-28: Cau hinh proctoring theo schedule

Schedule co cac flag:

- `enableTabLock`, `maxTabSwitches`
- `requireFullscreen`
- `enableWebcam`
- `enableScreenMonitoring`
- `blockCopyPaste`
- `blockRightClick`

Neu webcam/screen monitoring bat, student phai cap quyen va gui trang thai active truoc khi bat dau.

### BR-29: Loai vi pham

He thong ghi nhan cac `ViolationType`:

- Browser: `TAB_SWITCH`, `FULLSCREEN_EXIT`, `INACTIVITY`, `COPY_PASTE`, `RIGHT_CLICK`.
- Webcam: `NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`, `PHONE_DETECTED`, `CAMERA_BLOCKED`, `CAMERA_DISCONNECTED`, `CAMERA_PERMISSION_DENIED`.
- Screen: `SCREEN_SHARE_STOPPED`, `SCREEN_PERMISSION_DENIED`.
- Proctor: `PROCTOR_WEBCAM_CAPTURE`, `PROCTOR_SCREEN_CAPTURE`.

Violation co `source`: `WEBCAM`, `SCREEN`, `BROWSER`, `PROCTOR`.

### BR-30: Phone detection

- `PHONE_DETECTED` bat buoc co metadata hop le.
- Ghi nhan phone detection yeu cau mot evidence image.
- Metadata can chua model/category/confidence theo validator hien tai.

### BR-31: Evidence

- Evidence luu file trong MinIO khi storage san sang.
- Co fallback local evidence neu upload MinIO loi.
- DB luu metadata trong `ViolationEvidence`; `Violation.evidenceUrls` la legacy JSON.
- Evidence type: `WEBCAM_IMAGE`, `SCREEN_IMAGE`.
- Prefix khuyen nghi dung `proctoringStoragePath` tren schedule.

### BR-32: Realtime proctoring

Teacher/proctor co the:

- Xem danh sach session realtime theo schedule.
- Request live webcam hoac live screen.
- Chup evidence thu cong tu live stream.
- Review/warn/confirm/dismiss/force submit/invalidate violation theo trang thai review.

Socket.IO phat event vi pham, heartbeat, online/offline va attempt invalidation cho dashboard.

### BR-33: Xu ly attempt co vi pham

- He thong ghi nhan su kien, khong tu ket luan gian lan cuoi cung.
- Teacher/proctor co quyen invalidate attempt neu co access.
- Khi invalidate, attempt sang `INVALIDATED`, `endedBy = PROCTOR`, luu `invalidatedAt`, `invalidatedById`, `invalidationReason`.
- Invalidation duoc broadcast realtime.

## 9. Cham diem, cong bo ket qua va phuc khao

### BR-34: Cham diem

- Objective questions cham tu dong.
- Programming submissions cham qua Judge0/test cases.
- Teacher co the manual grade va finalize score.
- Bulk finalize bi chan neu attempt co violation chua duoc mo/xem theo rule service hien tai.

### BR-35: Result release

Ket qua thuoc `ExamSchedule`, khong phai `Exam`.

Schema co `resultReleaseMode`:

- `IMMEDIATE`
- `MANUAL`
- `SCHEDULED`
- `NEVER`

Teacher grading API hien expose `IMMEDIATE`, `MANUAL`, `SCHEDULED`; `NEVER` ton tai trong schema de ho tro chinh sach khong cong bo.

Rule:

- `IMMEDIATE`: co the publish khi cham xong.
- `MANUAL`: teacher publish thu cong, set `resultsPublishedAt`.
- `SCHEDULED`: bat buoc co `resultReleaseAt`.
- Student chi thay diem khi schedule/attempt thoa dieu kien release.

### BR-36: Review policy

`reviewPolicy`:

- `NONE`: khong xem lai.
- `SCORE_ONLY`: chi diem.
- `ANSWERS_NO_KEY`: xem dap an cua minh, khong xem key.
- `FULL_AFTER_RELEASE`: xem day du sau khi duoc release.

`reviewStartAt`/`reviewEndAt` gioi han thoi gian xem lai neu duoc cau hinh.

### BR-37: Phuc khao

- Student chi co mot `GradeAppeal` cho moi attempt.
- Trang thai: `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`.
- Teacher xu ly va luu `teacherReply`, `handledAt`, `handledById`.
- Khong xu ly lai phuc khao da hoan tat.

## 10. Thong bao va audit

### BR-38: Notification

Notification gan voi `User`, co:

- `title`
- `content`
- `link`
- `isRead`

Teacher notification routes duoc mount tai `/api/teacher/notifications`; student portal cung co notification UI/API rieng.

### BR-39: Audit log

He thong ghi audit cho cac thao tac quan trong:

- Dang nhap/dang xuat khi co writer tu module.
- Tao/cap nhat hoc vu, user, exam, schedule.
- Review question bank.
- Proctoring violation review/invalidation.
- Chinh diem/finalize/cong bo ket qua.

Audit log luu action, entity type/id, metadata, user, IP va user agent.

## 11. Gioi han hien tai can luu y

- Rule nghiep vu uu tien code hien tai hon mo ta cu.
- Frontend/backend dang dung ASCII-friendly docs trong thu muc `docs`; cac API contract rieng trong `be/soes-be/docs` co the chi tiet endpoint hon.
- `ResultReleaseMode.NEVER` co trong schema nhung validator teacher schedule/result release hien chi cho `IMMEDIATE`, `MANUAL`, `SCHEDULED`.
- Student single-session chi ap dung cho `STUDENT`; cac role khac multi-device duoc code cho phep.
- `DEPARTMENT_HEAD` va `TEACHER` cung dung bang `Teacher`, phan biet boi `position`.
- `ADMIN` va `EDUCATION_OFFICER` cung dung bang `Admin`, phan biet boi `role` (BackofficeRole).
- Mot User co the co ca role `TEACHER` va `STUDENT` cung luc (truong hop combo user trong seed demo).
