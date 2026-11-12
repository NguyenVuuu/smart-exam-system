# Rà soát giám sát thi

## Quyền truy cập và dữ liệu

- Socket sinh viên chỉ vào phòng lượt thi của chính mình sau khi máy chủ kiểm tra quyền sở hữu và trạng thái lượt thi. Phòng ca thi chỉ dành cho giảng viên có quyền giám sát; nhật ký, tên sinh viên và URL bằng chứng được phát trong phòng này.
- API sinh viên không nhận sự kiện `PROCTOR_*`. Máy chủ quyết định mức độ và thời điểm vi phạm, kiểm tra các cờ giám sát của ca thi và giới hạn 30 báo cáo mỗi phút cho một lượt thi. Sinh viên không thể đóng vi phạm do giám thị tạo.
- Trạng thái camera, màn hình và bộ nhận diện trong heartbeat là thông tin do thiết bị sinh viên báo; giảng viên cần mở luồng trực tiếp hoặc xem bằng chứng trước khi kết luận vi phạm.

## Vòng đời phiên

- Khi nộp bài hoặc tự nộp do hết giờ, máy chủ đóng các vi phạm còn mở, ngắt phiên xem trực tiếp và rời phòng lượt thi. Giao diện sinh viên dừng chia sẻ màn hình khi bài kết thúc hoặc rời trang làm bài. Chuyển tab khi bài còn đang làm vẫn giữ chia sẻ toàn màn hình hoạt động.
- Nếu heartbeat quá hạn, máy chủ chỉ đánh dấu offline khi không có heartbeat mới hơn. Trạng thái camera/màn hình trong cơ sở dữ liệu chuyển sang mất kết nối/đã dừng; phòng giảng viên nhận sự kiện offline.
- Worker nhận diện thử khởi động lại tối đa ba lần với thời gian chờ tăng dần. Nếu không phục hồi, sinh viên thấy lỗi và giảng viên thấy cảnh báo qua heartbeat.
- Yêu cầu xem trực tiếp có thời hạn chờ phản hồi 8 giây và chờ hình 20 giây. Phiên đang xem được gia hạn trong Redis mỗi phút. Kết nối Socket.IO đứt sẽ đóng giao diện xem; khi kết nối lại, giảng viên có thể mở phiên mới và sinh viên nhận lại yêu cầu còn chờ.

## Kết nối mạng

Mặc định WebRTC dùng STUN. Với mạng chặn kết nối ngang hàng, cấu hình `VITE_RTC_ICE_SERVERS` theo mẫu trong `fe/soes-fe/.env.example` để thêm TURN. Đây là cấu hình đưa xuống trình duyệt; thông tin đăng nhập TURN cần có phạm vi và thời hạn phù hợp.

## Kiểm thử

Tự động: build backend/frontend; bài kiểm tra quyền phòng Socket, chính sách vi phạm và heartbeat; bài kiểm tra worker phát hiện mặt/điện thoại; bài kiểm tra đóng camera trên trình duyệt. Các bài kiểm tra tự động không cần tài khoản AWS hoặc ảnh khuôn mặt thật.

Các bước cần xác nhận trên hai trình duyệt hoặc thiết bị thật trước khi triển khai production:

1. Sinh viên A và B vào cùng ca; tạo vi phạm ở B. Kiểm tra A không nhận sự kiện hoặc URL bằng chứng của B, giảng viên được phân công vẫn nhận.
2. Gửi `PROCTOR_*`, mức độ `HIGH`, thời điểm cũ và sự kiện của cờ giám sát đã tắt qua API sinh viên. Kiểm tra bị từ chối hoặc máy chủ thay bằng giá trị chuẩn.
3. Tắt camera, ngừng chia sẻ màn hình, ngắt mạng quá timeout rồi kết nối lại. So sánh bảng giảng viên với trạng thái phiên trong cơ sở dữ liệu.
4. Nộp bài và để hết giờ trong hai lượt riêng. Kiểm tra luồng trực tiếp và chia sẻ màn hình dừng, vi phạm mở được đóng. Trong lúc còn làm bài, chuyển tab rồi xác nhận màn hình vẫn tiếp tục được chia sẻ.
5. Chặn tải `vision-worker.js` hoặc mô hình để ép lỗi; xác nhận tối đa ba lần thử và cảnh báo trên máy giảng viên. Thử với camera thật để kiểm tra trường hợp có/không có mặt và điện thoại, rồi giám thị xem bằng chứng trước khi kết luận.
6. Thử xem trực tiếp khi sinh viên mất socket, trên mạng chỉ có TURN, và phiên kéo dài hơn 10 phút. Kiểm tra trạng thái chờ kết thúc bằng thông báo cụ thể và phiên đang xem không tự hết hạn.
