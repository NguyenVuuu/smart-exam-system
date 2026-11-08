# Triển khai xác minh khuôn mặt sinh viên

## Phạm vi

Sinh viên đăng ký khuôn mặt một lần sau khi đăng nhập lần đầu trên web hoặc mobile. Chỉ web có chức năng làm bài và yêu cầu xác minh lại trước mỗi lần vào hoặc vào lại bài thi. Mobile không có màn hình làm bài. SOES không lưu ảnh hoặc video khuôn mặt; AWS Rekognition Collection lưu đặc trưng khuôn mặt để so khớp.

## Chuẩn bị AWS

1. Chọn một AWS Region hỗ trợ Face Liveness cho cả backend, web và mobile. Tạo Rekognition Collection trước khi bật tính năng.
2. Cấp cho vai trò chạy backend các action `rekognition:CreateFaceLivenessSession`, `rekognition:GetFaceLivenessSessionResults`, `rekognition:IndexFaces`, `rekognition:SearchFacesByImage`, `rekognition:DeleteFaces`. Giới hạn quyền trên collection và môi trường tương ứng theo khả năng của từng action.
3. Tạo Cognito Identity Pool cho web và mobile trong cùng Region. Vai trò client chỉ được gọi `rekognition:StartFaceLivenessSession`. Backend giữ quyền tạo phiên và đọc kết quả; client không nhận AWS access key dài hạn.
4. Đánh giá chính sách lưu giữ, thu hồi và xóa khuôn mặt trong Rekognition Collection trước khi dùng dữ liệu thật. SOES lưu `providerFaceId` để xác định đúng face khi thu hồi; cần xóa face tương ứng khỏi collection. Phiên bản hiện tại chưa có luồng thu hồi tự phục vụ.

Với cấu hình `allowGuestAccess: true` của web, gắn inline policy sau vào **unauthenticated role** mà Cognito Identity Pool đang cấp. Kiểm tra đúng role bằng danh tính tạm thời của pool. AWS [hướng dẫn `StartFaceLivenessSession` cho vai trò này](https://ui.docs.amplify.aws/react/connected-components/liveness).

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "rekognition:StartFaceLivenessSession",
    "Resource": "*"
  }]
}
```

Nếu web báo `AccessDeniedException` sau khi cấp quyền, kiểm tra explicit deny, permissions boundary, SCP và việc backend tạo phiên trong cùng tài khoản/Region với vai trò client. Phiên lỗi chỉ dùng một lần; tạo phiên mới để thử lại.

Tham khảo [Face Liveness API](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-programming-api.html) và [quản lý collection](https://docs.aws.amazon.com/rekognition/latest/dg/managing-face-collections.html).

## Biến môi trường

- Backend: `FACE_VERIFICATION_ENABLED=true`, `FACE_VERIFICATION_PROVIDER=aws`, `AWS_FACE_REGION`, `AWS_FACE_COLLECTION_ID`; dùng AWS credential chain của server. Các ngưỡng mặc định: liveness 90, similarity 90, phiên 180 giây, quyền vào thi 300 giây, khóa 120 giây sau 3 lần sai, chuyển giám thị sau 6 lần sai.
- Web: `VITE_AWS_FACE_REGION` và `VITE_AWS_FACE_IDENTITY_POOL_ID` của cùng Region.
- Mobile: `EXPO_PUBLIC_AWS_FACE_IDENTITY_POOL_ID` của cùng Region; tạo development/production build mới vì camera liveness là native module. Expo Go không đủ.
- Không đặt AWS secret trong biến `VITE_*` hoặc `EXPO_PUBLIC_*`. Không commit file `.env`.

`FACE_VERIFICATION_PROVIDER=mock` chỉ để thử luồng trên môi trường phát triển. Mock luôn cho kết quả thành công, không gọi AWS; server từ chối khởi động nếu dùng mock với `NODE_ENV=production`.

## Áp dụng và kiểm tra

1. Chạy `npx prisma migrate deploy` rồi `npx prisma generate` trong `be/soes-be` trước khi bật cờ.
2. Build backend và web, typecheck và build mobile. Xác nhận camera và Cognito chạy trên thiết bị iOS/Android thật bằng development build.
3. Dùng tài khoản sinh viên mới: đăng nhập, đăng ký một lần, sau đó vào web thi và xác minh trước khi bắt đầu. Thử thoát trang rồi vào lại, sai 3 lần, đợi 2 phút, sai thêm 3 lần, và duyệt thủ công bằng tài khoản giám thị được phân công.
4. Kiểm tra audit log, quyền của các vai trò và không có ảnh/video, credential, token trong log. Theo dõi chi phí Rekognition và đặt giới hạn sử dụng phù hợp.
5. Kiểm thử đồng thời hai phiên đăng ký với provider mock và PostgreSQL cục bộ: đặt `FACE_INTEGRATION_TEST=1`, rồi chạy `node -r ts-node/register -e "require('./src/modules/student-face/services/student-face.postgres.test.ts')"` trong `be/soes-be`. Test tạo và xóa fixture riêng.

Grant vào thi được tiêu thụ khi tạo hoặc vào lại lượt thi; quyền tải nội dung bài chỉ dùng một lần. Nếu đóng hoặc tải lại màn hình, sinh viên quay lại trang chi tiết và xác minh mới. Khi màn hình vẫn mở, mất mạng ngắn không kích hoạt tải lại nội dung bài.
Các API lưu bài, nộp bài, nhịp kết nối, giám sát và chạy mã chỉ nhận grant của lượt vào bài mới nhất sau khi nội dung đã được mở.

Chưa thể xác nhận kiểm thử camera và IAM chỉ bằng build cục bộ; cần môi trường AWS và thiết bị thật.
