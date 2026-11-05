# Kiểm tra cổng giảng viên trên mobile

## Kiểm tra tự động

- `npx tsc --noEmit`: đạt.
- `npx eslint 'app/(app)/(teacher)' src/pages/teacher src/components/teacher src/api/teacher-*.api.ts src/hooks/useTeacher*.ts src/types/teacher-*.types.ts`: đạt.
- `npx expo install --check`: dependency phù hợp SDK.
- `npx expo-doctor`: 20/20 kiểm tra đạt.
- `npm run lint`: còn 11 lỗi `react-hooks/set-state-in-effect` trong các file sinh viên cũ (`app/(app)/(student)` và `src/hooks/useCourseDetail.ts`, `useStudentSubjects.ts`). Không có lỗi ở phần giảng viên.

## Kiểm tra trên thiết bị trước khi phát hành

Chưa chạy thực tế trên iOS hoặc Android trong phiên làm việc này. Dùng tài khoản giảng viên thường, trưởng bộ môn, thành viên nhóm duyệt và người ngoài nhóm để kiểm tra:

1. Đăng nhập, mở menu và chuyển các màn khi chiều rộng màn hình thay đổi; nội dung dài cuộn được, bàn phím không che nút lưu.
2. Mở dashboard, lớp học phần, bài viết, đề thi và lịch coi thi; kéo để tải lại và thử khi mất kết nối.
3. Tài khoản ngoài nhóm không thấy màn duyệt; backend từ chối nếu gọi URL duyệt trực tiếp.
4. Thành viên nhóm xem đề, ghi góp ý cho từng câu, xác nhận yêu cầu sửa hoặc duyệt. Bấm nhanh nhiều lần không tạo hai quyết định.
5. Trưởng bộ môn thêm/xóa thành viên và đổi trạng thái nhóm; giảng viên thường chỉ xem.
6. Tạo câu trắc nghiệm cá nhân; gửi ngân hàng chung, nhận yêu cầu sửa, chỉnh câu rồi gửi lại. Câu đã duyệt không sửa trực tiếp.
7. Sinh câu hỏi AI từ tài liệu lớp và tệp tải lên; kiểm tra tiêu đề, nội dung, phương án, đáp án trước khi lưu các câu đã chọn.
8. Xem thông báo nhiều trang, đánh dấu đã đọc, mở thông báo đề đúng màn; sửa thông tin liên hệ và đổi mật khẩu.
9. Đăng xuất, đăng nhập lại; kiểm tra token hết hạn và không thấy dữ liệu của tài khoản trước.

Nội dung đề, đáp án và mật khẩu không được ghi vào console hoặc AsyncStorage. Các màn giảng viên dùng `SafeAreaView` ở layout, `ScrollView` hoặc `FlatList` cho nội dung dài và icon Lucide.
