# Đánh giá agent trên dữ liệu môn học, 13/11/2026

Chạy `npx ts-node --transpile-only scripts/evaluate-ai-subject.ts` tại `be/soes-be` với agent Gemini 3.1 Flash Lite đang cấu hình. Lệnh đọc ngân hàng câu hỏi, không tạo hay công bố đề. Kiểm tra bắt buộc dùng cùng bộ quy tắc rà soát câu hỏi của hệ thống; báo cáo không chứa nội dung câu hoặc đáp án.

| Môn | Câu khả dụng | Câu cần rà soát | Câu gắn chủ đề | Số chủ đề |
| --- | ---: | ---: | ---: | ---: |
| CNPM101 | 7 | 0 | 0 | 0 |
| CPP101 | 12 | 0 | 0 | 0 |
| JAVA101 | 28 | 0 | 4 | 3 |
| REACT101 | 7 | 0 | 0 | 0 |
| SQL101 | 7 | 0 | 0 | 0 |

Trên JAVA101, agent chọn đủ 10 câu hợp lệ, có 3 câu đã gắn nhãn và bao phủ cả 3 chủ đề theo ràng buộc. Thời gian phản hồi lần này khoảng 18 giây. Gợi ý chủ đề trùng 1/4 nhãn cũ được thử. Đây là đối chiếu với nhãn hiện có, không phải phép đo độ đúng ngữ nghĩa: mẫu rất nhỏ và một số nhãn cũ cần giảng viên rà lại. Bốn môn còn lại chưa có câu nào được gắn chủ đề, nên không thể đánh giá ma trận theo chủ đề trên các môn đó.

Trước khi dùng rộng, giảng viên cần gắn/rà nhãn thêm, xem lại đề nháp và kiểm thử nhiều yêu cầu ở từng môn. Agent chỉ đề xuất; backend kiểm tra lại quyền, số câu, định dạng, chất lượng bắt buộc và phân bố chủ đề trước khi giảng viên lưu đề.
