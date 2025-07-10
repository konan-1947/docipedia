# Docipedia - Trình Giải Thích Thuật Ngữ Theo Ngữ Cảnh

**Docipedia** là một Tiện ích mở rộng (Extension) cho Google Chrome, khai thác Google Gemini API để cung cấp các giải thích theo yêu cầu và nhận biết ngữ cảnh cho các thuật ngữ kỹ thuật và khái niệm phức tạp trực tiếp trên mọi trang web. Tiện ích được thiết kế để tối ưu hóa quy trình làm việc của lập trình viên, nhà nghiên cứu và các chuyên gia bằng cách loại bỏ nhu cầu chuyển đổi ngữ cảnh (context-switching) để tra cứu định nghĩa.

[![Watch the video](https://img.youtube.com/vi/eVGxqiJbAOM/0.jpg)](https://www.youtube.com/watch?v=eVGxqiJbAOM)

## Chức Năng Cốt Lõi

- **Đánh Dấu Thuật Ngữ Động (Dynamic Term Highlighting):** Sử dụng `findAndReplaceDOMText` để "bọc" các thuật ngữ được xác định một cách an toàn bên trong DOM của trang mà không làm hỏng các event listener hiện có hoặc Virtual DOM của các framework SPA.
- **Phân Tích Bằng AI Theo Ngữ Cảnh:** Gửi nội dung văn bản chính của trang web đến Gemini API (model `gemini-pro`) để phân tích. Prompt được thiết kế chuyên biệt (engineered) để trích xuất các thuật ngữ chính và tạo ra các giải thích đa cấp (tóm tắt, giải thích theo ngữ cảnh, và phân tích sâu).
- **Xử Lý Có Trạng Thái (Stateful Processing):** Service Worker ở background duy trì trạng thái xử lý cho mỗi tab, ngăn chặn các lệnh gọi API trùng lặp và đảm bảo trải nghiệm người dùng nhất quán ngay cả khi popup được đóng và mở lại trong quá trình hoạt động.
- **Tùy Chỉnh Hành Vi AI:** (đang lười chưa làm) Người dùng có thể sửa đổi prompt hệ thống được gửi đến Gemini API thông qua cài đặt của tiện ích, cho phép tinh chỉnh phân tích dựa trên lĩnh vực chuyên môn cụ thể của họ (ví dụ: pháp lý, y tế, kỹ thuật phần mềm).
- **Xử Lý API Key An Toàn:** API Key do người dùng cung cấp được lưu trữ an toàn bằng `chrome.storage.sync`, đảm bảo chúng được cô lập khỏi content script và các trang web đang duyệt.

## Kiến Trúc Kỹ Thuật

- **Nền tảng:** Manifest V3
- **Logic lõi:** JavaScript (ES6+), Lập trình bất đồng bộ (Promises, async/await)
- **Background Script (`service_worker`):** Điều phối toàn bộ quy trình, quản lý trạng thái, xử lý tất cả giao tiếp với API và cập nhật Action Badge để phản ánh trạng thái hiện tại (đang xử lý, thành công, lỗi).
- **Content Script:** Chịu trách nhiệm tương tác với DOM, bao gồm trích xuất nội dung văn bản và áp dụng các đánh dấu dựa trên dữ liệu nhận được từ background script.
- **Popup UI:** Đóng vai trò là giao diện người dùng chính để khởi tạo phân tích, quản lý API Key và tùy chỉnh prompt. Nó giao tiếp với background script để lấy trạng thái thời gian thực của các tác vụ đang chạy.

## Cài Đặt và Sử Dụng

### 1. Cài Đặt

1.  Sao chép (clone) hoặc tải về toàn bộ repository này.
2.  Truy cập `chrome://extensions` trên trình duyệt Google Chrome.
3.  Bật **"Chế độ dành cho nhà phát triển" (Developer mode)**.
4.  Nhấp vào **"Tải tiện ích đã giải nén" (Load unpacked)** và chọn thư mục dự án.

### 2. Cấu Hình

1.  Nhấp vào biểu tượng Docipedia trên thanh công cụ của Chrome.
2.  Bạn sẽ được yêu cầu nhập **Google Gemini API Key**.
3.  Tạo một khóa API mới từ [Google AI Studio](https://aistudio.google.com/app/apikey) và dán vào trường nhập liệu.

### 3. Vận Hành

1.  Truy cập một trang web chứa tài liệu kỹ thuật hoặc văn bản phức tạp.
2.  Nhấp vào biểu tượng Docipedia, sau đó nhấp vào "Phân tích trang này".
3.  Badge trên biểu tượng của tiện ích sẽ cập nhật thành `...` để báo hiệu đang xử lý.
4.  Khi hoàn tất, các thuật ngữ liên quan trên trang sẽ được đánh dấu. Di chuột qua một thuật ngữ để xem tóm tắt nhanh hoặc nhấp chuột để xem giải thích chi tiết.


