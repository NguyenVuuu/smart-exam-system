# Business Rules

Tai lieu nay mo ta rule nghiep vu dang duoc code ho tro. Nguon doi chieu chinh: `be/soes-be/prisma/schema.prisma`, `be/soes-be/src/app.ts`, cac validators/services trong `be/soes-be/src/modules`.

## 1. Vai tro va tai khoan

### BR-01: Vai tro

He thong ho tro 3 vai tro chinh:

- `ADMIN`
- `TEACHER`
- `STUDENT`

Mot `User` chua thong tin ca nhan chung. Moi vai tro co profile rieng:

- `Student` dang nhap bang `studentCode`.
- `Teacher` dang nhap bang `teacherCode`.
- `Admin` dang nhap bang `adminCode`.

Email chi la thong tin lien he, khong phai identifier dang nhap.

### BR-02: Dang nhap va phien

- `identifier` duoc nhan dien theo prefix: `SV`, `GV`, `AD`.
- Password duoc hash bang bcrypt.
- Access token la JWT.
- Refresh token luu trong HttpOnly cookie va Redis.
- Student chi duoc mot active session tai mot thoi diem.
- Teacher va Admin co the dang nhap tu nhieu thiet bi.
- Logout xoa refresh token va blacklist access token con hieu luc.
- Route backend va frontend deu kiem tra role truoc khi cho truy cap.

## 2. Hoc vu

### BR-03: Department, Semester, Subject

Admin quan ly cac du lieu hoc vu:

- Department: khoa/bo mon, trang thai `ACTIVE`/`INACTIVE`.
- Semester: hoc ky co `TERM_1`, `TERM_2`, `TERM_3`, trang thai `UPCOMING`, `ACTIVE`, `CLOSED`.
- Subject: mon hoc, so tin chi, khoa/bo mon, trang thai.

Moi `(academicYear, term)` chi co mot semester.

### BR-04: Course offering

`CourseOffering` dai dien cho mot lop hoc phan:

- Mot subject.
- Mot semester.
- Mot teacher phu trach.
- Mot code unique.
- Trang thai `ACTIVE` hoac `CLOSED`.

Teacher chi quan ly cac course offering minh phu trach, tru khi duoc phan cong proctor/permission khac theo module.

### BR-05: Enrollment

- Student khong tu ghi danh.
- Admin quan ly enrollment.
- Mot student khong duoc ghi danh hai lan vao cung mot course offering.
- Mot student khong duoc hoc trung cung subject trong cung semester.
- Du lieu enrollment lich su duoc giu theo semester/course offering.

## 3. Noi dung hoc tap

### BR-06: Bai dang

Teacher co the tao bai dang theo course offering:

- `DRAFT`: chua cong bo.
- `PUBLISHED`: hien thi cho student.
- `HIDDEN`: an khoi student.

Bai dang co the pin va co attachments.

### BR-07: Tai lieu hoc tap

Teacher tai lieu theo course offering minh phu trach.

Rule:

- Moi material thuoc mot course offering.
- File name unique trong cung course offering.
- Metadata file duoc luu trong DB.
- File hoc tap luu bang storage provider duoc cau hinh, hien tai uu tien Supabase cho materials.
- `aiEnabled` cho biet material co duoc phep dung trong AI generation hay khong.

## 4. Ngan hang cau hoi

### BR-08: Loai cau hoi

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

### BR-09: Cau hoi trac nghiem va true/false

- `SINGLE_CHOICE` co dung mot dap an dung.
- `MULTIPLE_CHOICE` co tu hai dap an dung tro len.
- `TRUE_FALSE` dung hai lua chon dung/sai va mot dap an dung.
- Options co `orderIndex` unique trong tung question.

### BR-10: Cau hoi lap trinh

Cau hoi `PROGRAMMING`:

- Ho tro ngon ngu `JAVA`, `C`, `CPP`.
- La bai console stdin/stdout.
- Co `QuestionProgrammingConfig`: time limit, memory limit, max code size.
- Co mot hoac nhieu `QuestionProgrammingTestCase`.
- Test case co the la sample hoac hidden.

### BR-11: Quyen so huu va chia se cau hoi

- Cau hoi co `ownerId` la teacher tao/so huu.
- Teacher khong duoc sua cau hoi cua teacher khac neu khong co rule rieng.
- Cau hoi co the archived thay vi xoa cung.
- Moi subject co mot `QuestionBank`.
- `QuestionBankItem` lien ket question vao bank va co trang thai `PENDING`, `APPROVED`, `REJECTED`.
- Remove khoi bank la soft remove qua `removedAt`, khong xoa question goc.

### BR-12: Audit chat luong cau hoi

Module teacher questions co cac rule audit cho objective va programming question. Teacher nen sua cac canh bao chat luong truoc khi dua cau hoi vao exam/question bank.

## 5. AI question generation

### BR-13: Pham vi AI

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

### BR-14: Luu vet AI

Moi lan AI generation luu vao `AIGenerationHistory`:

- Teacher, subject, optional course offering/exam.
- Prompt, AI model.
- Mode, source type.
- Source file metadata hoac danh sach `sourceFiles`.
- So cau hoi, trang thai, loi neu co.
- Links toi materials va questions duoc tao.

Trang thai: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.

### BR-15: Review cau hoi AI

Cau hoi AI co the co `aiReviewStatus`:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

`APPROVED` chi the hien teacher da chap nhan cau hoi; cau hoi vao question bank hay exam con phu thuoc thao tac cua teacher.

## 6. De thi va lap lich

### BR-16: Tach Exam va ExamSchedule

Code hien tai tach:

- `Exam`: noi dung de thi, section, snapshot cau hoi, format, type va lifecycle noi dung.
- `ExamSchedule`: ca thi/lap lich, thoi gian, target course/student, password, proctoring, distribution, result release.

Khong dat rule thoi gian thi, mat khau, proctoring vao `Exam`; cac rule nay thuoc `ExamSchedule`.

### BR-17: Loai va format de thi

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

### BR-18: Lifecycle Exam

`Exam.status`:

- `DRAFT`: dang soan.
- `READY`: san sang lap lich.
- `LOCKED`: khoa distribution/chinh sua de bao toan noi dung khi da co lich/attempt.
- `ARCHIVED`: luu tru.

Teacher chi lap lich regular exam khi exam `READY` va co cau hoi.

Final exam duoc lap lich tap trung boi Admin; teacher schedule service chan teacher tao schedule cho `FINAL`.

### BR-19: Exam sections va snapshots

- Exam co the co nhieu section.
- Section co type `OBJECTIVE` hoac `PROGRAMMING`.
- Cau hoi them vao exam duoc snapshot thanh `ExamQuestion`.
- Options, programming config va test cases cung duoc snapshot de tranh thay doi question bank lam anh huong exam da tao.

### BR-20: Lap lich thi

`ExamSchedule` chua:

- `startTime`, `endTime`, `durationMinutes`.
- `maxAttempts`.
- Optional password hash.
- Target course offerings va/hoac target students.
- Proctor assignments.
- Location mode `ONLINE` hoac `CAMPUS`.
- Optional allowed IP ranges.

`ExamSchedule.status`: `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `CANCELLED`.

### BR-21: Makeup schedule

- Makeup schedule lien ket schedule goc qua `makeupOfScheduleId`.
- Makeup dung exam goc nhung co lich/target rieng.
- Grading/submission queries co tinh den makeup schedule khi can.

### BR-22: Distribution

`distributionMode`:

- `FIXED_ORDER`
- `SHUFFLE_QUESTIONS`
- `SHUFFLE_OPTIONS`
- `SHUFFLE_QUESTIONS_AND_OPTIONS`
- `RANDOM_SUBSET`

Thu tu cau hoi va option cua tung attempt duoc luu trong `ExamAttemptQuestion`.

## 7. Lam bai

### BR-23: Dieu kien vao thi

Student chi bat dau bai thi khi:

- Duoc target boi schedule qua course/student.
- Schedule dang hop le theo thoi gian/trang thai.
- Chua vuot `maxAttempts`.
- Nhap dung password neu schedule co password.
- Neu `enableWebcam = true`, phai xac nhan webcam `ACTIVE`.
- Neu `enableScreenMonitoring = true`, phai xac nhan screen share `ACTIVE`.

### BR-24: Attempt

- Moi attempt thuoc mot student, course offering va exam schedule.
- `(examScheduleId, studentId, attemptNo)` la unique.
- Attempt co deadline rieng theo schedule duration.
- Attempt status: `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `GRADING`, `GRADED`, `PUBLISHED`, `INVALIDATED`.
- He thong autosave answers va draft source code.

### BR-25: Nop bai

Bai thi ket thuc khi:

- Student submit.
- Het gio va bi auto submit.
- System/proctor ket thuc theo rule xu ly.

Sau khi ket thuc, student khong duoc sua dap an.

### BR-26: Run code va submit programming

- Student co the run code cho cau lap trinh.
- Lan nop/cham chinh thuc tao `ProgrammingSubmission`.
- Moi submission co `clientRequestId` unique de tranh duplicate request.
- Ket qua tung test case luu vao `ProgrammingSubmissionTestResult`.

## 8. Proctoring va vi pham

### BR-27: Cau hinh proctoring theo schedule

Schedule co cac flag:

- `enableTabLock`, `maxTabSwitches`
- `requireFullscreen`
- `enableWebcam`
- `enableScreenMonitoring`
- `blockCopyPaste`
- `blockRightClick`

Neu webcam/screen monitoring bat, student phai cap quyen va gui trang thai active truoc khi bat dau.

### BR-28: Loai vi pham

He thong ghi nhan cac `ViolationType`:

- Browser: `TAB_SWITCH`, `FULLSCREEN_EXIT`, `INACTIVITY`, `COPY_PASTE`, `RIGHT_CLICK`.
- Webcam: `NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`, `PHONE_DETECTED`, `CAMERA_BLOCKED`, `CAMERA_DISCONNECTED`, `CAMERA_PERMISSION_DENIED`.
- Screen: `SCREEN_SHARE_STOPPED`, `SCREEN_PERMISSION_DENIED`.
- Proctor: `PROCTOR_WEBCAM_CAPTURE`, `PROCTOR_SCREEN_CAPTURE`.

Violation co `source`: `WEBCAM`, `SCREEN`, `BROWSER`, `PROCTOR`.

### BR-29: Phone detection

- `PHONE_DETECTED` bat buoc co metadata hop le.
- Ghi nhan phone detection yeu cau mot evidence image.
- Metadata can chua model/category/confidence theo validator hien tai.

### BR-30: Evidence

- Evidence luu file trong MinIO khi storage san sang.
- Co fallback local evidence neu upload MinIO loi.
- DB luu metadata trong `ViolationEvidence`; `Violation.evidenceUrls` la legacy JSON.
- Evidence type: `WEBCAM_IMAGE`, `SCREEN_IMAGE`.
- Prefix khuyen nghi dung `proctoringStoragePath` tren schedule.

### BR-31: Realtime proctoring

Teacher/proctor co the:

- Xem danh sach session realtime theo schedule.
- Request live webcam hoac live screen.
- Chup evidence thu cong tu live stream.
- Review/warn/confirm/dismiss/force submit/invalidate violation theo trang thai review.

Socket.IO phat event vi pham, heartbeat, online/offline va attempt invalidation cho dashboard.

### BR-32: Xu ly attempt co vi pham

- He thong ghi nhan su kien, khong tu ket luan gian lan cuoi cung.
- Teacher/proctor co quyen invalidate attempt neu co access.
- Khi invalidate, attempt sang `INVALIDATED`, `endedBy = PROCTOR`, luu `invalidatedAt`, `invalidatedById`, `invalidationReason`.
- Invalidation duoc broadcast realtime.

## 9. Cham diem, cong bo ket qua va phuc khao

### BR-33: Cham diem

- Objective questions cham tu dong.
- Programming submissions cham qua Judge0/test cases.
- Teacher co the manual grade va finalize score.
- Bulk finalize bi chan neu attempt co violation chua duoc mo/xem theo rule service hien tai.

### BR-34: Result release

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

### BR-35: Review policy

`reviewPolicy`:

- `NONE`: khong xem lai.
- `SCORE_ONLY`: chi diem.
- `ANSWERS_NO_KEY`: xem dap an cua minh, khong xem key.
- `FULL_AFTER_RELEASE`: xem day du sau khi duoc release.

`reviewStartAt`/`reviewEndAt` gioi han thoi gian xem lai neu duoc cau hinh.

### BR-36: Phuc khao

- Student chi co mot `GradeAppeal` cho moi attempt.
- Trang thai: `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`.
- Teacher xu ly va luu `teacherReply`, `handledAt`, `handledById`.
- Khong xu ly lai phuc khao da hoan tat.

## 10. Thong bao va audit

### BR-37: Notification

Notification gan voi `User`, co:

- `title`
- `content`
- `link`
- `isRead`

Teacher notification routes duoc mount tai `/api/teacher/notifications`; student portal cung co notification UI/API rieng.

### BR-38: Audit log

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
- Student single-session chi ap dung cho `STUDENT`; Teacher/Admin multi-device duoc code cho phep.
