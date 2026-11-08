# Ghi chú về Schema Database

1. `Staff.userId`: Comment trong SQL nói "Staff may exist without a login (userId NULL)" nhưng định nghĩa cột là `NOT NULL`. Code tuân thủ theo `NOT NULL`.
2. `AuditLogs`: Schema hiện tại chưa có bảng lưu lịch sử audit. Tạm thời log ra console qua `audit.middleware.js`.
3. `InventoryStocks`: Tồn kho hiển thị tạm thời tính theo tổng `quantityOnHand`. Tồn bán được loại trừ hàng hỏng/hết hạn sẽ hoàn thiện khi có component tồn kho.
