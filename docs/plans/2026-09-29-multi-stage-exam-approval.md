# Kế hoạch triển khai quy trình ra đề, kiểm duyệt và tiếp nhận đề thi

**Mục tiêu:** Quản lý đầy đủ từ phân công ra đề, soạn và nộp, thẩm định chuyên môn, phê duyệt bộ môn, tiếp nhận của Khảo thí đến sử dụng đề trong ca thi.

**Phạm vi:** Triển khai trước cho đề cuối kỳ (`FINAL`). Đề giữa kỳ và quiz giữ chính sách hiện tại. Không bổ sung chức vụ Phó bộ môn; giữ `LECTURER` và `DEPARTMENT_HEAD`.

**Mô hình được chọn:** Trưởng bộ môn trực tiếp thẩm định đề của người khác hoặc phân công một/tổ giảng viên phù hợp. Kết quả thẩm định và quyết định phê duyệt bộ môn được ghi riêng. Khảo thí kiểm tra thể thức và khóa bản đã duyệt trước khi lập lịch.

**Công nghệ:** Express, TypeScript, Prisma, PostgreSQL, React, Zustand, Zod; tái sử dụng thông báo, nhật ký hoạt động và cấu trúc câu hỏi trong đề hiện có.

**Tình trạng tài liệu:** Kế hoạch triển khai, chưa phải các chức năng đã hoàn thành. Các chính sách dưới đây là đề xuất cụ thể cho SOES theo trao đổi của nhóm; số reviewer và thẩm quyền ủy quyền cần phù hợp với quy định đơn vị.

## 1. Hiện trạng đã đối chiếu với source

| Nội dung | Hiện trạng | Điều cần bổ sung |
| --- | --- | --- |
| Vai trò tài khoản | Admin, Teacher, Student | Giữ nguyên; phân quyền nghiệp vụ theo phạm vi |
| Chức vụ giảng viên | Giảng viên, Trưởng bộ môn | Giữ nguyên; không cần Phó bộ môn |
| Phân công ra đề | Chưa có đối tượng yêu cầu ra đề trong schema đã đọc | Yêu cầu, người soạn, đầu ra, ma trận và hạn nộp |
| Duyệt đề cuối kỳ | Một bước Trưởng bộ môn duyệt | Phân công thẩm định và quyết định bộ môn |
| Đề của Trưởng bộ môn | Nhánh gửi đề tự chuyển `APPROVED` và `READY` | Bỏ tự duyệt, có người xử lý độc lập |
| Kết quả duyệt | Một bộ trường người duyệt, ngày duyệt, lý do | Lưu từng hồ sơ, từng reviewer và từng phiên bản |
| Câu hỏi trong đề | `ExamQuestion` có bản sao nội dung, đáp án và cấu hình | Tận dụng khi soạn; bổ sung bản hồ sơ gửi duyệt và khóa khi tiếp nhận |
| Lập lịch tập trung | Đề `FINAL`, `READY`, `APPROVED`; lớp cùng môn và học kỳ | Kiểm tra thêm bản được Khảo thí tiếp nhận hợp lệ |
| Trạng thái ca thi | `DRAFT / SCHEDULED / OPEN / CLOSED / CANCELLED` | Giữ; việc mở thi thuộc ca thi |

Các điểm tích hợp chính:

- `be/soes-be/prisma/schema.prisma`
- `be/soes-be/src/modules/auth/mappers/auth.mapper.ts`
- `be/soes-be/src/modules/teacher-exams/services/teacher-exams.service.ts`
- `be/soes-be/src/modules/teacher-exams/repositories/teacher-exam-lifecycle.repository.ts`
- `be/soes-be/src/modules/teacher-exams/repositories/exam-question-snapshot.repository.ts`
- `be/soes-be/src/modules/exam-schedules/services/exam-schedule.service.ts`
- `be/soes-be/src/app.ts`
- `fe/soes-fe/src/pages/teacher/TeacherDepartmentApprovalPage.tsx`

## 2. Các quyết định nghiệp vụ

| Nội dung | Chính sách cho phiên bản đầu |
| --- | --- |
| Loại đề áp dụng | Đề cuối kỳ |
| Chủ trì quy trình | Trưởng bộ môn phụ trách môn |
| Nhóm chuyên môn | Nhóm theo bộ môn và môn học, có thời gian hiệu lực |
| Cách thẩm định | TBM trực tiếp hoặc phân công một/tổ giảng viên |
| Số reviewer | Tối thiểu một người; có thể nhiều người theo phân công |
| Điều kiện thông qua | Tất cả reviewer bắt buộc của vòng duyệt thông qua cùng phiên bản |
| Ý kiến yêu cầu sửa | Chặn chuyển sang phê duyệt bộ môn |
| Người phê duyệt bộ môn | TBM hoặc giảng viên được ủy quyền phê duyệt hợp lệ |
| Kiêm thẩm định và phê duyệt | Cho TBM ở nhánh trực tiếp, nếu không phải tác giả và phù hợp chuyên môn |
| Nhánh tổ thẩm định | Tổ thông qua chuyên môn, TBM/người được ủy quyền quyết định bộ môn |
| Tự duyệt đề mình tạo | Không cho phép |
| Tiếp nhận | Tài khoản Admin được giao quyền Khảo thí |
| Điều kiện sử dụng | Được duyệt bộ môn, Khảo thí tiếp nhận và khóa, đủ điều kiện kỹ thuật |
| Đề chính thức/dự phòng | Đầu ra riêng, mỗi đầu ra duyệt độc lập |
| Bốc thăm đề | Để giai đoạn sau; phiên bản đầu chọn rõ bản đề khi tạo ca |

## 3. Phân role theo lớp nghiệp vụ

### 3.1 Ba lớp quyền

| Lớp | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Vai trò tài khoản | Nhóm truy cập cổng chức năng | `TEACHER`, `ADMIN`, `STUDENT` |
| Chức vụ | Trách nhiệm quản lý tổ chức | `LECTURER`, `DEPARTMENT_HEAD` |
| Nhiệm vụ và quyền theo hồ sơ | Hành động được thực hiện trên một đối tượng cụ thể | Người được giao soạn, reviewer đề A, người duyệt thay môn B, cán bộ tiếp nhận |

Một giảng viên vẫn là `TEACHER`, nhưng có thể soạn đề A và thẩm định đề B. Thành viên nhóm không tự có quyền xem mọi đề của bộ môn.

Quyền soạn được xác định từ yêu cầu ra đề được giao. Quyền duyệt có phạm vi bộ môn → môn → hồ sơ, kèm học kỳ và hiệu lực khi cần. Việc dạy một lớp học phần không tự cấp quyền phê duyệt đề môn đó.

### 3.2 Ma trận quyền

| Hành động | Người ra đề | Reviewer được giao | TBM | Giảng viên được ủy quyền duyệt cuối | Admin có quyền Khảo thí |
| --- | --- | --- | --- | --- | --- |
| Tạo yêu cầu ra đề | Không mặc định | Không mặc định | Trong bộ môn | Chỉ khi có quyền quản lý riêng | Không mặc định |
| Soạn và nộp | Đầu ra được giao | Không sửa thay tác giả | Nếu là người được giao soạn | Nếu là người được giao soạn | Không |
| Tạo nhóm, giao thẩm định | Không mặc định | Không mặc định | Trong phạm vi phụ trách | Không tự có từ quyền duyệt cuối | Không mặc định |
| Xem nội dung và đáp án | Đề được giao soạn | Hồ sơ được giao | Hồ sơ thuộc phạm vi quản lý | Hồ sơ nằm trong phạm vi ủy quyền | Hồ sơ cần tiếp nhận, đúng phạm vi |
| Thông qua chuyên môn | Không với đề mình tạo | Có, theo assignment | Khi được giao trực tiếp và không phải tác giả | Chỉ khi có assignment độc lập | Không |
| Phê duyệt bộ môn | Không với đề mình tạo | Không tự có | Có khi đủ kết quả và không phải tác giả | Khi đủ điều kiện và ủy quyền còn hiệu lực | Không mặc định |
| Tiếp nhận, khóa bản đề | Không | Không | Theo dõi kết quả | Theo dõi kết quả | Có |
| Chọn đề cho ca thi | Không tự có | Không tự có | Theo phân quyền tổ chức thi hiện tại | Không tự có từ quyền duyệt | Cần quyền tổ chức thi tương ứng |
| Cấp/thu hồi ủy quyền duyệt | Không | Không | Trong phạm vi được phép | Không được ủy quyền tiếp | Không tự có quyền học thuật |

Admin quản lý tài khoản có thể thiết lập quyền Khảo thí, nhưng quyền quản trị tài khoản không tự đồng nghĩa có quyền đọc đáp án hoặc phê duyệt học thuật.

### 3.3 Danh mục quyền dự kiến

| Quyền | Phạm vi và điều kiện |
| --- | --- |
| `MANAGE_EXAM_TASKS` | Quản lý yêu cầu ra đề theo bộ môn/môn |
| `MANAGE_EXAM_REVIEW_GROUPS` | Quản lý nhóm chuyên môn đúng phạm vi |
| `ASSIGN_EXAM_REVIEWERS` | Giao người thẩm định từng hồ sơ |
| `REVIEW_EXAM` | Từ assignment còn hiệu lực; không cấp toàn hệ thống |
| `APPROVE_DEPARTMENT_EXAM` | TBM hoặc bản cấp quyền/ủy quyền hợp lệ |
| `DELEGATE_EXAM_APPROVAL` | Cấp, thu hồi trong thẩm quyền của TBM |
| `ACCEPT_AND_SEAL_EXAM` | Admin có quyền Khảo thí theo phạm vi |
| Quyền lập lịch hiện có | Kết hợp điều kiện đề đã tiếp nhận; không tự gộp vào quyền duyệt |

Tên quyền là đề xuất; khi code cần tích hợp với permission hiện có thay vì tạo danh mục trùng. Backend kiểm tra tài khoản, phạm vi, trạng thái, phân công, xung đột tác giả và hiệu lực tại thời điểm quyết định.

## 4. Quy trình chi tiết

### Bước 0. Phân công ra đề

| Nội dung | Yêu cầu |
| --- | --- |
| Người xử lý | TBM hoặc người có quyền quản lý yêu cầu ra đề |
| Thông tin | Môn, học kỳ, giảng viên soạn, thời lượng, tổng điểm, hạn nộp |
| Đầu ra | Ví dụ `MAIN_1`: đề chính thức; `RESERVE_1`: đề dự phòng |
| Ma trận | Số câu theo dạng và độ khó, điểm theo phần; mục tiêu kiến thức nếu có dữ liệu |
| Kết quả | Yêu cầu được phát hành; người soạn nhận thông báo |
| Kiểm soát | Người soạn hoạt động, môn đúng phạm vi, đầu ra và ma trận hợp lệ |

Ma trận được lưu có cấu trúc và phiên bản. Thay đổi yêu cầu sau khi đã nộp phải thông báo và xác định lại hồ sơ bị ảnh hưởng. Không âm thầm áp tiêu chí mới lên bản đã duyệt.

Đề xuất hạn nộp: cho phép nộp muộn nhưng ghi rõ quá hạn và thời điểm thực tế; yêu cầu đã hủy không nhận hồ sơ mới. Người quản lý gia hạn có lý do và lịch sử. Quá hạn là chỉ báo theo thời gian, không cần thêm một trạng thái riêng làm mất trạng thái công việc.

### Bước 1. Soạn và nộp

| Nội dung | Yêu cầu |
| --- | --- |
| Người xử lý | Giảng viên được giao đầu ra |
| Soạn đề | Tận dụng editor, ngân hàng câu hỏi và sinh đề tự động hiện có |
| Kiểm tra | Số câu, tổng điểm, dạng câu, độ khó, thời lượng, đáp án/test case |
| Nộp | Chọn đầu ra của yêu cầu và bấm **Nộp kiểm duyệt** |
| Kết quả | Tạo hồ sơ `PENDING_REVIEW` gắn bản nội dung và ma trận đã nộp |
| Thông báo | TBM/người có quyền phân công của đúng môn |

Không thông qua tự động chỉ vì tác giả là TBM. Mỗi đầu ra có một hồ sơ đang xử lý; API nộp lại không tạo bản trùng khi người dùng bấm nhiều lần.

Mỗi bản gửi giữ đầy đủ câu hỏi, đáp án, điểm, phần thi và cấu hình lập trình. Trong lúc xử lý, tác giả không được thay đổi bản đó.

### Bước 2. Phân công kiểm duyệt

| Cơ chế | Cách thực hiện | Điều kiện |
| --- | --- | --- |
| TBM trực tiếp | Giao chính TBM làm người thẩm định | Không phải tác giả; có chuyên môn phù hợp |
| Một/tổ giảng viên | Chọn reviewer từ nhóm đúng môn | Mỗi người hoạt động, đủ quyền và không phải tác giả |
| Nhóm chưa có | TBM tạo nhóm theo môn rồi chọn reviewer | Thành viên nhóm và nhiệm vụ của hồ sơ được lưu riêng |

Phân công hoàn tất chuyển hồ sơ `UNDER_REVIEW`. Lưu phương thức `DIRECT_HEAD` hoặc `REVIEW_PANEL`, reviewer bắt buộc, người giao và hạn thẩm định.

Một nhóm có nhiều người nhưng chỉ người được giao cho hồ sơ cần xử lý. Không cấp quyền phê duyệt cuối chỉ vì giảng viên thuộc nhóm.

Không chuyển từ tổ sang nhánh trực tiếp để xóa hoặc bỏ qua yêu cầu sửa đã được nộp. Thay người phải có lý do, giữ ý kiến cũ và bảo đảm vấn đề được xử lý.

### Bước 3A. Thẩm định chuyên môn

- Reviewer xem đúng bản nội dung và ma trận của hồ sơ, gồm câu hỏi, đáp án và dữ liệu chấm.
- Đánh giá đạt/chưa đạt/không áp dụng theo tiêu chí.
- Có nhận xét chung và góp ý theo mã câu hỏi của bản đã gửi.
- Chọn **Thông qua chuyên môn** hoặc **Yêu cầu chỉnh sửa**.
- Khi có yêu cầu sửa, đóng các nhiệm vụ chưa hoàn thành của vòng đó, chuyển `REVISION_REQUIRED` và thông báo tác giả.
- Tác giả sửa bản nháp rồi gửi hồ sơ vòng mới; kết quả cũ không tự được tính vào vòng mới.
- Khi tất cả reviewer bắt buộc thông qua, chuyển `PENDING_DEPT_APPROVAL`.

Tiêu chí gồm tính đúng đắn, diễn đạt, cấu trúc, độ khó, thang điểm, thời lượng và dữ liệu chấm. Những mục chuẩn đầu ra chưa có dữ liệu trong SOES được xác nhận thủ công, không trình bày như kiểm tra tự động.

### Bước 3B. Phê duyệt bộ môn

| Nội dung | Yêu cầu |
| --- | --- |
| Người xử lý | TBM hoặc giảng viên được ủy quyền phê duyệt hợp lệ |
| Hồ sơ cần xem | Bản đề, kết quả từng reviewer, góp ý và lịch sử chỉnh sửa |
| Quyết định | **Phê duyệt bộ môn**, **Trả về chỉnh sửa**, **Từ chối** |
| Điều kiện | Đủ kết quả chuyên môn, không còn yêu cầu sửa, không phải tác giả |
| Kết quả thông qua | `APPROVED_BY_DEPT`; thông báo Khảo thí và tác giả |

Nhánh `DIRECT_HEAD` cho phép TBM thẩm định và phê duyệt cùng đề của người khác. Vẫn lưu hai quyết định riêng; có thể trình bày trên cùng trang theo hai bước. Không tự chuyển sang phê duyệt sau một phiếu thông qua.

Nhánh `REVIEW_PANEL` đề xuất người duyệt cuối độc lập với reviewer của hồ sơ. Giảng viên khác chỉ được quyết định cuối nếu có ủy quyền đúng phạm vi và còn hiệu lực.

Nếu TBM là tác giả, cần người thẩm định độc lập và người duyệt thay hợp lệ. Thiếu người có thẩm quyền thì hồ sơ chờ xử lý, không tự vượt bước.

### Bước 4. Khảo thí tiếp nhận và khóa bản đề

| Nội dung | Yêu cầu |
| --- | --- |
| Người xử lý | Admin được giao quyền Khảo thí |
| Điều kiện | Hồ sơ `APPROVED_BY_DEPT`, bản hiện tại khớp bản bộ môn đã duyệt |
| Kiểm tra | Thông tin môn/học kỳ, mã đầu ra, hồ sơ đủ quyết định, điểm/thời lượng và thể thức |
| Hành động | **Tiếp nhận & Khóa bản đề** hoặc **Trả về bổ sung** |
| Kết quả tiếp nhận | Hồ sơ `SEALED`; đề `READY`, lưu bản được tiếp nhận, người và thời điểm |
| Trả về | `ADMIN_REVISION_REQUIRED`, có lý do; sửa nội dung tạo vòng duyệt mới |

Khảo thí không thay thế thẩm định chuyên môn và không sửa đáp án/thang điểm trực tiếp. Các sửa đổi trên bản đề đã được duyệt phải quay lại quy trình đánh giá bản mới.

**Niêm phong trong phiên bản đầu** là khóa bản nội dung, giới hạn quyền truy cập, lưu mã kiểm tra nội dung và lịch sử. Đây không phải tính năng chữ ký số hoặc chứng nhận niêm phong pháp lý.

Bản đã khóa không được sửa, xóa hoặc mở khóa tùy ý. Đề thay thế được tạo thành bản có `examId` mới và duyệt lại; ca thi đang dùng bản cũ không đổi theo.

### Bước 5. Chọn đề và tổ chức ca thi

- Khảo thí/người có quyền tổ chức chọn bản đã tiếp nhận khi lập lịch.
- Kiểm tra môn/học kỳ của đề với lớp học phần theo logic hiện có.
- Lưu `examId` cụ thể cho ca; phiên bản đầu không bốc thăm lại lúc sinh viên vào thi.
- Đến giờ, ca chuyển trạng thái theo cơ chế lịch hiện có; backend chỉ cho sinh viên đủ điều kiện bắt đầu.
- Cùng một bản đề có thể gắn nhiều ca nếu chính sách tổ chức cho phép; kết thúc một ca không đổi trạng thái của mọi ca dùng đề.
- Kết quả và quyền xem lại bài tiếp tục theo cấu hình ca thi, không gộp vào trạng thái duyệt đề.

`PUBLISHED` không được thêm vào trạng thái đề để biểu diễn việc một ca đã mở. Giữ `SCHEDULED / OPEN / CLOSED` ở ca thi.


## 5. Trạng thái theo từng đối tượng

### 5.1 Yêu cầu ra đề (`ExamTask`)

| Trạng thái | Ý nghĩa |
| --- | --- |
| `DRAFT` | Chưa phát hành phân công |
| `ASSIGNED` | Đã giao cho giảng viên |
| `IN_PROGRESS` | Đang soạn hoặc xử lý các đầu ra |
| `COMPLETED` | Tất cả đầu ra bắt buộc đã được Khảo thí tiếp nhận |
| `CANCELLED` | Đã hủy bằng thao tác có lý do |

Trên danh sách hiển thị thêm số bản đã nộp/đã duyệt/đã tiếp nhận và cảnh báo hạn nộp. Không đặt mọi trạng thái thẩm định vào yêu cầu tổng vì các đầu ra có thể ở giai đoạn khác nhau.

### 5.2 Hồ sơ kiểm duyệt (`ExamApprovalRequest`)

| Trạng thái | Ý nghĩa | Người xử lý tiếp |
| --- | --- | --- |
| `PENDING_REVIEW` | Đã nộp, chờ chọn người thẩm định | TBM/người có quyền phân công |
| `UNDER_REVIEW` | Đã có reviewer, đang thẩm định | Reviewer được giao |
| `REVISION_REQUIRED` | Vòng này kết thúc với yêu cầu chỉnh sửa | Người soạn tạo vòng mới |
| `PENDING_DEPT_APPROVAL` | Đã đủ phiếu chuyên môn | TBM/người duyệt thay |
| `APPROVED_BY_DEPT` | Đã có quyết định bộ môn | Khảo thí |
| `ADMIN_REVISION_REQUIRED` | Khảo thí trả về bổ sung | Người soạn và TBM |
| `SEALED` | Khảo thí đã tiếp nhận và khóa | Người tổ chức thi |
| `REJECTED` | Vòng này bị từ chối có lý do | Theo dõi lịch sử; giao lại nếu cần |
| `WITHDRAWN` | Tác giả rút hồ sơ trước quyết định bộ môn | Theo dõi lịch sử |

Reviewer dùng **Yêu cầu chỉnh sửa** cho lỗi có thể khắc phục. Quyết định từ chối cuối vòng thuộc người có quyền phê duyệt bộ môn.

Hồ sơ gửi lại có `previousRequestId` và số phiên bản tăng. Bản cũ giữ trạng thái kết thúc và các quyết định; không xóa lý do hoặc ghi đè kết quả trước.

### 5.3 Trạng thái đề và ca thi hiện có

| Đối tượng | Cách tích hợp |
| --- | --- |
| `Exam.status` | Giữ enum `DRAFT / READY / LOCKED / ARCHIVED`; không dùng thay trạng thái hồ sơ |
| Đề chưa tiếp nhận | Chưa đủ điều kiện lập lịch theo quy trình mới |
| Đề đã tiếp nhận | `READY`, có liên kết hồ sơ `SEALED` và nội dung bị khóa |
| `Exam.approvalStatus` | Giữ tương thích; cập nhật từ kết quả hồ sơ, không dùng riêng trường này để vượt bước |
| `ExamSchedule.status` | Giữ `DRAFT / SCHEDULED / OPEN / CLOSED / CANCELLED` |

Không gán `LOCKED` để biểu diễn niêm phong nếu làm sai nghĩa hiện tại hoặc khiến điều kiện chọn đề `READY` không hoạt động. Khóa nội dung theo hồ sơ đã tiếp nhận và kiểm tra ở mọi API sửa.

## 6. Quy tắc ngoại lệ

| Tình huống | Cách xử lý |
| --- | --- |
| Tác giả là TBM | Không dùng nhánh trực tiếp; reviewer và người duyệt thay độc lập |
| Giảng viên thuộc nhóm nhưng chưa được giao | Không được mở hoặc quyết định hồ sơ |
| Đang có phiếu yêu cầu sửa | Không cộng các phiếu thông qua để bỏ qua phiếu này |
| Reviewer bị khóa/rời nhóm | Dừng quyết định mới, giữ lịch sử, giao lại nhiệm vụ chưa xong |
| TBM đổi hoặc ủy quyền bị thu hồi | Kiểm tra quyền mới ở thao tác tiếp theo; quyết định hợp lệ đã nộp vẫn giữ lịch sử |
| Thay reviewer | Lưu lý do, giữ nhận xét, bảo đảm không né yêu cầu sửa đã tồn tại |
| Đổi người soạn sau khi đã nộp | Giữ tác giả bản cũ; giao lại công việc cho bản mới, không sửa tác giả để lách tự duyệt |
| Ủy quyền hết hạn | Chặn quyết định mới; chuyển nhiệm vụ cho người có thẩm quyền |
| Người nhận ủy quyền muốn ủy quyền tiếp | Không hỗ trợ trong phiên bản đầu |
| Hai người cùng quyết định/niêm phong | Kiểm tra trạng thái trong transaction; chỉ một thao tác thành công |
| Sửa ma trận trong lúc duyệt | Lưu phiên bản yêu cầu mới, thông báo, trả lại hồ sơ ảnh hưởng để nộp lại |
| Một bản đạt, một bản dự phòng chưa đạt | Theo dõi từng đầu ra; yêu cầu tổng chưa hoàn thành đủ đầu ra |
| Đề đã được dùng trong ca thi | Không sửa tại chỗ; tạo bản thay thế mới và giữ bản cũ |
| Muốn thay đề của ca đã lên lịch | Chỉ trước khi có bài làm và trong trạng thái cho phép; kiểm tra lại đề đã tiếp nhận và ghi lý do |
| Hủy yêu cầu đang xử lý | Đóng nhiệm vụ mở có lý do; giữ hồ sơ, quyết định và thông báo |
| Đầu ra đã được dùng để tổ chức thi | Không hủy đơn giản; phải xử lý theo quy trình ca thi liên quan |

## 7. Dữ liệu đề xuất

### 7.1 Các mô hình

| Mô hình | Trách nhiệm | Trường chính dự kiến |
| --- | --- | --- |
| `ExamTask` | Yêu cầu phân công soạn đề | Môn, học kỳ, người giao/nhận, hạn, ma trận có phiên bản, trạng thái |
| `ExamTaskDeliverable` | Đầu ra bắt buộc của yêu cầu | Mã đầu ra, loại chính thức/dự phòng, liên kết bản nộp và bản được chấp nhận |
| `ExamReviewGroup` | Nhóm chuyên môn theo môn | Bộ môn, môn, tên nhóm, hiệu lực, trạng thái |
| `ExamReviewGroupMember` | Thành viên và điều phối | Nhóm, giảng viên, vai trò, hiệu lực/trạng thái |
| `ExamApprovalRequest` | Một vòng duyệt của một bản đề | Đề, đầu ra, phiên bản, nội dung gửi, phương thức thẩm định, trạng thái, quyết định bộ môn và tiếp nhận |
| `ExamReviewAssignment` | Một reviewer của một vòng | Người giao/nhận, hạn, trạng thái, tiêu chí, nhận xét theo câu, quyết định |
| `ExamWorkflowGrant` | Phân quyền/ủy quyền có phạm vi | Người được cấp, quyền, bộ môn/môn, học kỳ/hồ sơ nếu cần, người cấp, hiệu lực, thu hồi |

Đây là đề xuất cho phạm vi đầy đủ gồm yêu cầu nhiều đầu ra, nhóm và quyền Khảo thí. Chốt schema chi tiết ở task thiết kế dữ liệu, kiểm tra khả năng tái sử dụng trước khi thêm bảng.

`ExamWorkflowGrant` phục vụ cả quyền Khảo thí và ủy quyền duyệt bộ môn có phạm vi, với điều kiện cấp quyền khác nhau. Không tạo hệ thống RBAC tổng quát nếu dự án chưa cần.

Phân công reviewer trong `ExamReviewAssignment` đã xác định quyền thẩm định; không cần tạo thêm grant toàn hệ thống cho mỗi reviewer.

Các trường tiếp nhận/người tiếp nhận đặt trên hồ sơ; không cần thêm bảng niêm phong riêng. Tiêu chí và nhận xét theo câu có thể dùng JSON có schema Zod và mã câu trong snapshot, vì là nội dung đánh giá của hồ sơ.

### 7.2 Ràng buộc

- Yêu cầu có đầu ra ổn định theo `(taskId, deliverableCode)`; số lượng đề tính từ các đầu ra, không chỉ một con số không có bản tương ứng.
- Một đầu ra chỉ có một hồ sơ đang xử lý; mỗi lần gửi lại tạo vòng mới.
- Khi tạo bản thay thế có `examId` mới, đầu ra giữ lịch sử bản trước và chỉ một bản được chọn làm bản chấp nhận hiện hành.
- Assignment duy nhất theo `(requestId, reviewerId)`; quyết định chính thức không sửa trực tiếp.
- Góp ý trỏ đến mã câu của bản đã gửi, không chỉ số thứ tự có thể thay đổi sau chỉnh sửa.
- Hồ sơ lưu nội dung đầy đủ và ma trận tại lúc nộp; checksum không thay thế dữ liệu này.
- Bản Khảo thí tiếp nhận phải khớp bản bộ môn đã duyệt.
- Đề có liên kết hồ sơ tiếp nhận hiện hành, ví dụ `sealedApprovalRequestId`, để kiểm tra quyền sửa và lập lịch.
- Bản câu hỏi đang phục vụ thi khớp bản đã khóa; tận dụng `ExamQuestion`, đáp án và test case hiện có.
- Các API sửa metadata quan trọng, câu hỏi, section, điểm và cấu hình lập trình đều phải kiểm tra khóa.
- Mỗi ca gắn một `examId` ổn định; thêm phiên bản mới không làm đổi nội dung của ca cũ.
- Quyền được kiểm tra lại tại thời điểm xử lý, đồng thời lưu phạm vi/nguồn cấp quyền đã dùng trong nhật ký.
- Giữ cột duyệt cũ để tương thích trong đợt đầu; không xóa trước khi kiểm tra tất cả nơi sử dụng.

### 7.3 Lựa chọn tránh ảnh hưởng student

Ưu tiên giữ hợp đồng API làm bài hiện tại: ca thi vẫn đọc `Exam` và các câu hỏi của `examId` đã chọn. Đề sau tiếp nhận bị khóa; bản thay thế là đề mới. Như vậy không bắt buộc sửa UI student để triển khai luồng quản lý.

Phải kiểm thử việc bắt đầu ca và lấy câu hỏi không vượt thời gian/quyền hiện có. Nếu phát hiện cần đổi API student để bảo đảm tính toàn vẹn, ghi rõ thành task riêng trước khi thực hiện.

## 8. API dự kiến

### 8.1 Phân công và nhóm

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `GET /teacher/exam-tasks` | Danh sách công việc | Công việc được giao hoặc thuộc phạm vi quản lý |
| `POST /teacher/exam-tasks` | Tạo yêu cầu nháp | `MANAGE_EXAM_TASKS` |
| `POST /teacher/exam-tasks/:id/issue` | Phát hành phân công | Quyền quản lý, yêu cầu hợp lệ |
| `POST /teacher/exam-tasks/:id/extend-deadline` | Gia hạn có lý do | Quyền quản lý |
| `POST /teacher/exam-tasks/:id/cancel` | Hủy yêu cầu | Quyền quản lý và chưa ảnh hưởng ca đã tổ chức |
| `GET/POST /teacher/exam-review-groups`, `PATCH /teacher/exam-review-groups/:id` | Xem/quản lý nhóm | Kiểm tra phạm vi và quyền quản lý |
| `POST /teacher/exam-approval-delegations` | Ủy quyền duyệt bộ môn | TBM, phạm vi không vượt quyền đang có |
| `POST /teacher/exam-approval-delegations/:id/revoke` | Thu hồi có lý do | Người có quyền thu hồi |

### 8.2 Nộp, thẩm định và phê duyệt

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `POST /teacher/exams/:id/approval-requests` | Nộp bản đề | Người soạn được giao, đúng đầu ra, không có vòng đang mở |
| `GET /teacher/exam-approval-tasks` | Nhiệm vụ cần xử lý | Theo tài khoản và phạm vi |
| `GET /teacher/exam-approval-requests/:id` | Chi tiết hồ sơ | Tác giả/người được giao/người quản lý hợp lệ |
| `POST /teacher/exam-approval-requests/:id/assignments` | Giao thẩm định | Quyền phân công, trạng thái hợp lệ |
| `POST /teacher/exam-review-assignments/:id/decision` | Quyết định chuyên môn | Reviewer được giao, không phải tác giả |
| `POST /teacher/exam-approval-requests/:id/department-decision` | Quyết định bộ môn | TBM/ủy quyền còn hiệu lực, đủ kết quả |
| `POST /teacher/exam-approval-requests/:id/withdraw` | Rút hồ sơ | Tác giả, trước phê duyệt bộ môn |

Gửi lại dùng endpoint tạo hồ sơ với `previousRequestId`, tạo một vòng mới. Không cập nhật ghi đè lên hồ sơ đã kết thúc.

### 8.3 Khảo thí và tổ chức thi

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `GET /admin/exam-receptions` | Danh sách cần tiếp nhận/đã khóa | Quyền Khảo thí đúng phạm vi |
| `GET /admin/exam-receptions/:id` | Chi tiết tiếp nhận | Quyền đọc hồ sơ đúng phạm vi |
| `POST /admin/exam-receptions/:id/seal` | Tiếp nhận và khóa | Quyền Khảo thí, đã duyệt bộ môn, nội dung khớp |
| `POST /admin/exam-receptions/:id/return` | Trả bổ sung | Quyền Khảo thí, lý do bắt buộc |
| API danh sách đề đủ điều kiện hiện có | Chọn đề cho ca | Thêm điều kiện hồ sơ đã tiếp nhận |
| API tạo/sửa ca hiện có | Gắn bản đề vào ca | Quyền tổ chức, đề/môn/học kỳ hợp lệ |

Danh sách trả pagination, filter và capability theo dữ liệu thật. Các transition có điều kiện trạng thái trong transaction; retry không tạo quyết định hoặc thông báo trùng.


## 9. Thiết kế giao diện

| Khu vực | Người sử dụng | Nội dung chính |
| --- | --- | --- |
| **Phân công ra đề** | TBM/người quản lý | Yêu cầu theo môn/học kỳ, giảng viên, ma trận, hạn và tiến độ từng bản |
| **Công việc ra đề của tôi** | Giảng viên | Đầu ra được giao, nút soạn, xem trước, nộp và lịch sử phản hồi |
| **Kiểm duyệt đề thi** | Reviewer/TBM/người duyệt thay | Nhiệm vụ của tôi, hồ sơ quản lý, lịch sử |
| **Nhóm thẩm định & Ủy quyền** | TBM/người được quyền quản lý | Nhóm theo môn, thành viên, nhiệm vụ tồn và cấp/thu hồi quyền |
| **Tiếp nhận & Kho đề thi** | Khảo thí | Hồ sơ bộ môn đã duyệt, kiểm tra thể thức, khóa bản, tra cứu kho |
| **Quản lý ca thi** | Người tổ chức thi | Chọn bản đã tiếp nhận, gắn lớp và cấu hình ca hiện có |

### Chi tiết yêu cầu ra đề

- Thông tin yêu cầu ở đầu trang; bảng đầu ra thể hiện chính thức/dự phòng, người soạn, bản hiện hành, trạng thái, ngày nộp.
- Ma trận thể hiện số câu và điểm theo dạng/độ khó; báo tổng không hợp lệ ngay tại biểu mẫu.
- Hạn nộp có chỉ báo còn hạn/quá hạn và lịch sử gia hạn.
- Đầu ra chưa soạn có **Soạn đề**; bản bị trả về có **Xem góp ý & Chỉnh sửa**; bản đang duyệt chỉ xem.
- Tái sử dụng editor và preview hiện có; không tạo editor thứ hai cho yêu cầu ra đề.

### Chi tiết hồ sơ duyệt

- Mở trang riêng; quay lại đúng danh sách nguồn, giữ bộ lọc và trang.
- Hiển thị yêu cầu, loại bản, phiên bản, ma trận và thời điểm nộp.
- Khu nội dung đề có HTML đã xử lý qua component hiện có; đáp án chỉ cho người có quyền.
- Panel đánh giá theo vai trò, góp ý từng câu và lịch sử các vòng.
- Nhánh trực tiếp ghi rõ TBM là người thẩm định; hành động phê duyệt bộ môn xuất hiện sau thông qua chuyên môn.
- Nhánh tổ hiển thị ai đang chờ, ai thông qua, ai yêu cầu sửa; không tạo nút duyệt cuối cho reviewer thường.
- Hồ sơ kết thúc chỉ đọc; không để form quyết định còn hoạt động.

### Tiếp nhận và kho đề

- Dùng trang quản lý/tra cứu đề admin hiện có làm điểm tích hợp khi phù hợp.
- Hàng đợi **Chờ tiếp nhận**, danh sách **Đã khóa**, **Đã trả bổ sung**.
- Xem nội dung và hồ sơ duyệt trong trang chi tiết; biểu mẫu thể thức và nút tiếp nhận rõ ràng.
- Bảng kho có môn/học kỳ, mã đầu ra, phiên bản, ngày tiếp nhận và người tiếp nhận.
- Không hiển thị toàn bộ nội dung đề/đáp án trên bảng danh sách; chỉ tải khi mở chi tiết hợp lệ.

### Quy chuẩn UI

- Đồng bộ header, bảng, badge, thanh lọc, pagination và icon với teacher/admin.
- Bảng tránh xuống dòng tên người hoặc mã đề không cần thiết; nội dung dài có vùng phù hợp và xem chi tiết.
- Có loading, lỗi, rỗng và trạng thái đang lưu; chống bấm quyết định nhiều lần.
- Bộ đếm **Cần tôi xử lý** chỉ đếm nhiệm vụ đang chờ, không tính lịch sử.
- Mỗi component/hook/service dưới 400 dòng; tách theo trách nhiệm, không tạo abstraction chỉ để gom vài dòng.
- Không đổi bố cục hoặc nghiệp vụ của bảng bài nộp, phúc khảo và giám sát ngoài phạm vi kế hoạch.

## 10. Cấu trúc code dự kiến

| Module | Trách nhiệm |
| --- | --- |
| `exam-tasks` | Yêu cầu ra đề, đầu ra, ma trận, hạn và giao người soạn |
| `exam-approvals` | Nhóm, assignment, kết quả chuyên môn, quyết định bộ môn, ủy quyền, tiếp nhận và khóa |
| `teacher-exams` hiện có | Editor, câu hỏi trong đề, xem trước, tạo bản thay thế; tích hợp guard |
| `exam-schedules` hiện có | Chọn bản đủ điều kiện và gắn vào ca |
| `auth` hiện có | Quyền truy cập tổng quát; service hồ sơ kiểm tra quyền theo ngữ cảnh |
| `notifications`/AuditLog hiện có | Thông báo và lịch sử của các sự kiện |

Đăng ký route trong `be/soes-be/src/app.ts`. Không đẩy nghiệp vụ mới vào `server.ts` hoặc tiếp tục làm dài service đề thi.

Trong module, controller parse request và trả DTO; service điều phối policy; repository truy cập Prisma. Đặt kiểm tra quyền và transition ở policy dùng chung cho mọi endpoint thực hiện cùng hành động.

Đưa tiếp nhận vào module workflow với route admin riêng thay vì tạo thêm module kho chỉ làm lặp lại đọc/lọc đề.

## 11. Bảng task triển khai chi tiết

| Task | Công việc | File/vùng code | Kết quả cần đạt | Commit dự kiến |
| --- | --- | --- | --- | --- |
| 1 | Policy và bảng transition | `exam-approvals/services/exam-approval.policy.ts`, test tương ứng | Hai nhánh thẩm định rõ; cấm tác giả duyệt; quyền theo phạm vi | `test: define exam workflow authorization and transitions` |
| 2 | Thiết kế dữ liệu và migration | `prisma/schema.prisma`, migration mới có tên rõ | Yêu cầu, đầu ra, hồ sơ, phân công và quyền; giữ tương thích | `feat: add exam assignment and approval workflow schema` |
| 3 | BE yêu cầu ra đề | `modules/exam-tasks/{routes,controllers,validators,services,repositories,dtos}` | Tạo/phát hành, giao, gia hạn, hủy, ma trận có phiên bản | `feat: add exam authoring task management` |
| 4 | BE nhóm và ủy quyền | `modules/exam-approvals`, `auth/dtos/auth.dto.ts`, `auth/mappers/auth.mapper.ts` | Nhóm theo môn, grant đúng phạm vi, thu hồi và hết hạn | `feat: add subject review groups and scoped approval grants` |
| 5 | BE nộp và phân công | `teacher-exams.service.ts`, approval services/repositories | Bản hồ sơ đầy đủ, không trùng đầu ra, nhánh trực tiếp/tổ | `feat: add exam submission and reviewer assignment` |
| 6 | BE thẩm định và duyệt bộ môn | Approval policy/services, validators và DTO | Tiêu chí, góp ý từng câu, đủ phiếu, trả sửa, gửi lại và quyết định cuối | `feat: implement exam review and department approval` |
| 7 | BE tiếp nhận và khóa | Approval routes admin/services, lifecycle repository, các API sửa đề | Tiếp nhận đúng bản, khóa mọi đường sửa, bản thay thế có ID mới | `feat: add examination office reception and exam sealing` |
| 8 | BE tích hợp ca thi | `exam-schedule.service.ts`, `exam-schedule.repository.ts`; rà API lịch teacher | Mọi đường lập/sửa lịch kiểm tra đề hợp lệ; không vượt bước | `fix: require accepted exam versions for final exam scheduling` |
| 9 | Thông báo, nhật ký | `notifications`, audit helpers và workflow services | Đúng người, deep link, sau commit, không trùng | `feat: notify and audit exam workflow decisions` |
| 10 | FE phân công/ra đề | Trang mới, API/hooks/types; tích hợp `TeacherExamsPage.tsx`, `TeacherExamEditorPage.tsx` | Giảng viên thấy công việc và dùng editor hiện có để nộp | `feat: add teacher exam authoring task workspace` |
| 11 | FE kiểm duyệt | `TeacherDepartmentApprovalPage.tsx`, `components/exam-approval/*`, router/sidebar | Chi tiết riêng, tiêu chí, timeline, nhóm và ủy quyền | `feat: add teacher exam review and approval workspace` |
| 12 | FE Khảo thí | `AdminExamTrackingPage.tsx`, `components/exam-tracking/*`, trang chi tiết tiếp nhận | Hàng đợi, kiểm tra thể thức, kho bản đã khóa | `feat: add examination office reception workspace` |
| 13 | FE lựa chọn đề | `AdminExamSchedulesPage.tsx`, API lịch admin, picker/form lịch | Chỉ chọn bản đã tiếp nhận và đúng môn/học kỳ | `fix: align exam schedule selection with sealed versions` |
| 14 | Chuyển dữ liệu và nghiệm thu | Script/migration có kiểm tra, unit/integration/E2E | Không thay dữ liệu cũ; toàn luồng và các trường hợp ngoại lệ đạt | `test: verify exam workflow migration and end-to-end behavior` |

### Cách thực hiện từng task

1. Xác định contract và điều kiện thành công/thất bại trước khi chỉnh implementation.
2. Với task quyền, transition, phiên bản và migration, viết test hành vi có ý nghĩa trước.
3. Implement trong phạm vi task; kiểm tra các route cũ có thể bỏ qua guard.
4. Chạy test liên quan và kiểm tra TypeScript; UI kiểm tra ở desktop/mobile theo mức phù hợp.
5. Rà diff và chỉ commit file của task; không đưa `.env` hoặc thay đổi của người khác vào commit.

Task 2 chỉ chạy sau khi chốt schema. Task 7 phải xong trước khi bật yêu cầu niêm phong cho ca mới. Task 10–13 có thể phát triển khi DTO đã ổn định, nhưng kích hoạt toàn luồng sau nghiệm thu.

## 12. Thông báo, lịch sử và hiệu năng

### Sự kiện

| Sự kiện | Người nhận |
| --- | --- |
| Phát hành yêu cầu ra đề | Người soạn được giao |
| Gia hạn/đổi yêu cầu | Người soạn và người quản lý liên quan |
| Nộp đề | TBM/người phân công đúng môn |
| Giao thẩm định | Reviewer |
| Yêu cầu sửa | Tác giả và người quản lý |
| Đủ phiếu chuyên môn | Người có quyền quyết định bộ môn |
| Bộ môn phê duyệt | Tác giả và Khảo thí đúng phạm vi |
| Khảo thí trả bổ sung/tiếp nhận | Tác giả và TBM |
| Reviewer mất quyền/ủy quyền thu hồi | Người quản lý nhiệm vụ để giao lại |

Nhật ký ghi actor, nguồn quyền, đối tượng, phiên bản, trạng thái trước/sau, thời gian và lý do. Quyết định đã nộp giữ nguyên; thay đổi sau đó là sự kiện mới.

Thông báo và trạng thái ghi trong transaction, sự kiện thời gian thực phát sau commit. Tái sử dụng cơ chế hiện tại; có tải lại dữ liệu khi mở trang để không phụ thuộc hoàn toàn vào việc nhận sự kiện.

### Truy vấn và tải dữ liệu

- Pagination/filter phía server cho công việc, nhiệm vụ và kho; giới hạn page size.
- Chỉ tải snapshot câu hỏi/đáp án khi mở hồ sơ, không include vào toàn bộ danh sách.
- Tính số nhiệm vụ chờ theo cùng điều kiện quyền với danh sách.
- Index theo truy vấn thực tế: assignee + trạng thái, reviewer + trạng thái, môn/học kỳ, ngày nộp và hạn.
- Tránh truy vấn lặp cho từng dòng; select rõ trường và dùng truy vấn tổng hợp khi phù hợp.
- Reuse hook/API hiện có khi contract tương thích; không tạo hai nơi cùng xử lý state workflow.
- Bộ lọc tìm kiếm có debounce; refresh giữ dữ liệu cũ trong lúc tải lại nếu phù hợp.

## 13. Chuyển dữ liệu cũ và phát hành

| Dữ liệu cũ | Cách xử lý |
| --- | --- |
| Đề nháp | Giữ nháp; đề cuối kỳ mới nộp theo chính sách mới phải gắn yêu cầu hợp lệ |
| Đề đang `PENDING` | Tạo hồ sơ kế thừa chờ phân công; liên kết vào yêu cầu chuyển đổi có nguồn rõ |
| Đề đã `APPROVED` chưa lập ca | Đánh dấu duyệt theo quy trình cũ; Khảo thí tiếp nhận bản hiện có trước khi tạo ca mới |
| Đề đã dùng/đã gắn ca | Giữ hiệu lực và nội dung hiện tại; kiểm thử không chặn ca cũ |
| Đề bị từ chối | Giữ người, thời điểm và lý do còn có; không dựng nhận xét chuyên môn |
| Thiếu snapshot lịch sử | Ghi rõ chỉ có bản tại thời điểm chuyển đổi, không giả định đó là bản đã duyệt ngày trước |

- Không tạo dữ liệu phân công lịch sử giả cho đề cũ. Yêu cầu chuyển đổi nếu cần có trường nguồn và ghi chú, không gửi như phân công mới.
- Không kết luận tự duyệt nếu dữ liệu không đủ chứng minh.
- Ngoại lệ tương thích của ca cũ chỉ áp dụng đối tượng được đánh dấu cụ thể khi chuyển đổi; không tạo quyền bỏ qua quy trình cho ca mới.
- Kiểm tra số lượng trước/sau và bản ghi không ánh xạ được; lưu báo cáo để xem xét trước khi phát hành.
- Giữ trường cũ và DTO tương thích cho các màn hình liên quan trong đợt đầu.
- Chỉ loại bỏ route duyệt một cấp sau khi route mới và UI đã sẵn sàng. Trong thời gian chuyển tiếp, route cũ phải gọi chung policy và không được bỏ qua bước.
- Không tự chạy migrate hoặc sửa DB khi chỉ đang cập nhật tài liệu kế hoạch.

## 14. Kiểm thử và tiêu chí nghiệm thu

### Các kịch bản bắt buộc

| Nhóm | Kịch bản cần kiểm tra |
| --- | --- |
| Phân công | Đúng môn/học kỳ, đủ đầu ra, đổi hạn có lịch sử, nộp muộn có chỉ báo |
| Soạn | Đúng người được giao, ma trận và điểm hợp lệ, không nộp trùng đầu ra |
| Quyền | Sai bộ môn/môn/hồ sơ bị từ chối; thành viên nhóm chưa được giao không có quyền |
| Nhánh trực tiếp | TBM không phải tác giả có thể thẩm định; quyết định bộ môn ghi riêng |
| Nhánh tổ | Reviewer thông qua chưa làm đề thành đã duyệt bộ môn; tất cả phiếu bắt buộc cần đủ |
| Trả sửa | Một phiếu yêu cầu sửa chặn bước sau; gửi lại là vòng mới, giữ góp ý theo bản cũ |
| Tự duyệt | Tác giả thường/TBM/người được ủy quyền đều không duyệt bản mình tạo |
| Ủy quyền | Đúng phạm vi, hiệu lực, thu hồi; không được ủy quyền tiếp hoặc vượt quyền |
| Tiếp nhận | Admin không có quyền không tiếp nhận; đúng bản đã duyệt mới khóa được |
| Khóa nội dung | Mọi đường sửa câu hỏi, metadata quan trọng, section, điểm và test case bị chặn sau khóa |
| Lập lịch | Tạo/sửa ca mới không chọn đề chưa tiếp nhận; đúng môn/học kỳ/lớp |
| Đồng thời | Nộp/duyệt/khóa nhiều lần không sinh hồ sơ hoặc quyết định trùng |
| Thông báo | Đúng người, đúng deep link, không phát khi rollback, số chờ giảm đúng |
| Dữ liệu cũ | Ca đang dùng và kết quả bài làm không thay đổi sau chuyển đổi |
| Student | Lấy câu hỏi đúng ca, đúng thời gian; không lộ đáp án ngoài chính sách xem lại bài |

### Kiểm tra bằng công cụ hiện có

BE hiện chưa có npm script test nghiệp vụ thực sự (`npm test` là placeholder). Chọn runner phù hợp với test Node/TypeScript trong dự án khi triển khai; không coi chạy placeholder là đã kiểm thử.

Sau khi có test policy, có thể dùng Node test runner với ts-node cho test tương ứng, nếu giữ cấu hình tương thích:

```powershell
cd D:\KLTN\smart-exam-system\be\soes-be
node -r ts-node/register --test src/modules/exam-approvals/services/exam-approval.policy.test.ts
npx tsc --noEmit
```

FE kiểm tra TypeScript và build theo script hiện có:

```powershell
cd D:\KLTN\smart-exam-system\fe\soes-fe
npm run build
```

Chạy ESLint trên file thay đổi; integration test dùng DB kiểm thử riêng. Kiểm thử UI bằng browser/Playwright cho hai nhánh duyệt và trang tiếp nhận, cả dữ liệu dài, loading và quyền không hợp lệ.

Migration chỉ áp dụng sau khi file SQL đã được review trên môi trường kiểm thử. Không dùng `migrate dev` chỉ để cập nhật client khi chưa có ý định tạo migration.

### Nghiệm thu toàn luồng

1. TBM giao một đề chính thức và một đề dự phòng cho giảng viên.
2. Giảng viên nộp cả hai bản, hệ thống theo dõi từng đầu ra.
3. Một bản được TBM thẩm định trực tiếp; bản còn lại được giao tổ.
4. Tổ yêu cầu sửa một câu, giảng viên gửi bản mới và reviewer đánh giá lại.
5. TBM quyết định bộ môn; Khảo thí chỉ thấy hồ sơ đúng phạm vi đã đạt bước này.
6. Khảo thí tiếp nhận, khóa bản; yêu cầu tổng hoàn thành khi đủ đầu ra bắt buộc.
7. Người tổ chức chọn bản hợp lệ vào ca; sinh viên làm bài theo API hiện có.
8. Tạo đề thay thế không làm thay nội dung và kết quả của ca đã dùng bản cũ.

## 15. Thứ tự ưu tiên và chức năng để sau

| Giai đoạn | Nội dung |
| --- | --- |
| 1. Nền tảng nghiệp vụ | Policy, yêu cầu ra đề, nhóm, quyền, hồ sơ và phân công |
| 2. Đủ chu trình | Thẩm định, duyệt bộ môn, tiếp nhận, khóa bản và tích hợp lịch |
| 3. Trải nghiệm hoàn chỉnh | UI đồng bộ, thông báo, lịch sử, báo cáo tiến độ, chuyển dữ liệu và E2E |
| Sau khi ổn định | Bốc thăm đề, nhóm nhiều môn, đánh giá nâng cao, chữ ký số nếu có yêu cầu |

Phiên bản đầu ưu tiên một quy trình rõ và đầy đủ, dùng editor/câu hỏi/ca thi hiện có. Bốc thăm, chữ ký số hoặc kiểm tra chuẩn đầu ra tự động chưa có dữ liệu không nằm trong tiêu chí hoàn thành phiên bản này.

## 16. Các điểm chính sách cần đối chiếu trước khi code

| Điểm | Phương án ghi trong kế hoạch |
| --- | --- |
| Người quản lý học thuật | TBM; không thêm Phó bộ môn |
| TBM trực tiếp thẩm định và duyệt | Có với đề người khác, có chuyên môn phù hợp; lưu hai quyết định |
| Tổ thẩm định | Tất cả người được giao bắt buộc thông qua |
| Giảng viên duyệt bộ môn thay TBM | Chỉ với ủy quyền hợp lệ và không phải tác giả/reviewer của nhánh tổ |
| Khảo thí | Admin có quyền tiếp nhận riêng, không phải mọi Admin |
| Hạn nộp | Cho nộp muộn có ghi nhận; không nộp vào yêu cầu đã hủy |
| Sửa sau khóa | Tạo bản đề mới, duyệt lại; ca cũ giữ bản đã chọn |
| Đề cũ | Có chính sách chuyển đổi riêng, không dựng lịch sử chưa từng lưu |

Các phương án này làm cơ sở để nhóm trao đổi với thầy. Thay đổi chính sách phải được phản ánh đồng thời trong policy, UI và test, không chỉ sửa mô tả hoặc ẩn nút.
