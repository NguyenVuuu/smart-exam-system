# Bảo mật nội dung đề thi và kiểm chứng toàn vẹn

## Phạm vi

- Các bản ghi mới trong `ExamQuestion`, `ExamQuestionOption`, `ProgrammingTestCase`, `ExamReviewRound.snapshot` và ngân hàng câu hỏi nguồn (`Question`, `QuestionOption`, `QuestionProgrammingTestCase`) dùng AES-256-GCM ở phía backend. Khóa không được gửi tới frontend, lưu trong DB hoặc ghi lên blockchain.
- `Exam.contentHash` lưu dấu vân tay của bản đề. Hash phiên bản 2 (`v2:<sha256>`) gồm nội dung, đáp án, giải thích, phần thi, cấu hình và test case. Bản hash cũ vẫn được xác minh theo định dạng cũ.
- Sepolia chỉ lưu hash để đối chiếu tính toàn vẹn. Trạng thái `VALID` chỉ có khi nội dung hiện tại khớp cả hash DB và hash đọc trực tiếp từ blockchain. `NOT_ANCHORED` và `BLOCKCHAIN_UNAVAILABLE` không có nghĩa là đã xác minh.

## Cấu hình và xoay khóa

1. Cấp `EXAM_ENCRYPTION_KEY` bằng 32 byte ngẫu nhiên ở dạng 64 ký tự hex. Giữ bí mật ngoài Git và ngoài DB. `EXAM_ENCRYPTION_KEY_ID` là mã khóa không bí mật, mặc định `primary`.
2. Khi xoay khóa, tạo khóa mới và **đổi key ID**. Cung cấp khóa cũ qua `EXAM_DECRYPTION_KEYS` dưới dạng JSON `{ "old-id": "<old-64-hex-key>" }`. Với ciphertext đời đầu `enc:<iv>:<tag>:<body>`, cung cấp `EXAM_LEGACY_ENCRYPTION_KEY` nếu khóa hiện tại đã đổi.
3. Sao lưu DB và khóa cũ riêng biệt. Trong thời gian bảo trì, dừng các tiến trình ghi đề, rồi chạy từ `be/soes-be`: `npx ts-node prisma/reencrypt-exam-secrets.ts`. Công cụ chỉ in số bản ghi, không in nội dung đề.
4. Chạy lại công cụ để kiểm tra tính idempotent: các bộ đếm phải bằng 0. Chỉ bỏ khóa cũ sau khi xác nhận dữ liệu và bản sao lưu còn đọc được.

Thiếu hoặc sai khóa làm thao tác mã hóa/giải mã thất bại. Không thay khóa hiện tại bằng chuỗi tự nghĩ ra hoặc ghi khóa vào mã nguồn. [Hướng dẫn quản lý khóa của OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) khuyến nghị tách khóa khỏi dữ liệu và có quy trình xoay khóa.

## Vận hành blockchain

- Khi công bố đề thường kỳ/giữa kỳ hoặc duyệt đề cuối kỳ, backend ghi hash lên Sepolia. Nếu chain chưa cấu hình hoặc giao dịch lỗi, đề có thể chỉ có hash cục bộ. Giao diện phải hiển thị đúng trạng thái này.
- Backend thử lại theo lô 10 đề `READY` có `anchorRequestedAt` và chưa được anchor mỗi 60 giây khi đã cấu hình blockchain. Cursor chuyển sang lô tiếp theo dù một đề ghi lỗi, tránh kẹt hàng đợi. Cột này chỉ được đặt khi đề được công bố/duyệt kể từ thay đổi này, nên các đề cũ không tự động được đưa lên chain. Trước khi gửi lại, backend kiểm tra hash cục bộ có khớp nội dung hiện tại; nếu không khớp thì bỏ qua và ghi lỗi. Lời gọi ghi lên chain là idempotent theo mã đề và phiên bản hash. Không tuyên bố `VALID` nếu chưa đọc được chain.
- Tạo và cập nhật ca thi chỉ được thực hiện khi backend đọc trực tiếp bản hash trên chain và xác nhận trạng thái `VALID`. Khi RPC chưa sẵn sàng, thao tác này trả về lỗi để thử lại sau; nút xác minh trên giao diện chỉ là phản hồi cho người dùng, không thay thế kiểm tra ở backend.
- Trước khi dùng trong môi trường thật, xác nhận chain ID, địa chỉ và mã nguồn hợp đồng, quyền `storeHash`, chính sách chống ghi đè, giao dịch đã xác nhận, chi phí và cơ chế khôi phục.

## Giới hạn hiện tại

Theo yêu cầu hiện tại, dữ liệu ngân hàng câu hỏi nguồn đã có sẵn trong DB không được chuyển đổi tự động. Các bản ghi cũ dạng plaintext vẫn đọc được để tương thích, nên người đọc trực tiếp DB vẫn có thể thấy nội dung đó. Khi được phép chuyển dữ liệu cũ, dùng script `reencrypt-exam-secrets.ts` trong cửa sổ bảo trì và xác minh bộ đếm chạy lại bằng 0.
