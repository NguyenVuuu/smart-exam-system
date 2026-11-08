# Đăng ký khuôn mặt trên mobile

Ứng dụng sinh viên đăng ký khuôn mặt bằng camera ngay trong app. Việc xác minh trước khi vào thi và làm bài vẫn ở web.

## Cấu hình

1. Tạo Cognito Identity Pool trong cùng AWS Region với Rekognition Face Liveness của backend, bật quyền guest/unauthenticated identities cho ứng dụng mobile.
2. Cấp cho role guest của Identity Pool quyền `rekognition:StartFaceLivenessSession` theo phạm vi cần thiết. Backend tiếp tục tạo phiên và đọc kết quả; không cấp quyền đọc kết quả cho mobile.
3. Đặt `EXPO_PUBLIC_AWS_FACE_IDENTITY_POOL_ID` trong `mobile/soes-mobile/.env` thành ID của pool. Đây là ID công khai, không phải AWS secret key. Giữ `EXPO_PUBLIC_API_URL` trỏ tới backend đang chạy.
4. Cấu hình face verification trên backend, áp dụng migration liên quan và khởi động lại backend.
5. Tạo Expo Development Build mới sau khi thêm hoặc thay đổi native module: `npx expo run:android` hoặc build iOS bằng EAS/macOS. Expo Go không chứa native module này. Bản iOS cũ cần được cài lại để nhận đăng ký Face Liveness trong AppDelegate của Expo SDK 58; chỉ tải lại JavaScript không cập nhật được phần native.

Nếu bấm **Mở camera xác minh** rồi quay về màn hình đăng ký, xem mã lỗi hiển thị trong app hoặc dòng `Face Liveness mobile failed` ở Metro/Xcode/Logcat. `NOT_REGISTERED` là bản iOS chưa có phần native mới; `CAMERA_PERMISSION_DENIED` là thiếu quyền camera; `ACCESS_DENIED` là quyền Cognito; `SESSION_NOT_FOUND` hoặc `SESSION_TIMED_OUT` là phiên AWS hết hạn. Không gửi log chứa token, ảnh hoặc video.

Không đặt AWS access key hoặc secret key trong ứng dụng mobile. Backend sử dụng khóa riêng để quản lý phiên, xử lý kết quả và lưu hồ sơ đăng ký.
