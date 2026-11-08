# Đăng ký khuôn mặt trên mobile

Ứng dụng sinh viên đăng ký khuôn mặt bằng camera ngay trong app. Việc xác minh trước khi vào thi và làm bài vẫn ở web.

## Cấu hình

1. Tạo Cognito Identity Pool trong cùng AWS Region với Rekognition Face Liveness của backend, bật quyền guest/unauthenticated identities cho ứng dụng mobile.
2. Cấp cho role guest của Identity Pool quyền `rekognition:StartFaceLivenessSession` theo phạm vi cần thiết. Backend tiếp tục tạo phiên và đọc kết quả; không cấp quyền đọc kết quả cho mobile.
3. Đặt `EXPO_PUBLIC_AWS_FACE_IDENTITY_POOL_ID` trong `mobile/soes-mobile/.env` thành ID của pool. Đây là ID công khai, không phải AWS secret key. Giữ `EXPO_PUBLIC_API_URL` trỏ tới backend đang chạy.
4. Cấu hình face verification trên backend, áp dụng migration liên quan và khởi động lại backend.
5. Tạo Expo Development Build mới sau khi thêm native module: `npx expo run:android` hoặc build iOS bằng EAS/macOS. Expo Go không chứa native module này.

Không đặt AWS access key hoặc secret key trong ứng dụng mobile. Backend sử dụng khóa riêng để quản lý phiên, xử lý kết quả và lưu hồ sơ đăng ký.
