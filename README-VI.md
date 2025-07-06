# Facebook Extended - Tiện ích kiểm soát toàn diện cho Facebook


**Facebook Extended** là một tiện ích trình duyệt (browser extension) mạnh mẽ, được thiết kế để mang lại cho bạn khả năng kiểm soát toàn diện trải nghiệm sử dụng Facebook. Chặn quảng cáo, ẩn các nội dung không mong muốn, tùy chỉnh giao diện và lọc bình luận spam một cách dễ dàng.

**Hỗ trợ đa ngôn ngữ: [Tiếng Việt](README-VI.MD) | [English](README.md)**

---

## ✨ Tính năng nổi bật

- **🚫 Chặn quảng cáo hiệu quả:**
  - Tùy chọn **Xóa hoàn toàn** hoặc **Ẩn** các bài đăng được tài trợ khỏi News Feed.
  - Thống kê số lượng quảng cáo đã chặn.

- **🧹 Lọc nội dung tùy chỉnh:**
  - **Ẩn các thành phần phiền nhiễu:** Dễ dàng ẩn Reels, Video ngắn, Tin (Stories), và các mục Gợi ý (kết bạn, nhóm, trang).
  - **Ẩn toàn bộ News Feed:** Giúp bạn tập trung vào các tính năng khác như Messenger, Groups mà không bị xao nhãng.
  - **Lọc theo cụm từ:** Tự định nghĩa các từ khóa và cụm từ (hỗ trợ đa ngôn ngữ) để ẩn bất kỳ bài đăng nào chứa chúng.

- **🛡️ Lọc bình luận Spam:**
  - Tự động xóa các bình luận chứa từ khóa spam do bạn định nghĩa (ví dụ: "vay tiền", "ib zalo",...).
  - Thống kê số lượng bình luận spam đã loại bỏ.

- **🎨 Tùy chỉnh giao diện:**
  - **Chế độ Sáng/Tối (Light/Dark Mode):** Giao diện popup tự động đồng bộ với cài đặt của bạn.
  - **Giao diện gọn gàng (Compact UI):** Tùy chọn ẩn thanh điều hướng bên trái, thanh bên phải hoặc cả hai để có một giao diện Facebook tối giản.

- **🌐 Hỗ trợ đa ngôn ngữ:**
  - Giao diện tiện ích có thể chuyển đổi linh hoạt giữa **Tiếng Việt** và **Tiếng Anh**.

---

## 🚀 Cài đặt

Để cài đặt tiện ích này từ mã nguồn, hãy làm theo các bước sau:

1.  **Tải mã nguồn:**
    - [Tải dự án này](https://github.com/Let-AI-Cook/Facebook-Extended/archive/refs/heads/main.zip) về dưới dạng tệp `.zip` và giải nén.
    - Hoặc clone repository bằng Git: `git clone https://github.com/Let-AI-Cook/Facebook-Extended.git`

2.  **Mở trang quản lý tiện ích trên trình duyệt:**
    - Gõ `about://extensions` vào thanh địa chỉ và nhấn Enter.

3.  **Bật chế độ nhà phát triển:**
    - Tìm và bật công tắc **"Developer mode"** (Chế độ dành cho nhà phát triển), thường nằm ở góc trên bên phải của trang.

4.  **Tải tiện ích:**
    - Nhấp vào nút **"Load unpacked"** (Tải tiện ích đã giải nén).
    - Chọn thư mục dự án mà bạn vừa giải nén ở bước 1.

Tiện ích **Facebook Extended** sẽ xuất hiện trong danh sách và sẵn sàng để sử dụng!

---

## 📖 Cách sử dụng

1.  Nhấp vào biểu tượng của tiện ích trên thanh công cụ của trình duyệt để mở popup.
2.  **Tab "Chính":** Chứa các công tắc bật/tắt nhanh cho các tính năng chặn phổ biến nhất.
3.  **Tab "Bộ l��c":**
    - **Lọc bình luận:** Bật và thêm các từ khóa bạn muốn lọc.
    - **Lọc nội dung theo cụm từ:** Thêm các cụm từ (phân cách bằng dấu phẩy) vào các ô tương ứng để ẩn các bài đăng chứa chúng. Nhấn **"Lưu bộ lọc"** sau khi thay đổi.
4.  **Tab "Giao diện":**
    - Tùy chỉnh việc ẩn các thanh bên của Facebook.
    - Chọn ngôn ngữ hiển thị cho tiện ích.

---

## 📂 Cấu trúc thư mục

```
/
├── lang/
│   ├── en.json         # Tệp dịch tiếng Anh
│   └── vi.json         # Tệp dịch tiếng Việt
├── icons/              # Chứa các icon của tiện ích
├── background.js       # Xử lý các tác vụ nền
├── content.js          # Chạy trên trang Facebook để thực hiện các thay đổi
├── manifest.json       # Tệp cấu hình của tiện ích
├── phrases.js          # Các cụm từ mặc định để lọc
├── popup.css           # Định dạng giao diện popup
├── popup.html          # Cấu trúc giao diện popup
├── popup.js            # Logic x��� lý cho giao diện popup
└── README.md           # Tệp README chính (tiếng Anh)
└── readme-vi.md        # Chính là tệp này (tiếng Việt)
```

---

## ✍️ Tác giả

- **Facebook:** [@Ki3tNgu](https://www.facebook.com/Ki3tNgu/)
- **GitHub:** [@let-ai-cook](https://github.com/let-ai-cook)
- **Instagram:** [@kiet.gicungbac](https://www.instagram.com/kiet.gicungbac/)

Nếu bạn thấy tiện ích này hữu ích, hãy cân nhắc [ủng hộ tác giả](https://buymeacoffee.com/nobido408x) một ổ bánh mì! 🥖
