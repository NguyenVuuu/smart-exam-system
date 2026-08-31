# Bộ câu hỏi kiểm thử Judge0

Quy ước: `Công khai` dùng để sinh viên chạy thử; `Ẩn` chỉ chạy khi nộp bài. Mỗi câu chấm trọn điểm khi vượt qua toàn bộ test case.

## C++ (Clang 9.0.1)

### 1. Tổng hai số nguyên

- Độ khó: EASY
- Thời gian: 1000 ms; bộ nhớ: 64 MB; mã nguồn tối đa: 32 KB
- Nội dung: Cho hai số nguyên `a`, `b`. In ra tổng của chúng.
- Input: Một dòng gồm hai số nguyên `a b`, với `-10^9 <= a, b <= 10^9`.
- Output: Một số nguyên là `a + b`.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `2 3` | `5` |
| Công khai | `-5 8` | `3` |
| Ẩn | `0 0` | `0` |
| Ẩn | `1000000000 -1000000000` | `0` |
| Ẩn | `999999999 1` | `1000000000` |

### 2. Chuỗi đối xứng

- Độ khó: EASY
- Thời gian: 1000 ms; bộ nhớ: 64 MB; mã nguồn tối đa: 32 KB
- Nội dung: Kiểm tra chuỗi chỉ gồm chữ cái Latin thường có phải chuỗi đối xứng hay không.
- Input: Một chuỗi `s`, `1 <= |s| <= 100000`.
- Output: In `YES` nếu đối xứng, ngược lại in `NO`.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `level` | `YES` |
| Công khai | `hello` | `NO` |
| Ẩn | `a` | `YES` |
| Ẩn | `abba` | `YES` |
| Ẩn | `abca` | `NO` |

### 3. Số lớn thứ hai phân biệt

- Độ khó: MEDIUM
- Thời gian: 1000 ms; bộ nhớ: 128 MB; mã nguồn tối đa: 64 KB
- Nội dung: Tìm giá trị lớn thứ hai phân biệt trong dãy số nguyên.
- Input: Dòng đầu là `n` (`2 <= n <= 200000`), dòng sau gồm `n` số trong đoạn `[-10^9, 10^9]`.
- Output: In giá trị lớn thứ hai phân biệt; in `NO` nếu không tồn tại.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `5\n1 4 2 4 3` | `3` |
| Công khai | `4\n7 7 7 7` | `NO` |
| Ẩn | `2\n-1 -2` | `-2` |
| Ẩn | `6\n5 1 5 4 4 2` | `4` |
| Ẩn | `3\n-5 -1 -3` | `-3` |

### 4. Dãy ngoặc hợp lệ

- Độ khó: MEDIUM
- Thời gian: 1000 ms; bộ nhớ: 128 MB; mã nguồn tối đa: 64 KB
- Nội dung: Kiểm tra một chuỗi gồm `()[]{}` có phải dãy ngoặc hợp lệ hay không.
- Input: Một chuỗi `s`, `1 <= |s| <= 200000`.
- Output: In `VALID` hoặc `INVALID`.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `([]{})` | `VALID` |
| Công khai | `([)]` | `INVALID` |
| Ẩn | `(` | `INVALID` |
| Ẩn | `{[()()]}` | `VALID` |
| Ẩn | `())` | `INVALID` |

### 5. Đường đi ngắn nhất

- Độ khó: HARD
- Thời gian: 2000 ms; bộ nhớ: 256 MB; mã nguồn tối đa: 128 KB
- Nội dung: Cho đồ thị vô hướng có trọng số không âm. Tìm khoảng cách ngắn nhất từ đỉnh `1` đến đỉnh `n`.
- Input: Dòng đầu `n m` (`2 <= n <= 100000`, `1 <= m <= 200000`). Mỗi dòng tiếp theo gồm cạnh `u v w`, `0 <= w <= 10^9`.
- Output: Khoảng cách ngắn nhất, hoặc `-1` nếu không có đường đi.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `4 4\n1 2 5\n2 4 3\n1 3 2\n3 4 10` | `8` |
| Công khai | `3 1\n1 2 4` | `-1` |
| Ẩn | `2 1\n1 2 0` | `0` |
| Ẩn | `5 6\n1 2 2\n1 3 9\n2 3 3\n2 4 1\n4 5 4\n3 5 1` | `6` |
| Ẩn | `4 5\n1 2 1000000000\n2 4 1000000000\n1 3 1\n3 4 1\n2 3 1` | `2` |

## Java (OpenJDK 13.0.1)

### 6. Giai thừa

- Độ khó: EASY
- Thời gian: 1000 ms; bộ nhớ: 128 MB; mã nguồn tối đa: 32 KB
- Nội dung: Tính `n!`.
- Input: Một số nguyên `n`, `0 <= n <= 20`.
- Output: Giá trị `n!` dưới dạng số nguyên 64 bit.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `5` | `120` |
| Công khai | `0` | `1` |
| Ẩn | `1` | `1` |
| Ẩn | `10` | `3628800` |
| Ẩn | `20` | `2432902008176640000` |

### 7. Đếm số nguyên tố

- Độ khó: MEDIUM
- Thời gian: 2000 ms; bộ nhớ: 256 MB; mã nguồn tối đa: 64 KB
- Nội dung: Đếm số lượng số nguyên tố không vượt quá `n`.
- Input: Một số nguyên `n`, `0 <= n <= 5000000`.
- Output: Số lượng số nguyên tố trong đoạn `[2, n]`.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `10` | `4` |
| Công khai | `1` | `0` |
| Ẩn | `2` | `1` |
| Ẩn | `100` | `25` |
| Ẩn | `1000` | `168` |

### 8. Phần tử xuất hiện nhiều nhất

- Độ khó: MEDIUM
- Thời gian: 1500 ms; bộ nhớ: 256 MB; mã nguồn tối đa: 64 KB
- Nội dung: Tìm số xuất hiện nhiều nhất trong dãy. Nếu có nhiều số cùng tần suất, chọn số nhỏ nhất.
- Input: Dòng đầu là `n` (`1 <= n <= 200000`), dòng sau gồm `n` số nguyên trong đoạn `[-10^9, 10^9]`.
- Output: In `giá_trị tần_suất`.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `7\n1 2 2 3 3 3 1` | `3 3` |
| Công khai | `4\n5 4 5 4` | `4 2` |
| Ẩn | `1\n-7` | `-7 1` |
| Ẩn | `6\n-1 -1 0 0 2 2` | `-1 2` |
| Ẩn | `8\n10 10 10 2 2 3 3 3` | `3 3` |

### 9. Xoay ma trận 90 độ

- Độ khó: MEDIUM
- Thời gian: 1500 ms; bộ nhớ: 256 MB; mã nguồn tối đa: 96 KB
- Nội dung: Xoay ma trận vuông 90 độ theo chiều kim đồng hồ.
- Input: Dòng đầu là `n` (`1 <= n <= 500`), tiếp theo là `n` dòng, mỗi dòng có `n` số nguyên.
- Output: Ma trận sau khi xoay, mỗi hàng trên một dòng, các số cách nhau bởi một dấu cách.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `2\n1 2\n3 4` | `3 1\n4 2` |
| Công khai | `1\n9` | `9` |
| Ẩn | `3\n1 2 3\n4 5 6\n7 8 9` | `7 4 1\n8 5 2\n9 6 3` |
| Ẩn | `2\n-1 0\n2 -3` | `2 -1\n-3 0` |
| Ẩn | `3\n0 0 1\n0 1 0\n1 0 0` | `1 0 0\n0 1 0\n0 0 1` |

### 10. Tổng lớn nhất của đoạn con liên tiếp

- Độ khó: HARD
- Thời gian: 1000 ms; bộ nhớ: 128 MB; mã nguồn tối đa: 64 KB
- Nội dung: Tìm tổng lớn nhất của một đoạn con liên tiếp không rỗng.
- Input: Dòng đầu là `n` (`1 <= n <= 1000000`), dòng sau gồm `n` số nguyên trong đoạn `[-10^9, 10^9]`.
- Output: Tổng lớn nhất dưới dạng số nguyên 64 bit.

| Loại | Input | Expected output |
|---|---|---|
| Công khai | `8\n-2 1 -3 4 -1 2 1 -5` | `6` |
| Công khai | `3\n-5 -2 -8` | `-2` |
| Ẩn | `1\n7` | `7` |
| Ẩn | `5\n1 2 3 4 5` | `15` |
| Ẩn | `6\n1000000000 1000000000 -1 1000000000 -5 2` | `2999999999` |

## Cách nhập để kiểm thử

1. Tạo câu hỏi với đúng ngôn ngữ và cấu hình ghi ở từng bài.
2. Với dòng `Công khai`, để tùy chọn **Ẩn test case** ở trạng thái tắt.
3. Với dòng `Ẩn`, bật **Ẩn test case**.
4. Tạo đề nháp, thêm câu hỏi, công bố đề và tạo ca thi.
5. Khi sinh viên bấm **Chạy thử**, hệ thống chỉ được hiển thị hai test công khai.
6. Khi sinh viên nộp bài, hệ thống phải chạy đủ năm test; chỉ pass cả năm mới nhận trọn điểm câu hỏi.
