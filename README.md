# Docipedia


**Docipedia** là một tiện ích mở rộng cho Google Chrome, sử dụng sức mạnh của Google Gemini AI để biến mọi tài liệu, bài viết, hay trang web phức tạp thành một cuốn bách khoa toàn thư tương tác.

Thay vì phải liên tục chuyển tab để tìm kiếm các thuật ngữ khó hiểu, Docipedia sẽ tự động tìm, đánh dấu và giải thích chúng ngay trong ngữ cảnh của bài viết, giúp bạn đọc nhanh hơn và hiểu sâu hơn.


[![Xem video](https://img.youtube.com/vi/none/0.jpg)](overview.mp4)


## ✨ Tính Năng Nổi Bật

- **Giải Thích Tự Động:** Tự động quét và xác định các thuật ngữ chuyên ngành, từ viết tắt, hoặc các khái niệm phức tạp trong trang web.
- **Ngữ Cảnh là Vua:** Cung cấp định nghĩa và giải thích được "may đo" riêng cho ngữ cảnh của tài liệu bạn đang đọc, thay vì các định nghĩa chung chung.
- **Giao Diện Trực Quan:** Các thuật ngữ được đánh dấu tinh tế. Chỉ cần di chuột qua để xem tóm tắt hoặc nhấp chuột để xem giải thích chi tiết.
- **Hỗ Trợ Tiếng Việt:** Toàn bộ phần giải thích được trả về bằng tiếng Việt, giúp phá vỡ rào cản ngôn ngữ.
- **Tùy Chỉnh Linh Hoạt:** Cho phép người dùng tùy chỉnh "bộ não" của AI bằng cách sửa đổi prompt hệ thống trực tiếp trong tiện ích.
- **Bảo Mật:** API Key của bạn được lưu trữ an toàn và chỉ được sử dụng để giao tiếp với Google, không được gửi đi bất cứ nơi nào khác.

## 🚀 Cài Đặt & Sử Dụng

### Cài Đặt

1.  Tải về toàn bộ mã nguồn của dự án này dưới dạng file `.zip`.
2.  Mở trình duyệt Google Chrome, truy cập vào địa chỉ `chrome://extensions`.
3.  Bật **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
4.  Nhấp vào nút **"Tải tiện ích đã giải nén" (Load unpacked)**.
5.  Chọn thư mục dự án mà bạn đã giải nén. Tiện ích Docipedia sẽ xuất hiện trong danh sách.

### Sử Dụng

1.  **Thiết lập API Key:**
    *   Lần đầu tiên sử dụng, hãy nhấp vào biểu tượng Docipedia trên thanh công cụ.
    *   Bạn sẽ được yêu cầu nhập **Google Gemini API Key**.
    *   Để lấy key, hãy truy cập [Google AI Studio](https://aistudio.google.com/app/apikey), tạo một API key mới và dán vào tiện ích.
    *   Nhấn "Lưu & Kích hoạt".

2.  **Phân Tích Trang Web:**
    *   Truy cập bất kỳ trang web nào có nội dung bạn muốn tìm hiểu.
    *   Nhấp vào biểu tượng Docipedia.
    *   Nhấn nút **"Phân tích trang này"**.
    *   Biểu tượng của tiện ích sẽ hiển thị trạng thái xử lý (`...`).
    *   Khi hoàn tất, các thuật ngữ trên trang sẽ được tự động gạch chân chấm chấm.

3.  **Tra Cứu:**
    *   **Xem nhanh:** Di chuột (hover) qua một từ được gạch chân để xem tóm tắt và giải thích ngắn gọn.
    *   **Xem chi tiết:** Nhấp chuột (click) vào từ đó để xem giải thích sâu hơn trong một cửa sổ `alert`.

4.  **Tùy Chỉnh Prompt (Nâng cao):**
    *   (đang lười chưa làm)



## 🛠️ Công Nghệ Sử Dụng

- **Nền tảng:** Google Chrome Extension Manifest V3
- **Ngôn ngữ:** HTML, CSS, JavaScript (ES6+)
- **API:** Google Gemini API
- **Thư viện:** `findAndReplaceDOMText` (để bọc văn bản một cách an toàn)

