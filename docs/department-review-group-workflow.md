# Quy trình nhóm duyệt đề và câu hỏi dùng chung của SOES

## Vai trò và quyền

- Mỗi bộ môn có tối đa một nhóm duyệt cố định. Trưởng bộ môn là thành viên của nhóm và quản lý tên, trạng thái, thành viên. Chỉ giảng viên đang hoạt động trong cùng bộ môn được tham gia.
- Giáo vụ và Admin dùng trang Admin để xem danh sách nhóm và thành viên của **tất cả bộ môn** khi có quyền `REVIEW_GROUP_VIEW`. Giáo vụ không được sửa nhóm và không nhận quyền đọc bản đề/đáp án qua API nhóm.
- Admin chỉ được hỗ trợ tạo/sửa nhóm, thêm/loại thành viên sau khi được cấp riêng `REVIEW_GROUP_MANAGE_ALL`. Mọi thay đổi phải có lý do, ghi người thao tác và trước/sau vào nhật ký. Quyền này không cấp quyền duyệt đề hoặc câu hỏi. Không cấp `REVIEW_GROUP_MANAGE_ALL` cho Giáo vụ.
- Trang phân quyền có thể cấp/thu hồi quyền xem theo vai trò hoặc từng tài khoản. Migration `20261024100000_review_group_view_permission` cấp quyền xem mặc định cho Admin và Giáo vụ; quyền hỗ trợ sửa nhóm không được cấp mặc định.

## Duyệt đề cuối kỳ

1. Giảng viên tạo đề cuối kỳ và gửi duyệt. Hệ thống kiểm tra nhóm của bộ môn, lưu bản chụp đề và mở vòng duyệt. Gửi duyệt **không tự phê duyệt**.
2. Thành viên còn hiệu lực của nhóm xem bản chụp đề và quyết định phê duyệt hoặc yêu cầu sửa. Người tạo đề cũng có thể quyết định nếu chính họ đang là thành viên; đây là thao tác riêng sau khi gửi.
3. Quyết định đầu tiên có hiệu lực. Yêu cầu sửa phải có lý do; tác giả đọc lý do, chỉnh đề rồi gửi lại thành vòng mới. Lịch sử vòng cũ giữ nguyên. Đề chỉ sẵn sàng xếp lịch khi vòng mới nhất được phê duyệt.
4. Thành viên bị loại hoặc tài khoản/nhóm ngừng hoạt động mất quyền duyệt ở request tiếp theo. Không thể ngừng nhóm khi còn đề hoặc câu hỏi chờ duyệt.

## Duyệt câu hỏi vào ngân hàng dùng chung

1. Giảng viên thuộc bộ môn gửi câu hỏi vào ngân hàng chung. Câu hỏi chuyển sang chờ duyệt, kể cả khi người gửi là Trưởng bộ môn.
2. Một thành viên hợp lệ của nhóm duyệt bộ môn phê duyệt hoặc yêu cầu sửa ở thao tác riêng. Tác giả là thành viên có thể tự quyết định sau khi gửi. Chỉ một quyết định đầu tiên được ghi nhận.
3. Yêu cầu sửa cần lý do. Tác giả xem lý do, chỉnh câu hỏi và gửi lại. Câu hỏi đang chờ hoặc đã duyệt không thể bị tác giả sửa trực tiếp; quyền gỡ câu đã duyệt khỏi ngân hàng chung giữ riêng cho Trưởng bộ môn.

## Kiểm tra và giới hạn

- Test PostgreSQL `be/soes-be/src/modules/exam-review-groups/review-approval.postgres.test.ts` tạo dữ liệu tạm, chạy hai quyết định đồng thời cho đề và câu hỏi, kiểm tra nộp lại, thu hồi thành viên và điều kiện xếp lịch, rồi dọn dữ liệu.
- Dùng `node -r dotenv/config --test -r ts-node/register src/modules/exam-review-groups/review-approval.postgres.test.ts` trong `be/soes-be` để chạy test với PostgreSQL cục bộ.
- Bản chụp bất biến theo vòng áp dụng cho đề cuối kỳ. Câu hỏi dùng chung hiện lưu trạng thái/lý do trên `QuestionBankItem` và nhật ký thao tác; chưa có bản chụp riêng cho từng lần gửi lại câu hỏi. Quy trình chưa hỗ trợ đồng tác giả hoặc biểu quyết nhiều thành viên.
