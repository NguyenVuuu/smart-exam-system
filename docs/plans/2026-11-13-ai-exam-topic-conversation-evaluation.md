# Agent đề thi, chủ đề và hội thoại

## Mục tiêu

- Giảng viên nhập yêu cầu để agent chọn câu từ ngân hàng hợp lệ và tạo đề nháp; backend kiểm tra quyền, môn học, số lượng, định dạng, chủ đề và câu trùng trước khi lưu.
- Agent gợi ý chủ đề sẵn có hoặc chủ đề mới cho câu hỏi AI; giảng viên xác nhận trước khi gắn nhãn.
- Lưu hội thoại học tập và phân tích ca thi theo tài khoản, vai trò và ngữ cảnh; chỉ gửi vài lượt gần đây cùng bằng chứng hiện được phép xem.
- Đánh giá tính đúng đắn của ma trận và chất lượng gợi ý trên dữ liệu môn học thật theo cách tái lập được, không đưa dữ liệu nhạy cảm vào báo cáo.

## Các bước triển khai

1. **Hợp đồng và bộ chọn đề:** thêm request/response có kiểu cho agent; truy vấn câu hỏi đã đủ điều kiện, đưa metadata giới hạn vào agent, kiểm tra danh sách câu và phân bố chủ đề tại backend. Kiểm thử đề thiếu câu, sai môn, sai format, ID giả và câu trùng. Commit riêng.
2. **Giao diện sinh đề:** thay khối gợi ý ma trận bằng nhập mục tiêu và số câu; hiển thị đề xuất ma trận chủ đề và bản xem trước trước khi tạo nháp. Chỉ giữ lựa chọn AI và bốc ngẫu nhiên theo độ khó theo yêu cầu mới nhất. Commit riêng.
3. **Gợi ý chủ đề:** endpoint gợi ý dựa trên nội dung câu và taxonomy môn, phân biệt chủ đề hiện có với đề xuất mới; giao diện duyệt trong modal gắn chủ đề. Không tự tạo chủ đề. Commit riêng.
4. **Hội thoại bền vững:** thêm schema và migration; API đọc/tạo hội thoại theo chủ sở hữu và ngữ cảnh, giới hạn lịch sử; dùng lịch sử chỉ làm ngữ cảnh câu hỏi, bằng chứng luôn được truy xuất lại. Giao diện xem tiếp hội thoại. Kiểm thử truy cập chéo. Commit riêng.
5. **Đánh giá môn học thật:** lệnh đọc ngân hàng từ DB để tính coverage, thiếu nhãn, phân bố độ khó và kiểm tra đề xuất qua agent; báo cáo aggregate, có trường hợp thiếu dữ liệu. Chạy trên DB nếu khả dụng, lưu kết quả không chứa nội dung câu hỏi. Commit riêng.

## Kiểm tra cuối

- Build TypeScript backend/frontend, chạy Python test và test nghiệp vụ liên quan.
- Kiểm tra migration và trạng thái Git; không đưa `.env`, `docker-compose.yml` hoặc dữ liệu riêng vào commit.
