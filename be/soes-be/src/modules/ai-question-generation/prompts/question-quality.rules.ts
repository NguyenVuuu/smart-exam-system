export const difficultyRubric = [
  'TIÊU CHÍ ĐỘ KHÓ:',
  '- EASY: nhận biết, nhớ định nghĩa/cú pháp hoặc áp dụng trực tiếp một quy tắc; lập trình tính toán, rẽ nhánh/vòng lặp đơn giản.',
  '- MEDIUM: giải thích cơ chế, theo dõi luồng code, kết hợp vài bước vận dụng quen thuộc; lập trình duyệt mảng/chuỗi, tìm kiếm, đếm.',
  '- HARD: phân tích nhiều điều kiện tương tác, chẩn đoán lỗi từ tình huống mới, đánh giá lựa chọn/độ phức tạp hoặc thiết kế giải pháp thỏa ràng buộc. Không xếp HARD cho câu chỉ nhớ cú pháp hay lần theo một vòng lặp đơn giản.',
  '- Ví dụ phân biệt: hỏi định nghĩa kế thừa là EASY; xác định phương thức được gọi trong tình huống quen thuộc là MEDIUM; phân tích tương tác kiểu tĩnh/động và đề xuất sửa lỗi mà giữ hành vi là HARD nếu nguồn đã dạy các khái niệm đó.',
].join('\n')

export const objectiveRules = [
  'TRẮC NGHIỆM:',
  '- title là câu hỏi/mệnh đề ĐẦY ĐỦ từ 3 đến 200 ký tự, gồm cả mã nguồn nếu có; ưu tiên 120-170 ký tự để không vượt giới hạn. Thiết kế tình huống ngắn ngay từ đầu, không cắt bỏ dữ kiện. Chỉ trả content khi schema yêu cầu, khi đó content phải giống title.',
  '- SINGLE_CHOICE: đúng 4 phương án, đúng 1 đáp án đúng. MULTIPLE_CHOICE: 4-5 phương án, ít nhất 2 đáp án đúng.',
  '- TRUE_FALSE: một mệnh đề khẳng định, không câu nghi vấn; đúng 2 phương án "Đúng"/"Sai" và đúng 1 đáp án đúng.',
  '- Phương án khác nhau, không để đáp án lộ do dài/ngắn hay cách diễn đạt; giải thích vì sao đúng và nhầm lẫn của phương án sai.',
  '- Câu đọc code/tìm lỗi/dự đoán output là trắc nghiệm, không phải PROGRAMMING.',
  '- Chỉ trả các trường trong schema. Nếu schema yêu cầu: language = null, testCases = [], timeLimitMs = 2000, memoryLimitMb = 256, maxCodeSizeKb = 256.',
  '- explanation tối đa 5000 ký tự, difficultyReason từ 3 đến 1000 ký tự; mỗi phương án từ 1 đến 1000 ký tự.',
].join('\n')

export const programmingRules = [
  'LẬP TRÌNH:',
  '- Yêu cầu viết chương trình console hoàn chỉnh đọc stdin và in stdout. title ngắn tối đa 200 ký tự; options = []; language chọn JAVA/C/CPP theo tài liệu.',
  '- content bằng Markdown gồm Mô tả, Input, Output, Ràng buộc và Ví dụ input/output; xác định rõ định dạng từng dòng, kiểu số, quy tắc làm tròn nếu cần.',
  '- Cấu hình tài nguyên phù hợp thuật toán: timeLimitMs 100-60000, memoryLimitMb 16-2048, maxCodeSizeKb 1-1024.',
  '- Có ít nhất 1 test công khai khớp ví dụ; khi sinh mới có 2-4 test ẩn kiểm tra nhánh thường sai, biên hợp lệ và hiệu năng khi phù hợp. Tất cả input nằm trong ràng buộc, không trùng nhau.',
  '- Tự kiểm chứng expectedOutput bằng thuật toán; khớp chính xác định dạng stdout, chữ hoa/thường, xuống dòng \\n. Không thêm khoảng trắng thừa; không xuất lượng dữ liệu khổng lồ.',
  '- explanation nêu ý tưởng giải, các bước xử lý và độ phức tạp thời gian/bộ nhớ. Đối chiếu lời giải với ví dụ và từng test trước khi trả.',
].join('\n')
