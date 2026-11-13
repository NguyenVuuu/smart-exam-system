# Đánh giá agent trên ngân hàng môn học thật

Chạy migration và bật dịch vụ AI trước khi đánh giá. Từ `be/soes-be`:

```powershell
npx prisma migrate deploy
npx ts-node --transpile-only scripts/evaluate-ai-subject.ts
```

Có thể chọn môn cụ thể bằng `--subject-id <UUID>`. Lệnh chỉ đọc ngân hàng câu hỏi và gọi agent; không lưu hay công bố đề. Kết quả JSON gồm số câu đạt kiểm tra bắt buộc, số câu phải rà soát, tỷ lệ gắn chủ đề, phân bố độ khó, tính hợp lệ của danh sách đề xuất, số chủ đề được bao phủ và tỷ lệ gợi ý trùng nhãn hiện có trên tối đa 5 câu đã gắn nhãn. Báo cáo không in nội dung câu, đáp án hoặc mã định danh cá nhân.

Thêm `--exam-only` nếu chỉ cần đánh giá đề, không gọi các lượt gợi ý chủ đề.

`hitRate` là phép đo đối chiếu nhãn hiện có, không phải chứng nhận câu hỏi hay nhãn luôn đúng. Nếu AI hết quota hoặc không sẵn sàng, `examSelection.valid=false` và `topicSuggestion.attempted=0`; vẫn có thống kê ngân hàng để biết dữ liệu đầu vào đã đủ chưa. Giảng viên cần xem mẫu câu/đề, xác nhận nhãn và chạy nhiều lần trên từng môn trước khi dùng rộng rãi.
