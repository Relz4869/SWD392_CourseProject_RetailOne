# Hệ thống Thiết kế RetailOne POS (Design System)

Tài liệu quy chuẩn giao diện, bảng màu ấm xanh lá, typography và quy tắc các component cho RetailOne POS.

---

## 1. Bảng màu (Color Palette)

Hệ thống sử dụng các bề mặt màu phẳng (solid color blocks), không dùng gradient.

### 1.1 Brand & Canvas Tokens
```css
/* Màu thương hiệu */
--brand-900: #1E3932;   /* Nền thanh bên (Sidebar), dải tối */
--brand-700: #006241;   /* Tiêu đề trang, tên hệ thống */
--brand-600: #00754A;   /* Nút chính (CTA), viền focus, liên kết */
--brand-50:  #d4e9e2;   /* Nền nhãn "Đang bán", nền dòng được chọn */

/* Bề mặt & Nền */
--canvas:    #f2f0eb;   /* Nền trang, kem ấm (KHÔNG dùng trắng làm nền trang) */
--surface:   #ffffff;   /* Thẻ, bảng, ô nhập */
--surface-2: #f9f9f9;   /* Dòng bảng khi rê chuột, nền thanh lọc */
--surface-3: #edebe9;   /* Nền hàng tiêu đề bảng */
--border:    #e7e7e7;   /* Kẻ ngang trong bảng, viền thẻ */
--border-strong: #828A8D; /* Viền ô nhập, viền nút phụ (tương phản 3.5:1) */

/* Chữ & Mực (Inks) */
--ink-900:   rgba(0, 0, 0, 0.87); /* Chữ chính */
--ink-600:   rgba(0, 0, 0, 0.58); /* Chữ phụ, metadata */
--ink-400:   rgba(0, 0, 0, 0.38); /* Chỉ cho chữ gợi ý (placeholder) và vô hiệu */
--ink-on-dark:      #ffffff;      /* Chữ trên nền tối */
--ink-on-dark-soft: rgba(255, 255, 255, 0.70); /* Chữ phụ trên nền tối */

/* Cảnh báo & Trạng thái */
--danger:    #c82014;   /* Lỗi, trạng thái nguy hiểm */
--danger-bg: #fdecea;   /* Nền cảnh báo lỗi, ô nhập lỗi */
--gold:      #cba258;   /* CHỈ dùng trên nền tối hoặc làm viền trang trí */
--gold-text: #8A6414;   /* Chữ vàng trên nền sáng (tương phản 5.4:1) */
--gold-bg:   #faf6ee;   /* Nền cảnh báo tạm ngưng, thông tin */
```

### 1.2 Hai màu điều chỉnh vì khả năng tiếp cận (Accessibility WCAG)
1. **Viền ô nhập (`--border-strong: #828A8D`)**: File tham khảo sử dụng `#d6dbde` chỉ đạt tỷ lệ tương phản 1.4:1 so với nền trắng `#ffffff`, không đạt chuẩn WCAG 2.1 AA (yêu cầu tối thiểu 3:1 cho các thành phần điều khiển giao diện). RetailOne dùng `#828A8D` đạt tỷ lệ tương phản **3.5:1**.
2. **Chữ vàng trên nền sáng (`--gold-text: #8A6414`)**: Màu `#cba258` chỉ đạt tương phản 2.37:1 trên nền trắng/kem, gây mờ và khó đọc. RetailOne dùng `#8A6414` đạt tỷ lệ tương phản **5.4:1** trên nền sáng (vượt chuẩn 4.5:1). Màu `#cba258` chỉ giữ lại khi hiển thị trên nền tối (`--brand-900`, đạt 5.25:1).

### 1.3 Nhãn trạng thái (Status Badges)
Nền và chữ luôn đi theo cặp quy định:
- **Đang bán (Selling)**: nền `--brand-50` (`#d4e9e2`), chữ `--brand-700` (`#006241`).
- **Ngừng bán (StopSelling)**: nền `--surface-3` (`#edebe9`), chữ `--ink-600` (`rgba(0,0,0,0.58)`).
- **Tạm ngưng (Suspended)**: nền `--gold-bg` (`#faf6ee`), chữ `--gold-text` (`#8A6414`).
- **Hết hàng**: nền `--danger-bg` (`#fdecea`), chữ `--danger` (`#c82014`).

### 1.4 Chip vai trò người dùng (Header Role Chips)
- **Manager**: nền `--brand-50` (`#d4e9e2`), chữ `--brand-700` (`#006241`).
- **Cashier**: nền `--surface-2` (`#f9f9f9`), chữ `--ink-900` (`rgba(0,0,0,0.87)`).
- **Warehouse Staff**: nền `--gold-bg` (`#faf6ee`), chữ `--gold-text` (`#8A6414`).

---

## 2. Bo góc, Bóng đổ & Hiệu ứng tương tác

### 2.1 Bo góc (Border Radius)
```css
--r-sm: 4px;     /* Nhãn trạng thái, ô đánh dấu checkbox */
--r-md: 8px;     /* Ô nhập, hộp chọn dropdown */
--r-lg: 12px;    /* Thẻ card, bảng dữ liệu, hộp thoại modal */
--r-btn: 999px;  /* Nút dạng viên thuốc (pill button) bo tròn hoàn toàn */
--r-full: 50%;   /* Biểu tượng tròn, avatar */
```

### 2.2 Bóng đổ (Shadow Stacks)
Luôn chồng 2-3 lớp bóng mờ nhẹ, không dùng một lớp bóng đậm duy nhất:
```css
--shadow-card: 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 1px rgba(0, 0, 0, 0.24);
--shadow-nav:  0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 2px rgba(0, 0, 0, 0.06), 0 0 2px rgba(0, 0, 0, 0.07);
--shadow-pop:  0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
```

### 2.3 Hiệu ứng chuyển động (Micro-interactions)
```css
--t-fast: 120ms ease-out;
--t-base: 200ms ease-out;
```
- Khi nhấn nút (`:active:not(:disabled)`): `transform: scale(0.95)`, `transition: all 0.2s ease`.
- Khi người dùng bật chế độ giảm chuyển động (`@media (prefers-reduced-motion: reduce)`): đặt `transition-duration: 0.01ms !important` và `animation-duration: 0.01ms !important`.

---

## 3. Mật độ & Cỡ chữ (POS Density & Typography)

Giao diện phục vụ môi trường làm việc thu ngân / nhân viên kho 8 tiếng mỗi ngày: mật độ dữ liệu dày dặn, số dùng px trực tiếp (không dùng mẹo `font-size: 62.5%`):

- **Font Family**:
  - Chữ chính: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Mã số / Mã vạch: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Cỡ chữ & Line Height**:
  - Tiêu đề màn Login: `32px` / line-height `40px` / weight `700`
  - Tiêu đề trang: `24px` / line-height `32px` / weight `600` (màu `--brand-700`)
  - Tiêu đề thẻ: `18px` / line-height `26px` / weight `600`
  - Nội dung mặc định: `14px` / line-height `20px` / weight `400`
  - Đoạn văn mô tả: `16px` / line-height `24px` / weight `400`
  - Tiêu đề cột bảng: `13px` / line-height `18px` / weight `600` (không viết hoa toàn bộ)
  - Chú thích, thông báo lỗi: `12px` / line-height `16px` / weight `400`
- **Thang khoảng cách (Spacing Scale)**:
  - `--space-1`: `4px`
  - `--space-2`: `8px`
  - `--space-3`: `12px`
  - `--space-4`: `16px`
  - `--space-5`: `24px`
  - `--space-6`: `32px`
  - `--space-7`: `48px`
- **Kích thước thành phần chuẩn**:
  - Thanh bên (Sidebar): rộng `240px`.
  - Thanh tiêu đề (Header): cao `56px`.
  - Hàng tiêu đề bảng: cao `44px`.
  - Dòng dữ liệu bảng: cao `48px`.
  - Nút bấm: cao `40px`, đệm ngang `20px`.
  - Ô nhập liệu: cao `40px`, đệm ngang `12px`.
  - Vùng nội dung chính: đệm `24px`, giới hạn chiều rộng tối đa `1440px`.

---

## 4. Quy tắc cho các Component

### 4.1 Button
- Dạng viên thuốc bo tròn (`border-radius: var(--r-btn)`), cao `40px`, chữ `14px / 600`, nhấn co lại `scale(0.95)`.
- **Primary**: nền `--brand-600`, chữ trắng `--ink-on-dark`, hover chuyển sang `--brand-700`.
- **Secondary**: nền `--surface`, chữ `--ink-900`, viền `1px solid var(--border-strong)`.
- **Ghost**: nền trong suốt, chữ `--brand-600`, hover nền `--brand-50`.
- **Danger**: nền `--danger`, chữ trắng `--ink-on-dark`.
- **Disabled**: độ mờ `opacity: 0.45`, chuột `cursor: not-allowed`, không scale khi click.

### 4.2 Focus Viền toàn hệ thống
- Mọi thành phần tương tác: `:focus-visible { outline: 2px solid var(--brand-600); outline-offset: 2px; }`.
- Tuyệt đối không xóa outline mà không có hiệu ứng thay thế.

### 4.3 Sidebar
- Nền tối `--brand-900`, chữ `--ink-on-dark`.
- Mục đang chọn (Active): nền `rgba(255, 255, 255, 0.10)`, chữ trắng `--ink-on-dark`, thanh viền cạnh trái `3px solid var(--brand-600)`.
- Mục vô hiệu hóa (Sắp có): màu `--ink-on-dark-soft`, độ mờ `0.45`, không thể click.

### 4.4 Header
- Nền trắng `--surface`, bóng đổ `--shadow-nav`, viền đáy `1px solid var(--border)`.
- Hiển thị thông tin người dùng và Chip vai trò chuẩn màu theo mục 1.4.

### 4.5 Bảng dữ liệu (DataTable)
- Khung bảng nền `--surface`, bo góc `--r-lg`, bóng đổ `--shadow-card`.
- Hàng tiêu đề `th`: nền `--surface-3`, dính trên khi cuộn (sticky), cao `44px`, chữ `13px / 600` màu `--ink-900`.
- Dòng dữ liệu: cao `48px`, viền dưới `1px solid var(--border)`. Dòng cuối cùng không có viền đáy.
- Rê chuột trên dòng đổi nền `--surface-2`. Dòng được chọn nền `--brand-50`.
- Cột số (giá bán, tồn kho): canh phải và kích hoạt `font-variant-numeric: tabular-nums`.
- Mã sản phẩm, mã vạch: dùng font monospace.

### 4.6 Ô nhập liệu (Input & FormField)
- Nhãn cố định ở phía trên ô nhập (không dùng nhãn trôi nổi float label).
- Ô nhập nền `--surface`, viền `--border-strong`. Khi focus đổi sang viền `--brand-600`.
- Khi có lỗi (`aria-invalid="true"`): viền `--danger`, nền `--danger-bg` (`#fdecea`).

### 4.7 Trang Đăng nhập (Login Page)
- Bố cục chia đôi:
  - Cột trái (40%): nền `--brand-900`, tên hệ thống "RetailOne POS" chữ trắng lớn `32px / 40px / 700`.
  - Cột phải (60%): nền kem ấm `--canvas`, ở giữa là card đăng nhập nền `--surface` rộng `400px`, đệm `32px`, bo `--r-lg`, bóng `--shadow-card`.

### 4.8 Quy tắc CSS Modules
- Mọi component bắt buộc dùng biến `var(--...)`.
- Tuyệt đối không viết mã màu trực tiếp (hex `#...`) trong các file `.module.css`.
