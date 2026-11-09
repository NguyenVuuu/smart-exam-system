# Triển khai xác minh khuôn mặt sinh viên

## Phạm vi

Sinh viên đăng ký khuôn mặt một lần sau khi đăng nhập lần đầu trên web hoặc mobile. Chỉ web có chức năng làm bài và yêu cầu xác minh lại trước mỗi lần vào hoặc vào lại bài thi. Mobile không có màn hình làm bài. SOES mặc định lưu ảnh tham chiếu đăng ký và ảnh quét thất bại gần nhất của từng ca thi dưới dạng mã hóa AES-256-GCM trong PostgreSQL để giám thị đối chiếu khi duyệt thủ công. SOES không lưu video. AWS Rekognition Collection lưu đặc trưng khuôn mặt để so khớp.

Trên web, sinh viên xác minh khuôn mặt trước. Chỉ sau khi xác minh đạt, ứng dụng mới yêu cầu webcam giám sát, chia sẻ màn hình, toàn màn hình và mật khẩu ca thi (nếu ca thi bật các yêu cầu này). Tránh mở webcam giám sát cùng lúc với camera Face Liveness. Grant vào thi có hiệu lực 5 phút theo cấu hình mặc định; nếu hết hạn trong lúc chuẩn bị thiết bị, ứng dụng đóng các luồng thiết bị và yêu cầu xác minh lại. Đồng hồ thời gian làm bài bắt đầu khi backend tạo lượt thi, không bắt đầu lúc quét mặt.

## Chuẩn bị AWS

1. Chọn một AWS Region hỗ trợ Face Liveness cho cả backend, web và mobile. Tạo Rekognition Collection trước khi bật tính năng.
2. Cấp cho vai trò chạy backend các action `rekognition:CreateFaceLivenessSession`, `rekognition:GetFaceLivenessSessionResults`, `rekognition:DetectFaces`, `rekognition:IndexFaces`, `rekognition:SearchFacesByImage`, `rekognition:DeleteFaces`. `DetectFaces` phân tích ảnh trực tiếp, không gắn với Collection nên cần policy có `Resource: "*"` cho action này; giới hạn các action còn lại theo tài nguyên hỗ trợ.
3. Tạo Cognito Identity Pool cho web và mobile trong cùng Region. Vai trò client chỉ được gọi `rekognition:StartFaceLivenessSession`. Backend giữ quyền tạo phiên và đọc kết quả; client không nhận AWS access key dài hạn.
4. Đánh giá chính sách lưu giữ, thu hồi và xóa khuôn mặt trong Rekognition Collection trước khi dùng dữ liệu thật. SOES lưu `providerFaceId` để xác định đúng face khi thu hồi; cần xóa face tương ứng khỏi collection. Phiên bản hiện tại chưa có luồng thu hồi tự phục vụ. Ảnh đăng ký được giữ cùng hồ sơ đang hoạt động; ảnh quét thất bại được thay bằng lần mới nhất và tự xóa sau 7 ngày mặc định. Cần có quy trình xóa ảnh trong bản sao lưu theo chính sách dữ liệu của đơn vị.

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

- Backend: `FACE_VERIFICATION_ENABLED=true`, `FACE_VERIFICATION_PROVIDER=aws`, `AWS_FACE_REGION`, `AWS_FACE_COLLECTION_ID`; dùng AWS credential chain của server. Các ngưỡng mặc định: liveness đăng ký lần đầu 70 (`FACE_ENROLLMENT_LIVENESS_THRESHOLD`), liveness vào thi 70 (`FACE_LIVENESS_THRESHOLD`), độ tương đồng khuôn mặt vào thi 80 (`FACE_SIMILARITY_THRESHOLD`), phiên 180 giây, quyền vào thi 300 giây, khóa 120 giây sau 3 lần sai, chuyển giám thị sau 6 lần sai. Đăng ký và vào thi đều dùng thử thách di chuyển mặt kèm ánh sáng (`FACE_ENROLLMENT_CHALLENGE=FaceMovementAndLightChallenge`, `FACE_EXAM_CHALLENGE=FaceMovementAndLightChallenge`). AWS quyết định thời gian hoàn tất phiên quét; hệ thống không cấu hình riêng số giây phải giữ mặt. Đặt mặt vừa khung bầu dục là bước hướng dẫn chụp; AWS vẫn phải hoàn thành kiểm tra người thật và cung cấp ảnh tham chiếu. Ngưỡng 80 là điểm tương đồng do Rekognition trả về, không phải bảo đảm xác suất nhận dạng đúng 80%.
- Tạo khóa ngẫu nhiên 32 byte, ghi dạng 64 ký tự hex vào `FACE_IMAGE_ENCRYPTION_KEY` chỉ trên backend. Giữ khóa ổn định qua lần triển khai; mất khóa sẽ không đọc được ảnh đã lưu. Đặt `FACE_REVIEW_IMAGE_RETENTION_DAYS=7` (cho phép 1–30). Không đặt khóa trong frontend/mobile, log hoặc Git. Sao lưu và luân chuyển khóa theo quy trình riêng trước khi thay khóa cũ.
- Web: `VITE_AWS_FACE_REGION` và `VITE_AWS_FACE_IDENTITY_POOL_ID` của cùng Region.
- Mobile: `EXPO_PUBLIC_AWS_FACE_IDENTITY_POOL_ID` của cùng Region; tạo development/production build mới vì camera liveness là native module. Expo Go không đủ.
- Không đặt AWS secret trong biến `VITE_*` hoặc `EXPO_PUBLIC_*`. Không commit file `.env`.

`FACE_VERIFICATION_PROVIDER=mock` chỉ để thử luồng trên môi trường phát triển. Mock luôn cho kết quả thành công, không gọi AWS; server từ chối khởi động nếu dùng mock với `NODE_ENV=production`.

AWS có thể trả `SUCCEEDED` nhưng điểm liveness vẫn dưới ngưỡng chấp nhận của SOES. Khi đó API trả mã `LIVENESS_LOW_CONFIDENCE` và các mã Feedback để hướng dẫn quét lại; ứng dụng không hiển thị điểm số. Ngưỡng 70 cần được kiểm thử thực tế trên các thiết bị đại diện để cân bằng số lần từ chối nhầm và khả năng loại trừ giả mạo. Đăng ký và vào thi đều dùng thử thách di chuyển mặt kèm ánh sáng; [AWS khuyến nghị](https://docs.aws.amazon.com/rekognition/latest/dg/recommendations-liveness.html) ánh sáng đều, tăng độ sáng màn hình trên web và dùng Feedback để hướng dẫn thử lại. Xem thêm [khác biệt giữa hai thử thách](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html).

Sau khi liveness đạt, backend dùng `DetectFaces` với thuộc tính `FACE_OCCLUDED` để kiểm tra ảnh tham chiếu và các ảnh audit được trả về, trước khi đăng ký hoặc cấp quyền vào thi. Phiên đăng ký yêu cầu tối đa 4 ảnh audit; AWS có thể trả ít hơn tùy video. Mỗi ảnh được kiểm tra phải có đúng một khuôn mặt, không bị che, và nhận định không bị che phải có độ tin cậy ít nhất 80. Đây là kiểm tra trên các ảnh AWS chọn, không phải bảo đảm phát hiện mọi lần che mặt ở mọi khung hình; cần thử trên thiết bị thật với những tình huống che mặt khác nhau. `DetectFaces` không lưu ảnh vào Collection.

Ảnh chỉ được trả qua API đã xác thực khi sinh viên đang chờ duyệt thủ công, đúng ca thi và đúng giám thị được phân công. Response đặt `Cache-Control: no-store`; trình duyệt tạo object URL tạm và thu hồi khi đóng màn hình. Nếu AWS không trả ảnh tham chiếu hoặc ảnh kiểm tra của lần quét cuối, giao diện báo không có ảnh thay vì hiển thị ảnh cũ. Hồ sơ đã đăng ký trước khi bật lưu ảnh không thể khôi phục ảnh đăng ký từ phiên AWS đã hết hạn; giám thị cần kiểm tra danh tính trực tiếp trong trường hợp này.

## Áp dụng và kiểm tra

1. Chạy `npx prisma migrate deploy` rồi `npx prisma generate` trong `be/soes-be` trước khi bật cờ.
2. Build backend và web, typecheck và build mobile. Xác nhận camera và Cognito chạy trên thiết bị iOS/Android thật bằng development build.
3. Dùng tài khoản sinh viên mới: đăng nhập, đăng ký một lần, sau đó vào web thi và xác minh trước khi bắt đầu. Thử thoát trang rồi vào lại, sai 3 lần, đợi 2 phút, sai thêm 3 lần, và duyệt thủ công bằng tài khoản giám thị được phân công.
4. Kiểm tra audit log, quyền của các vai trò, thời hạn xóa ảnh quét thất bại và không có ảnh/video, credential, token trong log. Theo dõi chi phí Rekognition và đặt giới hạn sử dụng phù hợp.
5. Kiểm thử đồng thời hai phiên đăng ký với provider mock và PostgreSQL cục bộ: đặt `FACE_INTEGRATION_TEST=1`, rồi chạy `node -r ts-node/register -e "require('./src/modules/student-face/services/student-face.postgres.test.ts')"` trong `be/soes-be`. Test tạo và xóa fixture riêng.

Grant vào thi được tiêu thụ khi tạo hoặc vào lại lượt thi; quyền tải nội dung bài chỉ dùng một lần. Nếu đóng hoặc tải lại màn hình, sinh viên quay lại trang chi tiết và xác minh mới. Khi màn hình vẫn mở, mất mạng ngắn không kích hoạt tải lại nội dung bài.
Các API lưu bài, nộp bài, nhịp kết nối, giám sát và chạy mã chỉ nhận grant của lượt vào bài mới nhất sau khi nội dung đã được mở.

Chưa thể xác nhận kiểm thử camera và IAM chỉ bằng build cục bộ; cần môi trường AWS và thiết bị thật.
