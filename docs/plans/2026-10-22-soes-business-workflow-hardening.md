# Kế hoạch siết chặt nghiệp vụ SOES

Ngày lập: 22/10/2026  
Phạm vi: đăng nhập nhiều vai trò, phân quyền Giáo vụ, duyệt đề theo nhóm, phân lớp vào ca thi, điều chỉnh điểm đã chốt và bảo mật đề thi.

## 1. Mục tiêu và cách sử dụng kế hoạch

Tài liệu này là phương án triển khai cho các yêu cầu mới của nhóm. Nó xác định hành vi cần đạt, thứ tự thực hiện và điều kiện nghiệm thu; không khẳng định các chức năng đã có trong mã nguồn. Trước khi sửa từng phần, người thực hiện phải đối chiếu mô hình Prisma, API, giao diện và dữ liệu đang sử dụng theo bước K00. Không tự áp dụng trạng thái hoặc tên bảng đề xuất nếu chúng xung đột với mô hình hiện hành.

Mỗi đầu việc hoàn thành bằng một PR nhỏ, kèm migration nếu đổi dữ liệu, kiểm thử có ý nghĩa và cập nhật tài liệu liên quan. Không gộp năm nhóm chức năng vào một migration hoặc một PR.

## 2. Các quyết định nghiệp vụ cần giữ nhất quán

| Chủ đề | Quy tắc đích |
| --- | --- |
| Tài khoản | Một người dùng có một tài khoản đăng nhập; tài khoản có thể được cấp nhiều vai trò đang hiệu lực. Vai trò là quyền truy cập, không tạo tài khoản hoặc mật khẩu mới. |
| Chọn vai trò | Sau khi xác thực, người dùng chỉ chọn được một vai trò mình đang sở hữu. Phiên làm việc mang `activeRole`; đổi vai trò phải kiểm tra lại quyền phía máy chủ. |
| Giáo vụ | Là vai trò nghiệp vụ riêng, phụ trách phân lớp vào ca thi và những tác vụ được cấp rõ trong ma trận quyền. Có thể xem thông tin nhóm duyệt trong phạm vi phụ trách để phối hợp, nhưng không có quyền tạo, sửa, xóa nhóm hay thay đổi thành viên. |
| Duyệt đề cuối kỳ | Mỗi bộ môn có một nhóm duyệt đề cố định. Trưởng bộ môn là thành viên và quản lý nhóm, chỉ thêm giảng viên thuộc bộ môn. Đề cuối kỳ được nộp vào hàng chờ của nhóm; một thành viên hợp lệ duyệt thì vòng duyệt hoàn tất. Đề thường kỳ/giữa kỳ không đi qua nhóm trong phương án này. |
| Xung đột lợi ích | Người tạo hoặc đồng tác giả không được duyệt đề của mình. Người không còn là thành viên nhóm, sai bộ môn hoặc tài khoản không còn hiệu lực không được duyệt. Trưởng bộ môn cũng chịu quy tắc này. |
| Ca thi | Giáo vụ gán các lớp học phần vào ca thi khi môn học, học kỳ, loại thi, đề đã sẵn sàng và các điều kiện về thời gian phù hợp. Chỉ sinh viên ghi danh hợp lệ của lớp được tham gia. |
| Điểm đã chốt | Mỗi lần thay đổi điểm đã chốt phải có lý do và ít nhất một hình ảnh minh chứng hợp lệ, được lưu thành lịch sử điều chỉnh. Không ghi đè mất điểm cũ. |
| Bí mật đề | Nội dung đề được mã hóa ở phía máy chủ khi lưu bản cần bảo mật; việc công bố/duyệt cuối đóng băng phiên bản và điều khiển thời điểm được giải mã cho người được phép. Blockchain chỉ neo dấu vân tay của phiên bản, không chứa nội dung hay khóa giải mã. |

### Ranh giới của cơ chế một người duyệt

- Mỗi bộ môn chỉ có một nhóm duyệt đang hoạt động. Trưởng bộ môn là thành viên và là người quản lý nhóm; chỉ thêm giảng viên đang hoạt động thuộc cùng bộ môn. Nhóm tồn tại lâu dài, không tạo lại cho từng đề.
- Nhóm xuất hiện trong khu vực Giảng viên của các thành viên. Thành viên thường được xem thông tin nhóm và hàng chờ đề cần duyệt; các nút tạo, sửa và quản lý thành viên chỉ hiển thị cho Trưởng bộ môn. Quyền xem thông tin nhóm không đồng nghĩa quyền xem nội dung đề.
- Đề cuối kỳ thuộc bộ môn được hệ thống chuyển vào hàng chờ nhóm. Thành viên hợp lệ của nhóm được duyệt hồ sơ đang chờ, không cần Trưởng bộ môn giao từng người cho từng đề.
- Duyệt được tính khi cùng lúc thỏa: hồ sơ đang chờ duyệt trong nhóm đúng bộ môn, đúng phiên bản, thành viên còn hiệu lực, không là tác giả/đồng tác giả, phiếu duyệt được ghi thành công bằng giao dịch nguyên tử.
- Phiếu **yêu cầu sửa** không đồng nghĩa với duyệt. Đề trả về tác giả kèm nhận xét; tác giả nộp phiên bản mới và vòng duyệt mới. Nếu muốn nhiều người bỏ phiếu yêu cầu sửa hoặc muốn trưởng bộ môn có quyền phủ quyết, phải đặc tả quy tắc đó trước khi triển khai; kế hoạch này chưa suy diễn thêm.
- Khi Trưởng bộ môn là tác giả, đề vẫn chuyển đến nhóm nhưng chính Trưởng bộ môn không được duyệt. Phải còn ít nhất một thành viên khác đủ điều kiện trong nhóm. Không cần thêm vai trò Phó bộ môn để xử lý tình huống này.
- Giáo vụ chỉ xem danh sách nhóm và thành viên thuộc phạm vi được giao; không quản lý nhóm. Admin có thể xem tất cả nhóm và được hỗ trợ quản lý khi có `review_group.manage_all`; thao tác thay phải ghi lý do, người sửa và thay đổi trước/sau. Quyền quản lý nhóm không cấp quyền duyệt đề.
- Đây là quy tắc SOES do nhóm lựa chọn. Cần đối chiếu với quy chế của đơn vị trước khi mô tả nó là quy trình phê duyệt chính thức của trường.

## 3. Ma trận vai trò và quyền

Thiết kế quyền ở mức hành động và phạm vi đối tượng; tên dưới đây là khóa đề xuất, có thể đổi cho phù hợp convention của dự án.

| Quyền | Sinh viên | Giảng viên | Trưởng bộ môn | Giáo vụ | Admin |
| --- | --- | --- | --- | --- | --- |
| `exam.create`, `exam.edit_own` | Không | Có, trong phạm vi được giao | Có, theo quyền giảng viên | Không | Không mặc định |
| `review_group.view` | Không | Nhóm mình là thành viên | Nhóm của bộ môn mình | Nhóm thuộc phạm vi được giao | Tất cả nhóm |
| `review_group.manage` | Không | Không | Nhóm của bộ môn mình | Không | Không mặc định |
| `review_group.manage_all` | Không | Không | Không | Không | Chỉ khi được cấp riêng để hỗ trợ quản trị |
| `exam_review.vote` | Không | Thành viên nhóm của đúng bộ môn, không là tác giả | Theo điều kiện thành viên giảng viên | Không | Không mặc định |
| `schedule.assign_offerings` | Không | Không mặc định | Không mặc định | Có, trong học kỳ/phạm vi được giao | Có nếu được cấp riêng |
| `grade.finalize` | Không | Có với lớp phụ trách | Theo quyền giảng viên và phạm vi lớp | Không mặc định | Không mặc định |
| `grade.adjust_finalized` | Không | Chỉ khi được cấp quyền xử lý điểm của lớp | Không mặc định | Theo phân công/quy chế | Không mặc định |
| `permission.manage` | Không | Không | Không | Không | Có, nhưng không tự cấp quyền vượt quá phạm vi quản trị được cấu hình |
| `exam_seal.manage`, `exam_key.manage` | Không | Không | Không | Chỉ khi được cấp chức năng Khảo thí riêng | Theo phân quyền vận hành, không mặc định theo nhãn Admin |

Giảng viên và Trưởng bộ môn có thể cùng thuộc một tài khoản; Trưởng bộ môn vẫn có quyền giảng viên tương ứng. Nếu một người đồng thời là Giảng viên và Giáo vụ, quyền thực tế của mỗi request phải được kiểm tra theo `activeRole` và phạm vi được cấp. Backend không chấp nhận `activeRole` do client gửi mà không đối chiếu phiên/tài khoản.

## 4. Luồng nghiệp vụ đích

### 4.1. Đăng nhập và chọn vai trò

1. Người dùng nhập thông tin đăng nhập; máy chủ xác thực một tài khoản duy nhất và lấy các vai trò còn hiệu lực.
2. Giao diện chỉ hiển thị các lựa chọn người đó sở hữu: Sinh viên, Giảng viên, Giáo vụ; Trưởng bộ môn là năng lực mở rộng trong không gian Giảng viên. Admin có lối vào quản trị khi được cấp vai trò tương ứng.
3. Khi người dùng chọn vai trò, máy chủ kiểm tra lại rồi phát hành hoặc cập nhật phiên có `activeRole`, danh sách quyền có hiệu lực và thời điểm hết hạn.
4. Mọi API kiểm tra quyền và phạm vi trên máy chủ. Nếu vai trò bị thu hồi trong lúc phiên còn sống, request tiếp theo bị từ chối hoặc buộc làm mới phiên.
5. Chuyển vai trò qua chức năng chuyển không gian làm việc, không cần tạo tài khoản mới. Quyền và menu được tính lại; dữ liệu phía giao diện của vai trò trước phải được xóa khỏi bộ nhớ đệm.

Tài khoản chỉ có một vai trò có thể vào thẳng không gian tương ứng sau khi xác thực. Không hiển thị lựa chọn vai trò mà tài khoản không sở hữu. Không dùng tên vai trò trong URL hoặc local storage làm nguồn quyết định quyền.

### 4.2. Quản lý phân quyền tại Admin

1. Admin có quyền `permission.manage` xem danh mục quyền, vai trò và người dùng được cấp vai trò.
2. Admin cấp/thu hồi vai trò hoặc quyền có phạm vi, thời hạn và lý do; hệ thống kiểm tra thẩm quyền người cấp.
3. Hệ thống ghi lịch sử ai cấp, cho ai, lúc nào, phạm vi nào; thay đổi có hiệu lực với các request tiếp theo và các phiên liên quan được làm mới hoặc vô hiệu hóa.
4. Trang quyền tách rõ: quyền theo vai trò, quyền bổ sung trực tiếp và quyền theo hồ sơ/phân công. Không biến việc thành viên nhóm duyệt thành vai trò toàn hệ thống.

Danh mục quyền là cấu hình được quản lý có kiểm soát, không cho giao diện tạo chuỗi quyền tùy ý rồi backend tự tin cậy. Có biện pháp tránh tự tước quyền quản trị cuối cùng và tránh tự nâng quyền không được phép.

### 4.3. Nhóm duyệt và duyệt đề

1. Trưởng bộ môn tạo nhóm duyệt cố định cho bộ môn và tự là thành viên của nhóm. Trưởng bộ môn thêm, sửa trạng thái hoặc loại các giảng viên đang hoạt động thuộc cùng bộ môn. Chỉ có một nhóm hoạt động cho mỗi bộ môn; nhóm phục vụ mọi hồ sơ cần duyệt thuộc bộ môn đó. Nếu một môn cần giới hạn chuyên môn, cấu hình phạm vi môn cho thành viên mà vẫn giữ một nhóm bộ môn.
2. Tác giả tạo, chỉnh sửa đề cuối kỳ rồi nộp duyệt. Hệ thống đóng băng phiên bản nộp và mở hồ sơ duyệt. Đề thường kỳ/giữa kỳ theo luồng giảng viên tạo và công bố đã được cấp quyền, không tự chuyển vào nhóm duyệt cuối kỳ.
3. Hệ thống xác định bộ môn của môn học, chuyển hồ sơ cuối kỳ vào hàng chờ của nhóm cố định và kiểm tra còn ít nhất một thành viên hợp lệ sau khi loại tác giả/đồng tác giả. Nếu không có người hợp lệ, hồ sơ chờ bổ sung thành viên và báo cho Trưởng bộ môn; không tự duyệt.
4. Thành viên hợp lệ xem đúng phiên bản, đáp án và thông tin cần thẩm định, ghi quyết định cùng nhận xét.
5. Phiếu duyệt hợp lệ đầu tiên chuyển hồ sơ sang trạng thái đã duyệt trong cùng giao dịch. Ghi người duyệt, thời gian, phiên bản, bản ghi quyết định và nhật ký. Các thao tác duyệt đồng thời chỉ có một phiếu thắng; phiếu còn lại nhận thông báo hồ sơ đã xử lý.
6. Phiếu yêu cầu sửa trả đề về tác giả. Sau chỉnh sửa, tác giả nộp phiên bản mới và hệ thống tạo vòng duyệt mới; phiếu cũ chỉ là lịch sử.
7. Với đề cuối kỳ, một bước tiếp nhận/khóa của Khảo thí hoặc người được cấp quyền vận hành vẫn diễn ra nếu quy trình trường yêu cầu. Không nhầm quyết định duyệt chuyên môn với công bố cho sinh viên.

Trưởng bộ môn có quyền tạo, xem, sửa và ngừng hoạt động nhóm của bộ môn, cũng như quản lý thành viên. Nhóm đã có hồ sơ hoặc lịch sử duyệt được ngừng sử dụng thay vì xóa vật lý. Khi thành viên bị loại hoặc chuyển bộ môn, quyền xử lý hồ sơ mới bị thu hồi ngay; quyết định đã hoàn tất vẫn được lưu để truy vết. Giáo vụ chỉ xem thông tin nhóm theo phạm vi. Admin được cấp `review_group.manage_all` mới được sửa thay, phải nhập lý do và không được dùng quyền đó để tự duyệt đề.

Khi thay Trưởng bộ môn, người mới phải được thêm vào nhóm và nhận quyền quản lý theo nhiệm kỳ mới; người cũ mất quyền quản lý ngay, còn tư cách thành viên chỉ được giữ nếu vẫn là giảng viên hợp lệ của bộ môn. Việc bổ nhiệm không tự tạo quyền xem nội dung các đề ngoài phạm vi nhóm.

Chốt rõ trong giao diện: “Duyệt đề” là quyết định phê duyệt chuyên môn theo quy tắc một người, không phải chỉ một phiếu tư vấn rồi đợi trưởng bộ môn duyệt lần nữa.

### 4.4. Giáo vụ phân lớp vào ca thi

1. Giáo vụ chọn ca thi, xem môn học, học kỳ, loại thi, đề/phiên bản đã đủ điều kiện và danh sách lớp học phần cùng môn.
2. Chọn một hoặc nhiều lớp; hệ thống kiểm tra quyền Giáo vụ, quan hệ môn học/học kỳ, tình trạng ghi danh, trùng lớp trong ca thi và xung đột lịch theo quy tắc hiện hành.
3. Hệ thống lưu gán lớp với ca thi, lưu người gán và thời điểm; chỉ sinh viên thuộc các lớp được gán mới thấy/được tham gia theo điều kiện ca thi.
4. Cho phép gỡ hoặc đổi lớp trước khi ca thi bắt đầu theo quyền. Sau khi đã có lượt làm bài, không xóa quan hệ làm mất dữ liệu lịch sử; dùng quy trình điều chỉnh có nhật ký.

Không xác định quyền dự thi chỉ bằng việc môn của đề trùng với môn của sinh viên. Quan hệ lớp học phần được gán vào ca thi và ghi danh còn hiệu lực mới là căn cứ.

### 4.5. Điều chỉnh điểm đã chốt

1. Người có quyền mở bài làm/điểm đã chốt, nhập điểm mới, lý do cụ thể và tải ít nhất một hình ảnh minh chứng.
2. Máy chủ kiểm tra phạm vi lớp, điểm hợp lệ, trạng thái đã chốt, lý do, loại/size/nội dung tệp và quyền thao tác; tệp lưu ở khu vực riêng, truy cập qua API có kiểm quyền hoặc URL ngắn hạn.
3. Hệ thống tạo bản ghi điều chỉnh bất biến gồm điểm trước/sau, lý do, người thao tác, thời điểm và tham chiếu minh chứng. Chỉ sau khi bản ghi và trạng thái điểm cập nhật thành công trong một giao dịch mới trả kết quả.
4. Giao diện kết quả và bảng điểm phản ánh phiên bản đang có hiệu lực theo chính sách công bố; lịch sử chỉ người có quyền được xem. Sinh viên nhận thông báo nếu điểm đã công bố thay đổi.

Nếu quy chế yêu cầu một người đề xuất và người khác phê duyệt điều chỉnh điểm, bổ sung bước chờ phê duyệt **trước** khi thay đổi điểm có hiệu lực. Chưa coi việc nhập lý do và ảnh là đủ căn cứ để tự cho phép mọi Giáo vụ đổi điểm.

### 4.6. Mã hóa, công bố và kiểm chứng đề

1. Phân loại dữ liệu: đề và đáp án chưa công bố là bí mật; sinh viên chỉ được nhận đúng phiên bản sau thời điểm ca thi mở và khi đủ điều kiện.
2. Mã hóa bản đề cần bảo mật ở máy chủ bằng thư viện chuẩn với thuật toán mã hóa có xác thực, ví dụ AES-256-GCM; tạo nonce duy nhất, lưu key ID và metadata cần giải mã. Khóa nằm trong KMS/vault hoặc nơi quản lý bí mật tách khỏi dữ liệu, không nhúng vào frontend, database bản đề hay blockchain. Thực hiện mã hóa từ lúc lưu bản cần bảo mật, không đợi đến lúc công bố mới bắt đầu bảo vệ.
3. Khi đề thường kỳ/giữa kỳ được giảng viên công bố, hoặc đề cuối kỳ được một thành viên nhóm duyệt, tạo snapshot phiên bản bất biến và tính hash của dữ liệu chuẩn hóa. Công bố/duyệt ở đây là đưa đề vào trạng thái sẵn sàng tổ chức thi; sinh viên chỉ được nhận câu hỏi sau khi ca thi mở và đủ điều kiện.
4. Ghi hash và metadata tối thiểu của snapshot lên mạng blockchain có kiểm soát; nội dung đề, đáp án, thông tin sinh viên và khóa luôn ở ngoài chuỗi. Đọc lại snapshot thì đối chiếu hash đã ghi trước khi sử dụng.
5. Chỉ backend giải mã theo quyền và cửa sổ thời gian, trả câu hỏi đúng đối tượng; không phát khóa cho trình duyệt. Lưu nhật ký truy cập, thử truy cập sớm, thay phiên bản và lỗi kiểm chứng.
6. Xác định chính sách khi ghi blockchain lỗi: snapshot ở trạng thái chờ neo, không tuyên bố đã kiểm chứng; nếu việc neo là điều kiện phát hành bắt buộc, không được phát hành cho đến khi giao dịch được xác nhận. Có retry idempotent và đối soát định kỳ.

Blockchain cung cấp bằng chứng về tính toàn vẹn và thời điểm ghi nhận, không tự mã hóa dữ liệu. Nếu chỉ có một máy chủ và một bên vận hành, cần đánh giá liệu mạng blockchain thực sự tạo thêm giá trị so với nhật ký bất biến, chữ ký số và hash chain hay không. Nếu vẫn dùng blockchain để đáp ứng mục tiêu đề tài, phải chỉ rõ ít nhất các nút độc lập, bên vận hành, cơ chế đồng thuận, chi phí và cách khôi phục. Không đưa đề thi lên public chain.

## 5. Thay đổi dữ liệu đề xuất

| Nhóm | Thay đổi cần thiết | Ràng buộc quan trọng |
| --- | --- | --- |
| Tài khoản/quyền | Bảng hoặc quan hệ `UserRole`, `RolePermission`, `UserPermissionGrant` nếu cấu trúc hiện tại chưa hỗ trợ; thêm `EDUCATION_OFFICER`/`GIAO_VU` theo quy ước mã hiện có. | Unique theo tài khoản + vai trò + phạm vi; trạng thái và thời hạn; không nhân đôi User. |
| Phiên đăng nhập | `activeRole` ở phiên/token và cơ chế phiên bản quyền hoặc tra cứu quyền mới. | Token cũ phải bị vô hiệu/thu hẹp khi thu hồi quyền. |
| Nhóm duyệt | Nhóm cố định gắn `departmentId`, trạng thái và các thành viên; phạm vi môn của thành viên nếu cần. | Tối đa một nhóm hoạt động mỗi bộ môn; thành viên phải là giảng viên hoạt động cùng bộ môn; Trưởng bộ môn là thành viên; ngừng nhóm giữ lịch sử. |
| Hồ sơ duyệt | Yêu cầu gắn `examId`, `examVersion`, vòng duyệt, nhóm bộ môn, phiếu và quyết định cuối. | Unique quyết định cuối trên một vòng; không tái dùng phiếu của phiên bản trước; tác giả không thể là người duyệt; lưu snapshot người xử lý cho audit. |
| Ca thi/lớp | Bảng liên kết ca thi - lớp học phần nếu chưa có. | Unique `(scheduleId, courseOfferingId)`; đúng môn và học kỳ; bảo toàn lịch sử sau khi có lượt thi. |
| Điểm | Bảng `GradeAdjustment` và `GradeAdjustmentEvidence` hoặc cấu trúc tương đương. | Điểm trước/sau, lý do, người sửa và minh chứng không bị ghi đè/xóa tùy tiện. |
| Đề bảo mật | Metadata bản mã, `keyId`, nonce, tag, hash snapshot và mã giao dịch neo chuỗi. | Không lưu khóa rõ trong DB; bất biến snapshot đã duyệt; quản lý phiên bản định dạng mã hóa. |

Không chọn kiểu cột hay migration cuối cùng trước khi kiểm kê schema thực tế. Trình tự chuyển dữ liệu: thêm cấu trúc mới theo cách tương thích, chuyển dữ liệu và ánh xạ role hiện hữu, phát hành mã mới, kiểm tra dữ liệu thực, sau đó mới bỏ đường cũ. Cần sao lưu và phương án rollback cho từng migration.

## 6. API và giao diện cần có

| Chức năng | API/hành vi dự kiến | Giao diện |
| --- | --- | --- |
| Vai trò | Đăng nhập trả danh sách role hiệu lực; endpoint chọn/đổi `activeRole`; endpoint đọc quyền hiệu lực. | Màn chọn role khi có nhiều role; menu theo role; đổi không gian làm việc. |
| Admin | Danh mục quyền/role; cấp, thu hồi và xem lịch sử cấp quyền. | Trang quản lý phân quyền với tìm kiếm người dùng, ma trận quyền và phạm vi. |
| Nhóm duyệt | CRUD nhóm cố định và thành viên theo bộ môn; tự chuyển đề vào hàng chờ; xem hàng chờ; gửi quyết định duyệt/trả sửa; API Admin hỗ trợ sửa thay cần quyền riêng và lý do. | Trong khu vực Giảng viên, thành viên xem nhóm và hồ sơ; Trưởng bộ môn có nút quản lý. Giáo vụ chỉ xem thông tin nhóm được giao. Admin có trang xem tất cả và công cụ hỗ trợ khi được cấp quyền. |
| Ca thi | Danh sách lớp hợp lệ; gán/gỡ lớp cho ca thi; xem danh sách đã gán. | Trang Giáo vụ chọn ca thi và gán lớp, có cảnh báo xung đột. |
| Điểm | Gửi điều chỉnh multipart hoặc upload trước với token tạm; xem lịch sử và minh chứng có kiểm quyền. | Form điểm mới, lý do, ảnh minh chứng và so sánh điểm cũ/mới. |
| Đề bảo mật | Tạo snapshot, mã hóa, neo hash, kiểm chứng, phát hành/giải mã có kiểm quyền. | Trạng thái mã hóa, chờ neo, đã kiểm chứng; lỗi phải hiển thị cho người vận hành. |

Tên route cụ thể cần theo convention controller/service hiện có. Mọi endpoint ghi dữ liệu kiểm quyền và phạm vi lại trong service; không chỉ ẩn nút ở giao diện. API cần khóa idempotency hoặc ràng buộc DB cho thao tác gửi phiếu duyệt, gán lớp và neo snapshot.

## 7. Thứ tự triển khai và đầu việc có thể đưa lên Git

| Mã | Đầu việc | Kết quả bàn giao/tiêu chí hoàn thành | Phụ thuộc |
| --- | --- | --- | --- |
| K00 | Kiểm kê hiện trạng và chốt từ điển nghiệp vụ | Bảng đối chiếu schema, API, UI, role hiện có; xác nhận trạng thái đề, ca thi, điểm, thời điểm “công bố”; ghi rõ quyết định nào giữ/đổi. | Không |
| K01 | Thiết kế quyền và ma trận phạm vi | Danh mục permission, role Giáo vụ, quyền xem nhóm của Giáo vụ, quyền quản lý nhóm của Trưởng bộ môn/Admin, quan hệ Trưởng bộ môn/Giảng viên, quyền điều chỉnh điểm và Khảo thí. | K00 |
| K02 | Migration nhiều role trên một tài khoản | Chuyển role hiện tại sang quan hệ mới, giữ User và dữ liệu hồ sơ; script đối soát và rollback được kiểm tra. | K01 |
| K03 | Đăng nhập/chọn role và guard backend | Xác thực, chọn/đổi role, kiểm quyền và thu hồi quyền trong phiên; test truy cập chéo role. | K02 |
| K04 | Giao diện chọn role và trang Admin quản lý quyền | Role picker, switcher, ma trận cấp quyền và audit; thao tác UI khớp quyền backend. | K03 |
| K05 | Nhóm duyệt cố định của bộ môn | Migration bảo đảm một nhóm hoạt động mỗi bộ môn; Trưởng bộ môn là thành viên; CRUD nhóm/thành viên cùng bộ môn, ngừng hoạt động giữ lịch sử; đề được chuyển tự động vào nhóm. | K01, K00 |
| K06 | Phiếu duyệt một người và vòng sửa đề | Giao dịch nguyên tử: đúng một phiếu duyệt kết thúc vòng; yêu cầu sửa tạo vòng mới; test race condition. | K05 |
| K07 | Giao diện nhóm duyệt và công việc giảng viên | Thành viên xem nhóm và hàng chờ trong tài khoản Giảng viên; Trưởng bộ môn quản lý nhóm/thành viên; Giáo vụ chỉ xem; Admin được cấp quyền có thể sửa thay và nhập lý do; duyệt/trả sửa có trạng thái và nhật ký. | K06 |
| K08 | Quyền Giáo vụ và gán lớp vào ca thi | API/UI gán lớp đúng môn/học kỳ, ghi danh hợp lệ, chống trùng và giữ dữ liệu lượt thi. | K03, K00 |
| K09 | Lịch sử điều chỉnh điểm đã chốt | Migration, API điểm mới/lý do/ảnh, kiểm quyền, lưu lịch sử bất biến và thông báo cần thiết. | K03, K00 |
| K10 | Đánh giá đe dọa và thiết kế quản lý khóa | Xác định dữ liệu cần mã hóa, vòng đời khóa, quyền giải mã, thời điểm phát hành, kế hoạch chuyển dữ liệu cũ. | K00 |
| K11 | Mã hóa và snapshot đề | Mã hóa phía server, snapshot bất biến, hash chuẩn hóa, kiểm chứng khi đọc, kiểm thử xoay khóa/khôi phục. | K10, K06 |
| K12 | Neo hash lên blockchain có kiểm soát | Mạng thử nghiệm, giao dịch idempotent, bằng chứng xác nhận, đối soát, xử lý lỗi/retry, không chứa đề/khóa. | K11 |
| K13 | Tích hợp phát hành theo loại thi | Thường kỳ/giữa kỳ công bố bởi giảng viên; cuối kỳ đi qua nhóm duyệt rồi tiếp nhận theo quy trình; cả hai chỉ mở cho sinh viên khi ca thi bắt đầu và đủ điều kiện. | K08, K11, K12 nếu neo là bắt buộc |
| K14 | Kiểm thử xuyên luồng và tài liệu | Test quyền, duyệt đồng thời, gán lớp, thay điểm, rò rỉ đề, blockchain lỗi; cập nhật use case, sequence và hướng dẫn vận hành. | K04, K07, K08, K09, K13 |

Thứ tự PR gợi ý: K00-K01; K02-K04; K05-K07; K08; K09; K10-K11; K12-K13; K14. Nhóm có thể làm giao diện trên nhánh riêng khi hợp đồng API đã chốt. Mỗi PR ghi migration cần chạy, dữ liệu cũ bị ảnh hưởng và bằng chứng kiểm thử; merge qua review, không push trực tiếp nhánh được bảo vệ.

## 8. Các tình huống nghiệm thu bắt buộc

| Nhóm | Tình huống phải qua |
| --- | --- |
| Đăng nhập | Một User có hai role; chỉ chọn role được cấp; đổi role không giữ quyền cũ; thu hồi role khi đang đăng nhập; người chỉ có một role vào đúng trang. |
| Admin | Giáo vụ không mở được API quản lý quyền hoặc API sửa nhóm; Admin không có `review_group.manage_all` bị từ chối khi sửa thay; mọi lần sửa thay lưu lý do và audit. |
| Duyệt đề | Mỗi bộ môn chỉ có một nhóm hoạt động; không thêm giảng viên bộ môn khác; Trưởng bộ môn là thành viên nhưng không tự duyệt đề mình tạo; người ngoài nhóm không đọc được đề; hai thành viên duyệt đồng thời chỉ một quyết định có hiệu lực; sửa đề hủy hiệu lực phiếu cũ; ngừng nhóm không mất lịch sử; đổi Trưởng bộ môn cập nhật quyền quản lý đúng người. |
| Ca thi | Không gán lớp khác môn/học kỳ; không gán trùng; sinh viên ngoài lớp bị từ chối; sửa phân lớp sau khi có bài làm không làm mất lịch sử. |
| Điểm | Thiếu lý do/ảnh bị từ chối; tệp giả dạng ảnh bị từ chối; người sai lớp không đổi được điểm; lịch sử điểm cũ/mới và minh chứng được lưu; kết quả sinh viên cập nhật đúng chính sách công bố. |
| Bảo mật đề | Không đọc đề/đáp án trước giờ; không có khóa trong client/log/chuỗi; sửa ciphertext hoặc snapshot bị phát hiện; khóa bị xoay vẫn đọc được bản hợp lệ; blockchain mất kết nối không tạo trạng thái “đã kiểm chứng” giả. |

## 9. Những quyết định cần ghi trong K00 trước khi code

1. Nhóm duyệt cố định xử lý đề cuối kỳ. Đề thường kỳ và giữa kỳ đi theo luồng giảng viên công bố; nếu quy chế đơn vị yêu cầu duyệt thêm loại đề khác, phải sửa đặc tả và kiểm thử trước khi mở rộng.
2. Khi một thành viên yêu cầu sửa còn người khác duyệt đồng thời, quyết định hợp lệ được ghi trước sẽ chốt vòng hiện tại. Quy tắc này cần được ghi trong đặc tả nghiệp vụ và được giảng viên hướng dẫn xác nhận trước khi code.
3. Trường có cho phép chính người chấm điều chỉnh điểm đã chốt hay bắt buộc người khác phê duyệt? Xác định vai trò Giáo vụ trong quy trình này.
4. Công bố/duyệt đề là đưa một phiên bản vào trạng thái sẵn sàng tổ chức thi; mở đề cho sinh viên là hành động riêng theo giờ ca thi và quyền dự thi. Kiểm thử hai mốc thời gian độc lập.
5. Hạ tầng blockchain do ai vận hành và có bao nhiêu bên độc lập? Nếu chưa có, thực hiện K10-K11 trước, K12 chỉ phát hành khi có tiêu chí vận hành và giá trị kiểm chứng rõ ràng.

Không cần trì hoãn K00-K04 trong khi chờ quyết định về blockchain. Các quyết định trên phải được ghi vào tài liệu và PR tương ứng, không để mỗi module tự hiểu một cách.

## 10. Tham khảo thiết kế bảo mật

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html): mã hóa dữ liệu ở trạng thái lưu, thuật toán và quản lý khóa.
- [NIST Blockchain Technology Overview](https://csrc.nist.gov/pubs/ir/8202/final): đặc tính của sổ cái và hash; không coi blockchain là cơ chế giữ bí mật nội dung.
- [Hyperledger Fabric Private Data](https://hyperledger-fabric.readthedocs.io/en/latest/private_data_tutorial.html): ví dụ chỉ ghi hash lên chuỗi, giữ dữ liệu nhạy cảm ngoài chuỗi.
