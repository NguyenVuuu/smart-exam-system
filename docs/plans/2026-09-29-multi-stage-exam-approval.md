# Kế hoạch triển khai quy trình ra đề, kiểm duyệt và tiếp nhận đề thi

**Cập nhật nghiệp vụ:** 01/10/2026. Bản này thay thế chính sách thẩm định trực tiếp và không có Phó bộ môn của bản trước.

**Mục tiêu:** Quản lý đầy đủ từ phân công ra đề, soạn và nộp, thẩm định chuyên môn, phê duyệt bộ môn, tiếp nhận của Khảo thí đến sử dụng đề trong ca thi.

**Phạm vi:** Áp dụng quy trình mới cho đề cuối kỳ (`FINAL`). Đề giữa kỳ và quiz giữ chính sách hiện tại. Giữ cấu trúc `Department` (Bộ môn) → `Subject` (Môn học); không thêm Khoa, Trưởng khoa. Bổ sung chức vụ Phó bộ môn (`DEPUTY_DEPARTMENT_HEAD`) trong tài khoản giảng viên.

**Mô hình được chọn:** Tách người ra đề, người thẩm định và người phê duyệt cuối. Trưởng bộ môn (TBM) hoặc Phó bộ môn (PBM) có thể tham gia tổ thẩm định khi được giao, phù hợp chuyên môn và không là tác giả/người duyệt cuối. Đề do TBM soạn chuyển PBM có quyền điều phối và phê duyệt; đề do PBM soạn chuyển TBM. Khảo thí tiếp nhận và khóa đúng bản đã duyệt.

**Kiến trúc:** Tái sử dụng tài khoản giảng viên, bộ môn, editor và ca thi hiện có; bổ sung module yêu cầu ra đề và module hồ sơ duyệt. Backend kiểm tra quyền, phân công, phiên bản và xung đột nhiệm vụ trong mỗi thao tác; FE hiển thị hành động theo capability từ backend.

**Công nghệ:** Express, TypeScript, Prisma, PostgreSQL, React, Zustand, Zod; tái sử dụng thông báo, nhật ký hoạt động và cấu trúc câu hỏi trong đề hiện có.

**Tình trạng tài liệu:** Đặc tả nghiệp vụ và kế hoạch triển khai SOES đã chốt theo trao đổi; không phải báo cáo các chức năng đã hoàn thành hoặc quy định bắt buộc cho mọi trường. Đơn vị sử dụng xác lập thẩm quyền bổ nhiệm/duyệt thay; Admin ghi nhận căn cứ và cấu hình quyền tương ứng. Quyết định tổ chức bên ngoài hệ thống không đòi hỏi thêm tầng Khoa vào dữ liệu.

## 1. Hiện trạng đã đối chiếu với source

| Nội dung | Hiện trạng | Điều cần bổ sung |
| --- | --- | --- |
| Vai trò tài khoản | Admin, Teacher, Student | Giữ nguyên; phân quyền nghiệp vụ theo phạm vi |
| Đơn vị chuyên môn | `Department` quản lý `Teacher` và `Subject`; chưa có Khoa | Giữ bộ môn là cấp quản lý cao nhất trong phạm vi SOES |
| Chức vụ giảng viên | `LECTURER`, `DEPARTMENT_HEAD` | Thêm `DEPUTY_DEPARTMENT_HEAD`; bổ nhiệm, gỡ chức vụ và quyền duyệt thay theo bộ môn |
| Phân công ra đề | Chưa có đối tượng yêu cầu ra đề trong schema đã đọc | Yêu cầu, người soạn, đầu ra, ma trận và hạn nộp |
| Duyệt đề cuối kỳ | Một bước Trưởng bộ môn duyệt | Phân công thẩm định và quyết định bộ môn |
| Đề của Trưởng bộ môn | Nhánh gửi đề tự chuyển `APPROVED` và `READY` | Bỏ tự duyệt, có người xử lý độc lập |
| Kết quả duyệt | Một bộ trường người duyệt, ngày duyệt, lý do | Lưu từng hồ sơ, từng reviewer và từng phiên bản |
| Câu hỏi trong đề | `ExamQuestion` có bản sao nội dung, đáp án và cấu hình | Tận dụng khi soạn; bổ sung bản hồ sơ gửi duyệt và khóa khi tiếp nhận |
| Lập lịch tập trung | Đề `FINAL`, `READY`, `APPROVED`; lớp cùng môn và học kỳ | Kiểm tra thêm bản được Khảo thí tiếp nhận hợp lệ |
| Trạng thái ca thi | `DRAFT / SCHEDULED / OPEN / CLOSED / CANCELLED` | Giữ; việc mở thi thuộc ca thi |

Các điểm tích hợp chính:

- `be/soes-be/prisma/schema.prisma`
- `be/soes-be/src/modules/admin-academic/services/department.service.ts`
- `be/soes-be/src/modules/admin-academic/repositories/department.repository.ts`
- `be/soes-be/src/modules/auth/mappers/auth.mapper.ts`
- `be/soes-be/src/modules/teacher-exams/services/teacher-exams.service.ts`
- `be/soes-be/src/modules/teacher-exams/repositories/teacher-exam-lifecycle.repository.ts`
- `be/soes-be/src/modules/teacher-exams/repositories/exam-question-snapshot.repository.ts`
- `be/soes-be/src/modules/exam-schedules/services/exam-schedule.service.ts`
- `be/soes-be/src/app.ts`
- `fe/soes-fe/src/pages/teacher/TeacherDepartmentApprovalPage.tsx`
- `fe/soes-fe/src/pages/admin/AdminDepartmentsSubjectsPage.tsx`
- `fe/soes-fe/src/pages/admin/components/academic/DepartmentHeadModal.tsx`
- `fe/soes-fe/src/pages/teacher/utils/teacher-account.utils.ts`

## 2. Các quyết định nghiệp vụ

| Nội dung | Chính sách cho phiên bản đầu |
| --- | --- |
| Loại đề áp dụng | Đề cuối kỳ |
| Chủ trì hồ sơ thông thường | TBM phụ trách môn, không phải tác giả |
| Hồ sơ do TBM soạn | PBM có quyền điều phối và duyệt thay; TBM không tự phân công/ủy quyền cho hồ sơ mình soạn |
| Hồ sơ do PBM soạn | TBM điều phối và duyệt; PBM chỉ làm nhiệm vụ tác giả |
| Nhóm chuyên môn | Nhóm theo bộ môn và môn học, có thời gian hiệu lực |
| Cách thẩm định | Một hoặc nhiều người được giao theo hồ sơ; cùng một quy trình, không còn ngoại lệ tự thẩm định rồi duyệt cuối |
| Số reviewer | Tối thiểu một người; có thể nhiều người theo phân công |
| Điều kiện thông qua | Tất cả reviewer bắt buộc của vòng duyệt thông qua cùng phiên bản |
| Ý kiến yêu cầu sửa | Chặn chuyển sang phê duyệt bộ môn |
| Người phê duyệt bộ môn | Một người được xác định trên hồ sơ: TBM/PBM đủ quyền hoặc giảng viên được ủy quyền hợp lệ |
| Kiêm thẩm định và phê duyệt | Không cho phép trên cùng hồ sơ và các vòng nộp lại của hồ sơ đó |
| TBM/PBM trong tổ thẩm định | Được, nếu đủ chuyên môn, có assignment và không thuộc tập tác giả/người duyệt cuối |
| Tự duyệt đề mình tạo | Cấm cả tác giả, đồng tác giả và đổi chức vụ/tài khoản hồ sơ để lách kiểm tra |
| Phân công và ủy quyền | Người quản lý hợp lệ, không phải tác giả của hồ sơ; quyền giao thẩm định khác quyền giao duyệt cuối |
| Thiếu người hợp lệ | Hồ sơ chờ phân công hoặc phân công lại; không tự vượt bước hoặc cấp quyền duyệt cho Admin |
| Tiếp nhận | Tài khoản Admin được giao quyền Khảo thí |
| Điều kiện sử dụng | Được duyệt bộ môn, Khảo thí tiếp nhận và khóa, đủ điều kiện kỹ thuật |
| Đề chính thức/dự phòng | Đầu ra riêng, mỗi đầu ra duyệt độc lập |
| Bốc thăm đề | Để giai đoạn sau; phiên bản đầu chọn rõ bản đề khi tạo ca |

### 2.1 Tuyến xử lý theo người ra đề

| Người ra đề | Điều phối/phân công thẩm định | Người thẩm định | Phê duyệt cuối |
| --- | --- | --- | --- |
| Giảng viên | TBM; PBM khi được giao quyền điều phối | Giảng viên, TBM hoặc PBM hợp lệ | TBM hoặc người duyệt thay hợp lệ, khác reviewer |
| TBM | PBM có quyền điều phối; tác giả không tự lựa chọn người duyệt cuối | Giảng viên độc lập, không phải tác giả hoặc người duyệt cuối | PBM có quyền duyệt thay |
| PBM | TBM | Giảng viên độc lập, không phải tác giả hoặc người duyệt cuối | TBM |
| TBM là reviewer của đề giảng viên khác | TBM/PBM không phải tác giả | TBM và các reviewer được giao | PBM đủ quyền hoặc người được ủy quyền độc lập |
| PBM là reviewer của đề giảng viên khác | TBM/PBM không phải tác giả | PBM và các reviewer được giao | TBM hoặc người được ủy quyền độc lập |

Ví dụ hợp lệ: A soạn, B và PBM thẩm định, TBM phê duyệt. Ví dụ không hợp lệ: TBM soạn, B thẩm định, TBM phê duyệt; hoặc A soạn, TBM vừa thẩm định vừa phê duyệt.

### 2.2 Phạm vi bổ nhiệm và ủy quyền

- Phiên bản đầu: mỗi bộ môn tối đa một TBM và một PBM đang được ghi nhận; mỗi giảng viên giữ một chức vụ trong bộ môn hiện tại. Không xây dựng cơ chế kiêm nhiều chức vụ/đơn vị trong đợt này.
- Admin có quyền quản lý nhân sự bổ nhiệm/gỡ chức vụ theo quyết định đơn vị. Không tự suy ra người duyệt từ tài khoản Admin hoặc tự bổ nhiệm thay mặt đơn vị khi chưa có căn cứ.
- PBM được ghi nhận quyền điều phối và duyệt thay theo phạm vi, thời hạn và căn cứ phân công; chỉ thêm nhãn chức vụ không đủ để quyết định hồ sơ.
- TBM/PBM chỉ cấp ủy quyền cho giảng viên nếu bản thân có quyền cấp đó, trong phạm vi còn hiệu lực và không phải tác giả của hồ sơ liên quan. Người nhận ủy quyền duyệt không tự có quyền ủy quyền tiếp hoặc quản lý nhóm.
- Trường hợp thiếu PBM, TBM và PBM cùng soạn, hoặc người còn lại không đủ điều kiện: chỉ dùng người điều phối/người duyệt thay đã được giao quyền độc lập hợp lệ. Nếu chưa có, chờ đơn vị phân công và Admin ghi nhận; không tạo thêm Khoa và không tự chọn một giảng viên bất kỳ.
- Bổ nhiệm, thay đổi phạm vi, hết hạn hoặc thu hồi quyền phải có lịch sử. Các hồ sơ bị ảnh hưởng hiển thị thiếu người xử lý để phân công lại.
- Số người tối thiểu của một hồ sơ là ba: một tác giả, ít nhất một reviewer và một người duyệt cuối độc lập. Điều phối viên có thể là người duyệt cuối hoặc reviewer; không tạo thêm người chỉ để đủ một chức danh trên sơ đồ.

## 3. Phân role theo lớp nghiệp vụ

### 3.1 Ba lớp quyền

| Lớp | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Vai trò tài khoản | Nhóm truy cập cổng chức năng | `TEACHER`, `ADMIN`, `STUDENT` |
| Chức vụ | Trách nhiệm quản lý trong bộ môn | `LECTURER`, `DEPARTMENT_HEAD`, `DEPUTY_DEPARTMENT_HEAD` |
| Nhiệm vụ và quyền theo hồ sơ | Hành động được thực hiện trên một đối tượng cụ thể | Người được giao soạn, reviewer đề A, người duyệt thay môn B, cán bộ tiếp nhận |

Một giảng viên vẫn là `TEACHER`, nhưng có thể soạn đề A và thẩm định đề B. Thành viên nhóm không tự có quyền xem mọi đề của bộ môn.

Quyền soạn được xác định từ yêu cầu ra đề được giao. Quyền duyệt có phạm vi bộ môn → môn → hồ sơ, kèm học kỳ và hiệu lực khi cần. Việc dạy một lớp học phần không tự cấp quyền phê duyệt đề môn đó.

### 3.2 Ma trận quyền

| Hành động | Người ra đề | Reviewer | TBM | PBM | Giảng viên duyệt thay | Admin có quyền Khảo thí |
| --- | --- | --- | --- | --- | --- | --- |
| Tạo/phát hành yêu cầu | Không mặc định | Không mặc định | Trong phạm vi | Khi có quyền quản lý | Chỉ khi có quyền quản lý riêng | Không mặc định |
| Soạn và nộp | Đầu ra được giao | Không sửa thay tác giả | Khi là người soạn | Khi là người soạn | Khi là người soạn | Không |
| Tạo nhóm | Không tự có | Không tự có | Trong phạm vi | Có quyền quản lý nhóm | Không tự có | Không mặc định |
| Giao reviewer/người duyệt cuối | Không trên đề mình soạn | Không tự có | Là điều phối viên hợp lệ | Là điều phối viên hợp lệ | Chỉ có thêm quyền điều phối riêng | Không mặc định |
| Thẩm định | Không | Có assignment hợp lệ | Có assignment, không phải tác giả/người duyệt cuối | Cùng điều kiện với TBM | Chỉ nếu làm reviewer và không duyệt cuối hồ sơ đó | Không |
| Phê duyệt bộ môn | Không | Không trên hồ sơ đã thẩm định | Là người duyệt cuối hợp lệ | Là người duyệt cuối, có quyền duyệt thay | Có assignment và ủy quyền hợp lệ | Không |
| Tiếp nhận, khóa đề | Không | Không | Theo dõi | Theo dõi | Theo dõi | Có, đúng phạm vi |
| Chọn đề cho ca | Không tự có | Không tự có | Theo quyền tổ chức thi | Theo quyền tổ chức thi | Không tự có từ quyền duyệt | Cần quyền tổ chức thi riêng |
| Cấp/thu hồi ủy quyền | Không trên hồ sơ mình soạn | Không tự có | Trong thẩm quyền | Khi được giao quyền cấp riêng | Không ủy quyền tiếp | Không tự có quyền học thuật |

Quyền đọc nội dung/đáp án giới hạn theo nhiệm vụ và phạm vi của hồ sơ. Cấm xung đột nhiệm vụ có ưu tiên cao hơn quyền chức vụ hoặc grant. Tác giả vẫn được xem đề mình soạn và góp ý, nhưng không được thay đổi phân công duyệt của hồ sơ đó.

Admin quản lý tài khoản có thể thiết lập quyền Khảo thí, nhưng quyền quản trị tài khoản không tự đồng nghĩa có quyền đọc đáp án hoặc phê duyệt học thuật.

### 3.3 Danh mục quyền dự kiến

| Quyền | Phạm vi và điều kiện |
| --- | --- |
| `MANAGE_EXAM_TASKS` | Quản lý yêu cầu ra đề theo bộ môn/môn |
| `MANAGE_EXAM_REVIEW_GROUPS` | Quản lý nhóm chuyên môn đúng phạm vi |
| `ASSIGN_EXAM_REVIEWERS` | Giao người thẩm định từng hồ sơ |
| `REVIEW_EXAM` | Từ assignment còn hiệu lực; không cấp toàn hệ thống |
| `ASSIGN_EXAM_FINAL_APPROVER` | Điều phối viên xác định người duyệt cuối đủ quyền và không xung đột; không đồng nghĩa cấp quyền học thuật |
| `APPROVE_DEPARTMENT_EXAM` | TBM/PBM hoặc grant hợp lệ; phải là người duyệt cuối của hồ sơ và chưa thẩm định hồ sơ đó |
| `DELEGATE_EXAM_APPROVAL` | TBM/PBM có thẩm quyền cấp riêng, không cấp vượt quyền và không cấp cho hồ sơ mình soạn |
| `ACCEPT_AND_SEAL_EXAM` | Admin có quyền Khảo thí theo phạm vi |
| Quyền lập lịch hiện có | Kết hợp điều kiện đề đã tiếp nhận; không tự gộp vào quyền duyệt |

Tên quyền là đề xuất; tích hợp với permission hiện có thay vì tạo danh mục trùng. Backend đọc lại tài khoản, chức vụ, phạm vi, trạng thái, assignment, lịch sử tham gia và hiệu lực tại thời điểm quyết định; không chỉ tin JWT hoặc nút trên FE. Đối chiếu danh tính bằng `User.id` khi tài khoản có nhiều hồ sơ vai trò.

## 4. Quy trình chi tiết

### Bước 0. Phân công ra đề

| Nội dung | Yêu cầu |
| --- | --- |
| Người xử lý | TBM/PBM hoặc người có quyền quản lý yêu cầu ra đề; nếu giao cho chính TBM soạn thì PBM hợp lệ phát hành |
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
| Thông báo | Điều phối viên hợp lệ của hồ sơ; TBM là tác giả thì chuyển PBM |

Không thông qua tự động vì tác giả là TBM/PBM. Mỗi đầu ra có một hồ sơ đang xử lý; API nộp lại không tạo bản trùng khi người dùng bấm nhiều lần. Nộp đề thiếu người duyệt thay vẫn lưu hồ sơ `PENDING_REVIEW`, kèm lý do chờ phân công; không mất bản đã nộp.

Mỗi bản gửi giữ đầy đủ câu hỏi, đáp án, điểm, phần thi và cấu hình lập trình. Trong lúc xử lý, tác giả không được thay đổi bản đó.

### Bước 2. Phân công kiểm duyệt

| Nội dung | Quy định |
| --- | --- |
| Người phân công | Điều phối viên hợp lệ, không phải tác giả; áp dụng tuyến xử lý ở mục 2.1 |
| Chọn reviewer | Một/nhiều người đủ chuyên môn từ nhóm đúng môn, đang hoạt động và không phải tác giả/người duyệt cuối |
| TBM/PBM tham gia | Được chọn làm reviewer khi đủ điều kiện như giảng viên khác; không đồng thời duyệt cuối |
| Chọn người duyệt cuối | Xác định trước một người đủ thẩm quyền, độc lập với tập tác giả và reviewer |
| Nhóm chưa có | Người có quyền tạo nhóm theo môn, sau đó giao thành viên xử lý từng hồ sơ |
| Không đủ người | Giữ chờ phân công, trả lý do thiếu điều phối viên/reviewer/người duyệt cuối; không giảm điều kiện |

Chỉ chuyển `UNDER_REVIEW` khi có điều phối viên, ít nhất một reviewer bắt buộc và một người duyệt cuối hợp lệ. Lưu người giao, reviewer bắt buộc, người duyệt cuối, nguồn quyền và hạn xử lý. Không sử dụng `DIRECT_HEAD`; số reviewer bằng một hoặc nhiều không làm thay đổi nguyên tắc phân tách nhiệm vụ.

Một nhóm có nhiều người nhưng chỉ người được giao cho hồ sơ cần xử lý. Không cấp quyền phê duyệt cuối chỉ vì giảng viên thuộc nhóm.

Không đổi người, rút assignment hoặc tạo vòng mới để xóa lịch sử tham gia và lách xung đột nhiệm vụ. Thay người phải có lý do, giữ ý kiến cũ và bảo đảm yêu cầu sửa được xử lý. Điều phối viên có thể kiêm reviewer hoặc người duyệt cuối khi hợp lệ, nhưng không kiêm cả hai.

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
| Người xử lý | Người duyệt cuối đã được giao trên hồ sơ: TBM/PBM hoặc giảng viên được ủy quyền hợp lệ |
| Hồ sơ cần xem | Bản đề, kết quả từng reviewer, góp ý và lịch sử chỉnh sửa |
| Quyết định | **Phê duyệt bộ môn**, **Trả về chỉnh sửa**, **Từ chối** |
| Điều kiện | Đủ kết quả chuyên môn của cùng phiên bản, không còn yêu cầu sửa; không phải tác giả/đồng tác giả, không có lịch sử thẩm định trong chuỗi hồ sơ; quyền còn hiệu lực |
| Kết quả thông qua | `APPROVED_BY_DEPT`; thông báo Khảo thí và tác giả |

TBM/PBM đã thẩm định thì không được duyệt cuối hồ sơ đó, kể cả khi chỉ có một reviewer. Đề của TBM do PBM đủ quyền quyết định sau thẩm định độc lập; không có bước quay lại TBM duyệt cuối. Đề của PBM áp dụng chiều ngược lại.

Giảng viên nhận ủy quyền chỉ quyết định trong phạm vi được giao; không tự có quyền phân công/ủy quyền tiếp. Thiếu người có thẩm quyền thì chờ phân công lại, không chuyển thành đã duyệt từ phiếu reviewer.

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
| `PENDING_REVIEW` | Đã nộp, chờ đủ phân công thẩm định và duyệt cuối | Điều phối viên hợp lệ theo tuyến TBM/PBM |
| `UNDER_REVIEW` | Đã đủ phân công ban đầu, đang thẩm định | Reviewer được giao, không là tác giả/người duyệt cuối |
| `REVISION_REQUIRED` | Vòng này kết thúc với yêu cầu chỉnh sửa | Người soạn tạo vòng mới |
| `PENDING_DEPT_APPROVAL` | Đã đủ phiếu chuyên môn | Người duyệt cuối được giao, đủ quyền và độc lập |
| `APPROVED_BY_DEPT` | Đã có quyết định bộ môn | Khảo thí |
| `ADMIN_REVISION_REQUIRED` | Khảo thí trả về bổ sung | Người soạn và TBM |
| `SEALED` | Khảo thí đã tiếp nhận và khóa | Người tổ chức thi |
| `REJECTED` | Vòng này bị từ chối có lý do | Theo dõi lịch sử; giao lại nếu cần |
| `WITHDRAWN` | Tác giả rút hồ sơ trước quyết định bộ môn | Theo dõi lịch sử |

Reviewer dùng **Yêu cầu chỉnh sửa** cho lỗi có thể khắc phục. Quyết định từ chối cuối vòng thuộc người có quyền phê duyệt bộ môn.

Hồ sơ gửi lại có `previousRequestId` và số phiên bản tăng. Bản cũ giữ trạng thái kết thúc và các quyết định; không xóa lý do hoặc ghi đè kết quả trước.

Thiếu người xử lý không tạo một trạng thái chung làm mất tiến độ. API trả `blockingReason` tính theo quyền/phân công hiện hành, ví dụ `MISSING_COORDINATOR`, `MISSING_REVIEWER`, `MISSING_FINAL_APPROVER`, `ROLE_CONFLICT`, `AUTHORITY_EXPIRED`. Hồ sơ chưa bắt đầu giữ `PENDING_REVIEW`; hồ sơ đang xử lý giữ giai đoạn hiện tại, chặn chuyển bước phụ thuộc cho tới khi phân công lại hợp lệ. Không dùng lý do này thay kiểm tra nghiệp vụ trong transaction.

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
| Tác giả là TBM | PBM đủ quyền điều phối và duyệt; TBM không tự giao người xử lý hoặc duyệt cuối |
| Tác giả là PBM | TBM điều phối và duyệt, reviewer độc lập |
| TBM/PBM tham gia tổ | Cần assignment, chuyên môn phù hợp; không là tác giả hoặc người duyệt cuối |
| Cả TBM và PBM là tác giả hoặc không đủ quyền | Dùng điều phối/người duyệt độc lập đã được đơn vị giao quyền; nếu chưa có thì chờ, không tự chuyển Admin |
| Chưa có PBM | Đề giảng viên vẫn xử lý được nếu đủ reviewer và TBM; đề TBM chờ người điều phối/duyệt thay hợp lệ |
| Đổi reviewer thành người duyệt cuối | Chặn nếu đã tham gia thẩm định trong chuỗi hồ sơ, kể cả assignment đã bị rút |
| Giảng viên thuộc nhóm nhưng chưa được giao | Không được mở hoặc quyết định hồ sơ |
| Đang có phiếu yêu cầu sửa | Không cộng các phiếu thông qua để bỏ qua phiếu này |
| Reviewer bị khóa/rời nhóm | Dừng quyết định mới, giữ lịch sử, giao lại nhiệm vụ chưa xong |
| TBM/PBM đổi, tài khoản bị khóa hoặc quyền bị thu hồi | Kiểm tra DB ở thao tác tiếp theo, kể cả token chưa hết hạn; phân công lại phần chưa xong và giữ lịch sử |
| Thay reviewer | Lưu lý do, giữ nhận xét, bảo đảm không né yêu cầu sửa đã tồn tại |
| Đổi người soạn sau khi đã nộp | Giữ tác giả bản cũ; giao lại công việc cho bản mới, không sửa tác giả để lách tự duyệt |
| Ủy quyền hết hạn | Chặn quyết định mới; báo cần phân công lại, không âm thầm đổi người duyệt cuối |
| Người nhận ủy quyền muốn ủy quyền tiếp | Không hỗ trợ trong phiên bản đầu |
| Hai người cùng quyết định/niêm phong | Kiểm tra trạng thái trong transaction; chỉ một thao tác thành công |
| Sửa ma trận trong lúc duyệt | Lưu phiên bản yêu cầu mới, thông báo, trả lại hồ sơ ảnh hưởng để nộp lại |
| Một bản đạt, một bản dự phòng chưa đạt | Theo dõi từng đầu ra; yêu cầu tổng chưa hoàn thành đủ đầu ra |
| Đề đã được dùng trong ca thi | Không sửa tại chỗ; tạo bản thay thế mới và giữ bản cũ |
| Muốn thay đề của ca đã lên lịch | Chỉ trước khi có bài làm và trong trạng thái cho phép; kiểm tra lại đề đã tiếp nhận và ghi lý do |
| Hủy yêu cầu đang xử lý | Đóng nhiệm vụ mở có lý do; giữ hồ sơ, quyết định và thông báo |
| Đầu ra đã được dùng để tổ chức thi | Không hủy đơn giản; phải xử lý theo quy trình ca thi liên quan |

Quyết định hợp lệ tại thời điểm ban hành vẫn được lưu khi người thực hiện đổi chức vụ sau đó. Quyết định sai quyền hoặc phát hiện xung đột phải được đánh dấu vô hiệu có lý do và xử lý lại, không xóa lịch sử. Trước tiếp nhận phải kiểm tra hồ sơ không có quyết định đã bị vô hiệu.

## 7. Dữ liệu đề xuất

### 7.1 Các mô hình

| Mô hình | Trách nhiệm | Trường chính dự kiến |
| --- | --- | --- |
| `Teacher` hiện có | Chức vụ và bộ môn | Thêm giá trị enum PBM; giữ `departmentId`, không thêm `Faculty`; bổ nhiệm và gỡ chức vụ trong transaction |
| `ExamTask` | Yêu cầu phân công soạn đề | Môn, học kỳ, người giao/nhận, hạn, ma trận có phiên bản, trạng thái |
| `ExamTaskDeliverable` | Đầu ra bắt buộc của yêu cầu | Mã đầu ra, loại chính thức/dự phòng, liên kết bản nộp và bản được chấp nhận |
| `ExamReviewGroup` | Nhóm chuyên môn theo môn | Bộ môn, môn, tên nhóm, hiệu lực, trạng thái |
| `ExamReviewGroupMember` | Thành viên và điều phối | Nhóm, giảng viên, vai trò, hiệu lực/trạng thái |
| `ExamApprovalRequest` | Một vòng duyệt của một bản đề | Đề, đầu ra, `previousRequestId`, phiên bản, snapshot, tập tác giả, `coordinatorId`, `finalApproverId`, nguồn quyền, trạng thái, quyết định bộ môn và tiếp nhận |
| `ExamReviewAssignment` | Một reviewer của một vòng | Người giao/nhận, hạn, trạng thái, tiêu chí, nhận xét theo câu, quyết định |
| `ExamWorkflowGrant` | Quyền theo bổ nhiệm/phân công/ủy quyền | Người được cấp, loại và định danh nguồn quyền, quyền, bộ môn/môn, học kỳ/hồ sơ, người ghi nhận, căn cứ phân công, hiệu lực, thu hồi |

Đây là đề xuất cho phạm vi đầy đủ gồm yêu cầu nhiều đầu ra, nhóm và quyền Khảo thí. Chốt schema chi tiết ở task thiết kế dữ liệu, kiểm tra khả năng tái sử dụng trước khi thêm bảng.

`ExamWorkflowGrant` phục vụ quyền PBM điều phối/duyệt thay, ủy quyền giảng viên và quyền Khảo thí, với điều kiện cấp quyền khác nhau. Phân biệt nguồn bổ nhiệm/phân công của đơn vị với ủy quyền nghiệp vụ; ghi người thao tác trên hệ thống riêng với căn cứ quyết định. Không tạo hệ thống RBAC tổng quát hoặc hệ thống quản lý khoa.

V1 giữ một chủ sở hữu soạn đề như editor hiện tại. Snapshot lưu `authorUserIds` do backend xác định từ tác giả và lịch sử bàn giao; nếu có khai báo đồng tác giả thì mọi người đó đều bị loại khỏi thẩm định/duyệt. Không tự coi tất cả tác giả câu hỏi ngân hàng là đồng tác giả của mọi đề sử dụng câu hỏi đó. Không mở rộng thành editor cộng tác trong task này.

Phân công reviewer trong `ExamReviewAssignment` đã xác định quyền thẩm định; không cần tạo thêm grant toàn hệ thống cho mỗi reviewer.

Các trường tiếp nhận/người tiếp nhận đặt trên hồ sơ; không cần thêm bảng niêm phong riêng. Tiêu chí và nhận xét theo câu có thể dùng JSON có schema Zod và mã câu trong snapshot, vì là nội dung đánh giá của hồ sơ.

### 7.2 Ràng buộc

- Yêu cầu có đầu ra ổn định theo `(taskId, deliverableCode)`; số lượng đề tính từ các đầu ra, không chỉ một con số không có bản tương ứng.
- Một đầu ra chỉ có một hồ sơ đang xử lý; mỗi lần gửi lại tạo vòng mới.
- Khi tạo bản thay thế có `examId` mới, đầu ra giữ lịch sử bản trước và chỉ một bản được chọn làm bản chấp nhận hiện hành.
- Assignment duy nhất theo `(requestId, reviewerId)`; quyết định chính thức không sửa trực tiếp.
- `coordinatorId` và `finalApproverId` có thể cùng người nhưng không thuộc tập tác giả. Người duyệt cuối không nằm trong tập reviewer của chuỗi hồ sơ cùng đầu ra/bản đề, kể cả các vòng đã kết thúc hoặc assignment bị rút.
- Nếu điều phối viên làm reviewer, phải chỉ định người duyệt cuối khác trước khi bắt đầu thẩm định. Không cho rút tên reviewer sau khi họ đã xem/đánh giá rồi chuyển họ thành người duyệt cuối.
- Bổ nhiệm TBM/PBM kiểm tra giảng viên đang hoạt động, thuộc đúng bộ môn, không có hai người cùng giữ một chức vụ trong phạm vi V1. Giữ ràng buộc qua transaction/unique partial index phù hợp, không chỉ validate trên form.
- Grant PBM chỉ có tác dụng khi giảng viên còn giữ chức vụ và bộ môn tương ứng; grant ủy quyền thông thường kiểm tra nguồn thẩm quyền còn hợp lệ. Không để quyền cũ tiếp tục dùng sau gỡ chức vụ hoặc chuyển bộ môn.
- Kiểm tra nguồn cấp khi sử dụng grant: grant do chính tác giả cấp không được dùng để quyết định hồ sơ của tác giả, kể cả cấp trước cho phạm vi rộng. Quyền theo quyết định đơn vị được ghi nhận riêng, không giả danh là ủy quyền của tác giả.
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

### 8.0 Chức vụ và quyền theo bộ môn

Mở rộng router hiện tại `modules/admin-academic/routes/academic.routes.ts`, dưới prefix đã đăng ký trong `app.ts`:

| Route tương đối/endpoint đề xuất | Hành động | Điều kiện |
| --- | --- | --- |
| `PATCH /departments/:id/head` hiện có | Bổ nhiệm/gỡ TBM | Admin quản lý nhân sự, căn cứ thay đổi; kiểm tra tác động hồ sơ và quyền |
| `PATCH /departments/:id/deputy` mới | Bổ nhiệm/gỡ PBM | Cùng điều kiện, đúng bộ môn, không tự nâng tài khoản giảng viên thành lãnh đạo |
| `GET/POST /admin/exam-workflow-grants` | Đọc/ghi nhận quyền theo quyết định đơn vị | Admin được quyền quản lý grant; loại nguồn, phạm vi, căn cứ và thời hạn hợp lệ |
| `POST /admin/exam-workflow-grants/:id/revoke` | Thu hồi quyền đã ghi nhận | Có lý do, audit, đánh dấu hồ sơ cần phân công lại |

Route Admin không thực hiện quyết định phê duyệt học thuật. Không cho sửa chức vụ tự do từ form cập nhật hồ sơ cá nhân hoặc API quản lý người dùng để bỏ qua kiểm tra bổ nhiệm.

### 8.1 Phân công và nhóm

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `GET /teacher/exam-tasks` | Danh sách công việc | Công việc được giao hoặc thuộc phạm vi quản lý |
| `POST /teacher/exam-tasks` | Tạo yêu cầu nháp | `MANAGE_EXAM_TASKS` |
| `POST /teacher/exam-tasks/:id/issue` | Phát hành phân công | Quyền quản lý, yêu cầu hợp lệ |
| `POST /teacher/exam-tasks/:id/extend-deadline` | Gia hạn có lý do | Quyền quản lý |
| `POST /teacher/exam-tasks/:id/cancel` | Hủy yêu cầu | Quyền quản lý và chưa ảnh hưởng ca đã tổ chức |
| `GET/POST /teacher/exam-review-groups`, `PATCH /teacher/exam-review-groups/:id` | Xem/quản lý nhóm | Kiểm tra phạm vi và quyền quản lý |
| `POST /teacher/exam-approval-delegations` | Ủy quyền duyệt bộ môn | TBM/PBM có quyền cấp, không là tác giả hồ sơ, phạm vi/thời hạn không vượt nguồn quyền |
| `POST /teacher/exam-approval-delegations/:id/revoke` | Thu hồi có lý do | Người có quyền thu hồi |

### 8.2 Nộp, thẩm định và phê duyệt

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `POST /teacher/exams/:id/approval-requests` | Nộp bản đề | Người soạn được giao, đúng đầu ra, không có vòng đang mở |
| `GET /teacher/exam-approval-tasks` | Nhiệm vụ cần xử lý | Theo tài khoản và phạm vi |
| `GET /teacher/exam-approval-requests/:id` | Chi tiết hồ sơ | Tác giả/người được giao/người quản lý hợp lệ |
| `POST /teacher/exam-approval-requests/:id/coordinator` | Xác nhận/phân công lại điều phối viên | Người có quyền quản lý hồ sơ, không phải tác giả; người nhận đúng tuyến và đủ quyền, có lý do khi đổi |
| `POST /teacher/exam-approval-requests/:id/assignments` | Giao thẩm định | Điều phối viên không phải tác giả; reviewer độc lập với tác giả/người duyệt cuối |
| `POST /teacher/exam-approval-requests/:id/final-approver` | Chỉ định/đổi người duyệt cuối | Điều phối viên hợp lệ, người nhận đủ quyền, không từng thẩm định chuỗi hồ sơ; thay đổi có lý do |
| `POST /teacher/exam-review-assignments/:id/decision` | Quyết định chuyên môn | Reviewer được giao, không phải tác giả/người duyệt cuối |
| `POST /teacher/exam-approval-requests/:id/department-decision` | Quyết định bộ môn | Đúng người duyệt cuối, quyền còn hiệu lực, đủ phiếu hợp lệ và không xung đột |
| `POST /teacher/exam-approval-requests/:id/withdraw` | Rút hồ sơ | Tác giả, trước phê duyệt bộ môn |

Gửi lại dùng endpoint tạo hồ sơ với `previousRequestId`, tạo một vòng mới. Không cập nhật ghi đè lên hồ sơ đã kết thúc. Khi mất điều phối viên, người có quyền quản lý hợp lệ mới có thể nhận/phân công lại; nếu bộ môn không còn người đủ quyền thì đơn vị phải giao quyền trước, Admin không thay người điều phối để ra quyết định học thuật.

### 8.3 Khảo thí và tổ chức thi

| Endpoint | Hành động | Điều kiện quyền |
| --- | --- | --- |
| `GET /admin/exam-receptions` | Danh sách cần tiếp nhận/đã khóa | Quyền Khảo thí đúng phạm vi |
| `GET /admin/exam-receptions/:id` | Chi tiết tiếp nhận | Quyền đọc hồ sơ đúng phạm vi |
| `POST /admin/exam-receptions/:id/seal` | Tiếp nhận và khóa | Quyền Khảo thí, đã duyệt bộ môn, nội dung khớp |
| `POST /admin/exam-receptions/:id/return` | Trả bổ sung | Quyền Khảo thí, lý do bắt buộc |
| API danh sách đề đủ điều kiện hiện có | Chọn đề cho ca | Thêm điều kiện hồ sơ đã tiếp nhận |
| API tạo/sửa ca hiện có | Gắn bản đề vào ca | Quyền tổ chức, đề/môn/học kỳ hợp lệ |

Danh sách trả pagination, filter, `blockingReason` và capability theo dữ liệu thật. Các transition có điều kiện trạng thái trong transaction; retry không tạo quyết định hoặc thông báo trùng. Khi đổi chức vụ, grant hoặc phân công đồng thời với quyết định, kiểm tra lại nguồn quyền/phiên bản trong cùng cơ chế khóa hoặc transaction để không dùng kết quả kiểm tra cũ.


## 9. Thiết kế giao diện

| Khu vực | Người sử dụng | Nội dung chính |
| --- | --- | --- |
| **Bộ môn và Môn học** | Admin quản lý nhân sự | Bổ nhiệm/gỡ TBM và PBM; căn cứ phân công, hiệu lực quyền và hồ sơ bị ảnh hưởng |
| **Phân công ra đề** | TBM/PBM/người quản lý hợp lệ | Yêu cầu theo môn/học kỳ, giảng viên, ma trận, hạn và tiến độ từng bản |
| **Công việc ra đề của tôi** | Giảng viên | Đầu ra được giao, nút soạn, xem trước, nộp và lịch sử phản hồi |
| **Kiểm duyệt đề thi** | Reviewer/TBM/PBM/người duyệt thay | Nhiệm vụ của tôi, hồ sơ điều phối, hồ sơ chờ phân công, lịch sử |
| **Nhóm thẩm định & Ủy quyền** | TBM/PBM/người được quyền quản lý | Nhóm theo môn, thành viên gồm cả lãnh đạo đủ điều kiện; cấp/thu hồi quyền đúng phạm vi |
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
- Hiển thị riêng người ra đề, điều phối viên, reviewer và người duyệt cuối; nêu lý do hồ sơ của TBM được chuyển PBM.
- Form phân công lọc người không hợp lệ và giải thích lý do: là tác giả, đã tham gia thẩm định, là người duyệt cuối hoặc hết quyền. Backend vẫn kiểm tra lại khi gửi.
- Hiển thị ai đang chờ, ai thông qua, ai yêu cầu sửa; reviewer là TBM/PBM cũng không có nút duyệt cuối của cùng hồ sơ.
- Thiếu PBM hoặc người duyệt thay thì hiển thị chờ phân công, không có nút tự duyệt hoặc nút Admin bỏ qua bước.
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
| `admin-academic`/`admin-users` hiện có | Bổ nhiệm/gỡ PBM và kiểm soát mọi đường đổi chức vụ, bộ môn |
| `exam-tasks` | Yêu cầu ra đề, đầu ra, ma trận, hạn và giao người soạn |
| `exam-approvals` | Nhóm, assignment, kết quả chuyên môn, quyết định bộ môn, ủy quyền, tiếp nhận và khóa |
| `teacher-exams` hiện có | Editor, câu hỏi trong đề, xem trước, tạo bản thay thế; tích hợp guard |
| `exam-schedules` hiện có | Chọn bản đủ điều kiện và gắn vào ca |
| `auth` hiện có | DTO chức vụ PBM, quyền truy cập tổng quát; policy hồ sơ kiểm tra DB và nhiệm vụ hiện hành |
| `notifications`/AuditLog hiện có | Thông báo và lịch sử của các sự kiện |

Đăng ký route trong `be/soes-be/src/app.ts`. Không đẩy nghiệp vụ mới vào `server.ts` hoặc tiếp tục làm dài service đề thi.

Trong module, controller parse request và trả DTO; service điều phối policy; repository truy cập Prisma. Đặt kiểm tra quyền và transition ở policy dùng chung cho mọi endpoint thực hiện cùng hành động.

Đưa tiếp nhận vào module workflow với route admin riêng thay vì tạo thêm module kho chỉ làm lặp lại đọc/lọc đề.

## 11. Bảng task triển khai chi tiết

Các đường dẫn rút gọn `modules/...`, `prisma/...` bên dưới thuộc `be/soes-be`; các trang `.tsx` thuộc `fe/soes-fe/src/pages` như ghi ở cột tương ứng. File policy, schema và DTO phải thống nhất trước khi chia việc BE/FE.

| Task | Công việc | File/vùng code | Kết quả cần đạt | Commit dự kiến |
| --- | --- | --- | --- | --- |
| 1 | Policy và bảng transition | `src/modules/exam-approvals/services/exam-approval.policy.ts`, `.test.ts` cùng thư mục | Tuyến TBM/PBM; tác giả, reviewer và approver độc lập; kiểm tra nguồn quyền | `test: define independent exam approval policies` |
| 2 | Dữ liệu và migration | `prisma/schema.prisma`, migration mới có tên rõ | Enum PBM, yêu cầu, đầu ra, hồ sơ, phân công, grant và index; không thêm Khoa | `feat: add deputy position and exam workflow schema` |
| 3 | BE bổ nhiệm và auth | `src/modules/admin-academic/{routes,controllers,services,repositories,validators,mappers}`, `src/modules/admin-users`, `src/modules/auth` | Bổ nhiệm/gỡ PBM; khóa đường sửa chức vụ không hợp lệ; DTO và auth nhận chức vụ mới | `feat: manage deputy department head appointments` |
| 4 | BE yêu cầu ra đề | `src/modules/exam-tasks/{routes,controllers,validators,services,repositories,dtos}` | Phát hành, giao, gia hạn, hủy; TBM là người soạn thì PBM quản lý yêu cầu | `feat: add exam authoring task management` |
| 5 | BE nhóm và quyền | `src/modules/exam-approvals`, auth DTO/mapper | Nhóm nhận TBM/PBM; grant có nguồn/căn cứ, phạm vi, hiệu lực và thu hồi | `feat: add review groups and scoped workflow authority` |
| 6 | BE nộp và phân công | `src/modules/teacher-exams/services/teacher-exams.service.ts`; approval services/repositories | Bỏ tự thông qua đề của TBM, lưu snapshot, phân công reviewer và final approver, lý do chờ | `feat: route exam submissions to independent reviewers` |
| 7 | BE thẩm định và phê duyệt | Approval policy/services, validators, DTO | Góp ý theo câu, đủ phiếu, nộp lại; reviewer kể cả TBM/PBM không được duyệt cuối | `feat: implement independent department exam decisions` |
| 8 | BE tiếp nhận và khóa | Approval routes admin/services; `src/modules/teacher-exams/repositories/teacher-exam-lifecycle.repository.ts`; mọi API sửa đề | Khóa đúng bản, không sửa sau tiếp nhận, đề thay thế có ID mới | `feat: add examination office reception and sealing` |
| 9 | BE tích hợp ca thi | `src/modules/exam-schedules/services/exam-schedule.service.ts`, repository cùng module; API lịch teacher | Mọi đường tạo/sửa lịch FINAL yêu cầu hồ sơ đã tiếp nhận | `fix: require sealed approvals for final exam schedules` |
| 10 | Thông báo và audit | `src/modules/notifications`, audit helpers, workflow services | Đúng người theo tuyến, sau commit, không trùng, có lịch sử đổi phân công | `feat: notify and audit department approval routing` |
| 11 | FE chức vụ và quyền | `admin/AdminDepartmentsSubjectsPage.tsx`, `admin/components/academic/DepartmentHeadModal.tsx`, `admin/components/users/UserFormModal.tsx`, `teacher/utils/teacher-account.utils.ts`, auth types/store | Bổ nhiệm PBM, nhãn chức vụ, quyền và căn cứ; không tạo cổng đăng nhập mới | `feat: add deputy appointment and authority controls` |
| 12 | FE công việc ra đề | `teacher/TeacherExamsPage.tsx`, `teacher/TeacherExamEditorPage.tsx`; trang task/API/hooks/types mới | Dùng editor cũ, chọn hình thức rồi mở biểu mẫu, gắn đầu ra, nộp đúng tuyến | `feat: add exam authoring task workspace` |
| 13 | FE kiểm duyệt | `teacher/TeacherDepartmentApprovalPage.tsx`, `teacher/components/exam-approval/*`, router/sidebar | Hiển thị 4 nhiệm vụ, đủ trạng thái chờ, assignment, nhóm, quyền và timeline | `feat: add independent exam approval workspace` |
| 14 | FE Khảo thí | `admin/AdminExamTrackingPage.tsx`, `admin/components/exam-tracking/*`, trang chi tiết | Hàng đợi, kiểm tra thể thức, trả bổ sung và kho đề đã khóa | `feat: add examination office reception workspace` |
| 15 | FE chọn đề cho ca | `admin/AdminExamSchedulesPage.tsx`, API/picker/form lịch | Chỉ chọn đúng bản đã tiếp nhận, đúng môn/học kỳ; backend vẫn kiểm tra | `fix: align exam selection with sealed approvals` |
| 16 | Chuyển dữ liệu và nghiệm thu | Script chuyển đổi có dry-run, policy/integration tests và Playwright | Bảo toàn ca cũ, không hợp thức hóa tự duyệt, toàn luồng và ngoại lệ đạt | `test: verify deputy approval workflow end to end` |

### Contract policy cần triển khai trước

Tạo `be/soes-be/src/modules/exam-approvals/services/exam-approval-routing.ts` và test cùng tên `.test.ts`; giữ policy kiểm tra quyền ở `exam-approval.policy.ts`, không dồn vào controller.

| Hàm/contract | Điều kiện cần chứng minh bằng test |
| --- | --- |
| `resolveApprovalRouting(context)` | Tác giả thường → TBM; tác giả TBM → PBM đủ quyền; tác giả PBM → TBM; thiếu/xung đột → lý do chờ, không fallback Admin |
| `canAssignReviewers(context)` | Đúng điều phối viên, đúng trạng thái/phạm vi và không thuộc tập tác giả |
| `canReview(context)` | Có assignment, quyền hiện hành, không là tác giả/người duyệt cuối; cùng phiên bản được giao |
| `canMakeDepartmentDecision(context)` | Đúng final approver; không là tác giả hoặc từng thẩm định chuỗi hồ sơ; mọi phiếu bắt buộc đạt, không còn yêu cầu sửa; quyền còn hiệu lực |
| `canSeal(context)` | Khảo thí đúng phạm vi, quyết định chưa bị vô hiệu, hash/nội dung và phiên bản khớp |
| `canUseForSchedule(context)` | FINAL mới phải có bản đã khóa; ngoại lệ ca cũ xác định bằng dữ liệu chuyển đổi cụ thể |

Policy trả kết quả có mã lý do để FE giải thích. Ngày hiện tại truyền vào policy để test hết hạn có tính xác định; đọc dữ liệu và ghi quyết định được điều phối trong transaction. Grant mới hoặc chức vụ mới không làm mất tập tác giả/lịch sử reviewer.

### Cách thực hiện từng task

1. Xác định contract và điều kiện thành công/thất bại trước khi chỉnh implementation.
2. Với task quyền, transition, phiên bản và migration, viết test hành vi có ý nghĩa trước.
3. Implement trong phạm vi task; kiểm tra các route cũ có thể bỏ qua guard.
4. Chạy test liên quan và kiểm tra TypeScript; UI kiểm tra ở desktop/mobile theo mức phù hợp.
5. Rà diff và chỉ commit file của task; không đưa `.env` hoặc thay đổi của người khác vào commit.

Task 2 chỉ chạy sau khi chốt schema. Task 3, 5 và 6 phải kiểm tra cả đường cập nhật tài khoản/đề cũ để không vượt policy. Task 8 phải xong trước khi bật yêu cầu khóa đề cho ca mới. Task 11–15 phát triển sau khi DTO ổn định; chỉ kích hoạt toàn luồng sau task 16. Không triển khai một nửa enum PBM khiến backend trả chức vụ mà frontend/auth chưa hiểu.

## 12. Thông báo, lịch sử và hiệu năng

### Sự kiện

| Sự kiện | Người nhận |
| --- | --- |
| Phát hành yêu cầu ra đề | Người soạn được giao |
| Gia hạn/đổi yêu cầu | Người soạn và người quản lý liên quan |
| Nộp đề | Điều phối viên đúng tuyến; đề TBM đến PBM, không gửi tác giả yêu cầu tự duyệt |
| Giao thẩm định | Reviewer |
| Giao/thay người duyệt cuối | Người được giao và điều phối viên, có lý do thay đổi |
| Yêu cầu sửa | Tác giả và người quản lý |
| Đủ phiếu chuyên môn | Người có quyền quyết định bộ môn |
| Bộ môn phê duyệt | Tác giả và Khảo thí đúng phạm vi |
| Khảo thí trả bổ sung/tiếp nhận | Tác giả và điều phối viên/người duyệt cuối đúng hồ sơ |
| Reviewer mất quyền/ủy quyền thu hồi | Người quản lý nhiệm vụ để giao lại |
| Thiếu PBM hoặc người xử lý hợp lệ | Người quản lý quyền được giao; không gửi nội dung đề/đáp án cho Admin không có quyền đọc |

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
| Đề đang `PENDING` | Tạo hồ sơ kế thừa chờ phân công; liên kết yêu cầu chuyển đổi có nguồn rõ, chọn tuyến TBM/PBM theo tác giả |
| Đề đã `APPROVED` chưa lập ca | Giữ quyết định cũ ở lịch sử; phải qua vòng thẩm định và phê duyệt độc lập theo chính sách mới trước khi tạo ca FINAL mới |
| Đề đã dùng/đã gắn ca | Giữ hiệu lực và nội dung hiện tại; kiểm thử không chặn ca cũ |
| Đề TBM từng tự chuyển `APPROVED` | Không dựng reviewer giả hoặc chỉ tiếp nhận để hợp thức hóa; muốn dùng cho ca mới phải qua quy trình mới |
| Chức vụ hiện có | Giữ giảng viên/TBM; không tự chọn một giảng viên làm PBM. Bổ nhiệm PBM và cấp quyền có căn cứ trước khi xử lý đề TBM |
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
| Bổ nhiệm | PBM hoạt động, đúng bộ môn; không trùng chức vụ trong V1; cập nhật qua API khác cũng phải tuân thủ |
| Quyền | Sai bộ môn/môn/hồ sơ bị từ chối; thành viên nhóm chưa được giao không có quyền; kiểm tra cả `User.id` khi kiêm hồ sơ tài khoản |
| Đề TBM | PBM điều phối/duyệt, giảng viên khác thẩm định; TBM không tự duyệt, tự giao final approver hoặc tự cấp grant cho hồ sơ |
| Đề PBM | TBM điều phối/duyệt, reviewer độc lập |
| TBM/PBM là reviewer | Có assignment và không là tác giả thì được thẩm định; cấm tiếp tục duyệt cuối dù có chức vụ/grant |
| Tổ thẩm định | Tối thiểu một reviewer bắt buộc; tất cả phiếu bắt buộc phải thông qua cùng phiên bản; không tự thành đã duyệt bộ môn |
| Trả sửa | Một phiếu yêu cầu sửa chặn bước sau; gửi lại là vòng mới, giữ góp ý theo bản cũ |
| Tự duyệt | Tác giả/đồng tác giả thường, TBM, PBM và người được ủy quyền đều không duyệt bản mình tạo; bàn giao không xóa lịch sử tác giả |
| Lách phân tách | Rút reviewer, đổi chức vụ, cấp grant hoặc tạo vòng mới không biến reviewer cũ thành final approver |
| Thiếu người | Không có PBM, cả hai lãnh đạo là tác giả, hoặc quyền hết hạn → chờ phân công; không fallback Admin/tác giả |
| Ủy quyền | Đúng phạm vi, hiệu lực, thu hồi; không được ủy quyền tiếp hoặc vượt quyền |
| Tiếp nhận | Admin không có quyền không tiếp nhận; đúng bản đã duyệt mới khóa được |
| Khóa nội dung | Mọi đường sửa câu hỏi, metadata quan trọng, section, điểm và test case bị chặn sau khóa |
| Lập lịch | Tạo/sửa ca mới không chọn đề chưa tiếp nhận; đúng môn/học kỳ/lớp |
| Đồng thời | Nộp/duyệt/khóa nhiều lần không trùng; thu hồi grant, đổi PBM hoặc reviewer đồng thời không cho dùng quyền lỗi thời |
| Thông báo | Đúng người, đúng deep link, không phát khi rollback, số chờ giảm đúng |
| Dữ liệu cũ | Ca đang dùng và kết quả bài làm không thay đổi sau chuyển đổi |
| Student | Lấy câu hỏi đúng ca, đúng thời gian; không lộ đáp án ngoài chính sách xem lại bài |

### Kiểm tra bằng công cụ hiện có

BE hiện chưa có npm script test nghiệp vụ thực sự (`npm test` là placeholder). Chọn runner phù hợp với test Node/TypeScript trong dự án khi triển khai; không coi chạy placeholder là đã kiểm thử.

Sau khi có test policy, có thể dùng Node test runner với ts-node cho test tương ứng, nếu giữ cấu hình tương thích:

```powershell
cd D:\KLTN\smart-exam-system\be\soes-be
node -r ts-node/register --test src/modules/exam-approvals/services/exam-approval.policy.test.ts
node -r ts-node/register --test src/modules/exam-approvals/services/exam-approval-routing.test.ts
npx tsc --noEmit
```

FE kiểm tra TypeScript và build theo script hiện có:

```powershell
cd D:\KLTN\smart-exam-system\fe\soes-fe
npm run build
```

Các test policy/routing phải pass và TypeScript không phát sinh lỗi mới do thay đổi. Nếu dự án có lỗi nền, ghi rõ kết quả và tách khỏi lỗi task, không coi build thất bại là đã đạt.

Chạy ESLint trên file thay đổi; integration test dùng DB kiểm thử riêng. Kiểm thử UI bằng browser/Playwright cho tuyến tác giả thường, TBM, PBM, TBM/PBM làm reviewer và trang tiếp nhận, cả dữ liệu dài, loading và quyền không hợp lệ.

Migration chỉ áp dụng sau khi file SQL đã được review trên môi trường kiểm thử. Không dùng `migrate dev` chỉ để cập nhật client khi chưa có ý định tạo migration.

### Nghiệm thu toàn luồng

1. Admin ghi nhận bổ nhiệm PBM, quyền điều phối/duyệt thay và căn cứ theo bộ môn.
2. TBM giao đề chính thức và dự phòng cho giảng viên A; mỗi đầu ra xử lý độc lập.
3. Bản thứ nhất do B thẩm định, TBM duyệt cuối. Bản thứ hai có TBM trong tổ thẩm định, PBM đủ quyền duyệt cuối.
4. Một reviewer yêu cầu sửa; A nộp vòng mới, không kế thừa phiếu thông qua hoặc xóa lịch sử tham gia của vòng cũ.
5. Tạo yêu cầu do TBM soạn: PBM phát hành/điều phối, B thẩm định, PBM duyệt cuối. Thử TBM tự duyệt phải bị backend từ chối.
6. Tạo yêu cầu do PBM soạn: TBM điều phối/duyệt, B thẩm định. Thử TBM đồng thời là reviewer và final approver phải bị chặn.
7. Thu hồi quyền PBM khi hồ sơ chờ duyệt: UI báo cần phân công lại; token cũ không tiếp tục duyệt được.
8. Khảo thí tiếp nhận đúng bản đã duyệt, khóa nội dung; yêu cầu hoàn thành khi đủ đầu ra bắt buộc.
9. Người tổ chức chọn bản đã tiếp nhận cho ca; student làm bài theo API hiện có, chính sách điểm/xem lại bài giữ nguyên.
10. Đề thay thế không sửa ca cũ; đề cũ từng tự duyệt không được dùng cho ca mới qua đường tiếp nhận bỏ bước.

## 15. Thứ tự ưu tiên và chức năng để sau

| Giai đoạn | Nội dung |
| --- | --- |
| 1. Nền tảng nghiệp vụ | Policy độc lập nhiệm vụ, chức vụ PBM, yêu cầu ra đề, nhóm, quyền, hồ sơ và phân công |
| 2. Đủ chu trình | Thẩm định, duyệt bộ môn, tiếp nhận, khóa bản và tích hợp lịch |
| 3. Trải nghiệm hoàn chỉnh | UI đồng bộ, thông báo, lịch sử, báo cáo tiến độ, chuyển dữ liệu và E2E |
| Sau khi ổn định | Bốc thăm đề, nhóm nhiều môn, đánh giá nâng cao, chữ ký số nếu có yêu cầu |

Phiên bản đầu ưu tiên một quy trình rõ và đầy đủ, dùng editor/câu hỏi/ca thi hiện có. Bốc thăm, chữ ký số hoặc kiểm tra chuẩn đầu ra tự động chưa có dữ liệu không nằm trong tiêu chí hoàn thành phiên bản này.

## 16. Chính sách chốt và phạm vi không triển khai

| Điểm | Phương án ghi trong kế hoạch |
| --- | --- |
| Cấp tổ chức | Bộ môn → Môn học; không thêm Khoa, Trưởng khoa hoặc Phó trưởng khoa |
| Người quản lý | TBM và PBM được giao quyền; vẫn là tài khoản giảng viên |
| Đề của TBM | PBM hợp lệ điều phối và phê duyệt, giảng viên khác thẩm định |
| Đề của PBM | TBM điều phối và phê duyệt, giảng viên khác thẩm định |
| TBM/PBM thẩm định | Được nếu đúng phân công, đủ chuyên môn, không là tác giả/người duyệt cuối |
| Một người vừa thẩm định vừa duyệt cuối | Không; loại bỏ hoàn toàn ngoại lệ nhánh trực tiếp của kế hoạch cũ |
| Tổ thẩm định | Tất cả người được giao bắt buộc thông qua |
| Giảng viên duyệt thay | Chỉ có quyền khi được giao hợp lệ, đúng phạm vi, còn hiệu lực, không phải tác giả hoặc reviewer của chuỗi hồ sơ |
| Thiếu người đủ điều kiện | Chờ phân công; không tự phê duyệt, không tự chuyển quyền học thuật cho Admin |
| Khảo thí | Admin có quyền tiếp nhận riêng, không phải mọi Admin |
| Hạn nộp | Cho nộp muộn có ghi nhận; không nộp vào yêu cầu đã hủy |
| Sửa sau khóa | Tạo bản đề mới, duyệt lại; ca cũ giữ bản đã chọn |
| Đề cũ | Có chính sách chuyển đổi riêng, không dựng lịch sử chưa từng lưu |

Thẩm quyền bổ nhiệm/phân công phải được đơn vị chấp nhận trước khi vận hành thực tế. Cơ chế ba người độc lập và tất cả reviewer bắt buộc thông qua là chính sách thiết kế đã chọn cho SOES, không khẳng định mọi cơ sở đào tạo áp dụng giống nhau. Thay đổi chính sách phải được phản ánh đồng thời trong policy, UI, tài liệu và test.

## 17. Đồng bộ báo cáo và sơ đồ

- Sơ đồ tổng quát bổ sung actor Phó bộ môn nếu thể hiện chức vụ quản lý riêng như Trưởng bộ môn; không phát sinh loại tài khoản đăng nhập mới.
- Kế thừa actor Giảng viên không thay thế điều kiện quyền theo hồ sơ. Ghi rõ PBM chỉ duyệt khi được giao quyền và reviewer không đồng thời duyệt cuối.
- Sơ đồ chi tiết thể hiện ba tuyến tác giả: giảng viên, TBM, PBM; không có mũi tên quay về tác giả để duyệt cuối.
- Tách use case Phân công thẩm định, Thẩm định chuyên môn, Phê duyệt bộ môn, Tiếp nhận và khóa đề; không nối `include` chỉ để thể hiện thứ tự công việc.
- Đặc tả duyệt ghi rõ actor, tiền điều kiện, phiên bản, kết quả và nhánh chờ phân công; chính sách mới chỉ cho FINAL.
- Tài liệu hiện trạng phải phân biệt chức năng đang có và thiết kế cần triển khai, không ghi đã có PBM trong source trước khi task tương ứng hoàn thành.

## 18. Căn cứ và phạm vi áp dụng

Nguồn dưới đây dùng để đối chiếu vai trò chuyên môn và thẩm quyền; không sao chép cơ cấu khoa vào SOES:

- [Quy trình thi kết thúc học phần của Trường Đại học Ngoại ngữ, Đại học Huế](https://tuyensinh.huflis.edu.vn/tin-tuc/quy-trinh-thi-ket-thuc-hoc-phan), Điều 11 có trưởng/phó bộ môn hoặc người được trưởng khoa ủy quyền chịu trách nhiệm duyệt. SOES ghi nhận thẩm quyền theo quyết định đơn vị, không triển khai tài khoản cấp khoa.
- [Quy định khảo thí năm 2024 của Trường Đại học Bách khoa, ĐHQG-HCM](https://hcmut.edu.vn/document/1725962135325_20240710_2929_QD%20ban%20hanh%20Quy%20dinh%20tam%20thoi%20ve%20cong%20tac%20khao%20thi%20tai%20Truong%20DHBK,%20DHQG-HCM.pdf), Điều 6 có tuyến trình cấp khoa khi TBM ra đề. Đây là ví dụ khác về tổ chức; không dùng làm căn cứ khẳng định PBM mặc nhiên được duyệt thay ở mọi trường.

Phương án SOES trong tài liệu này giữ phạm vi bộ môn theo yêu cầu nhóm, dùng PBM có quyền hợp lệ và phân tách nhiệm vụ. Nếu đơn vị triển khai yêu cầu cấp khoa ký duyệt thì cấu hình này không thay thế được quy định đó; khi ấy cần bổ sung quy trình ngoài hệ thống hoặc mở rộng phạm vi bằng yêu cầu riêng.
