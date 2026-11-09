// Presentation only: API status values, permission keys and response contracts stay unchanged.
export const promotionStatus = {
  Draft: 'Bản nháp', Upcoming: 'Sắp diễn ra', Active: 'Đang diễn ra',
  Disabled: 'Đã vô hiệu hóa', Expired: 'Đã kết thúc', Deleted: 'Đã xóa',
};
export const productStatus = { Active: 'Đang hoạt động', Selling: 'Đang bán', StopSelling: 'Ngừng bán', Suspended: 'Tạm ngưng' };

const messages = {
  'Invalid time': 'Thời gian không hợp lệ',
  'Invalid discount value': 'Giá trị giảm giá không hợp lệ',
  'Invalid amount': 'Số tiền không hợp lệ',
  'Invalid amount (maximum 2 decimals)': 'Số tiền không hợp lệ (tối đa 2 chữ số thập phân)',
  'Name is required': 'Vui lòng nhập tên khuyến mãi',
  'Invalid name': 'Tên khuyến mãi không hợp lệ',
  'Maximum 255 characters': 'Tối đa 255 ký tự',
  'Name is required (maximum 255 characters)': 'Vui lòng nhập tên khuyến mãi (tối đa 255 ký tự)',
  'Select a discount type': 'Vui lòng chọn loại giảm giá',
  'Maximum budget must be greater than 0': 'Ngân sách tối đa phải lớn hơn 0',
  'Please check the highlighted fields': 'Vui lòng kiểm tra các trường được đánh dấu',
  'Please select at least 1 product': 'Vui lòng chọn ít nhất 1 sản phẩm',
  'Cannot delete an ongoing promotion. Please stop it first': 'Không thể xóa khuyến mãi đang diễn ra. Vui lòng dừng khuyến mãi trước',
  'Promotion not found': 'Không tìm thấy khuyến mãi',
  'Product is missing or inactive': 'Sản phẩm không tồn tại hoặc đã ngừng hoạt động',
  'Category is missing or inactive': 'Danh mục không tồn tại hoặc đã ngừng hoạt động',
  'This promotion has ended': 'Khuyến mãi này đã kết thúc',
  'Publish the draft before assigning products': 'Vui lòng phát hành bản nháp trước khi gán sản phẩm',
  'Only drafts can be edited here': 'Chỉ có thể chỉnh sửa bản nháp tại đây',
  'Only drafts can be resumed here': 'Chỉ có thể tiếp tục chỉnh sửa bản nháp tại đây',
  'Assignment not found. Category-derived products must be removed through their category link.': 'Không tìm thấy liên kết gán. Với sản phẩm được áp dụng theo danh mục, hãy bỏ gán danh mục tương ứng.',
  'Promotion overlap requires confirmation': 'Vui lòng xác nhận cách xử lý khuyến mãi trùng thời gian',
  'This request key was already used. Start a new submission.': 'Yêu cầu này đã được sử dụng. Vui lòng tải lại trang và gửi yêu cầu mới.',
  'Invalid ID': 'Mã không hợp lệ',
  'Invalid category ID': 'Mã danh mục không hợp lệ',
  'Invalid promotion data': 'Dữ liệu khuyến mãi không hợp lệ',
  'Invalid targets': 'Danh sách gán không hợp lệ',
  'Invalid targets (maximum 1000 per request)': 'Mỗi lần chỉ được chọn tối đa 1.000 sản phẩm hoặc danh mục',
  'Invalid overlap resolution': 'Lựa chọn xử lý trùng khuyến mãi không hợp lệ',
  'Invalid mode': 'Chế độ lưu không hợp lệ',
  'Assigned': 'Đã gán',
  'Kept original; not assigned': 'Giữ khuyến mãi cũ; không gán mới',
  'Paid invoice history preserved': 'Đã giữ nguyên lịch sử hóa đơn đã thanh toán',
  'Other invoice references preserved': 'Đã giữ nguyên các hóa đơn liên quan',
  'No invoice references': 'Không có hóa đơn liên quan',
  'Network Error': 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.',
  'Failed to fetch': 'Không kết nối được máy chủ. Vui lòng thử lại.',
};

export function promotionText(message) {
  if (!message) return '';
  if (messages[message]) return messages[message];
  if (/timeout.*exceeded/i.test(message)) return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
  if (/^[\x00-\x7F]+$/.test(message)) return 'Không thể thực hiện thao tác. Vui lòng thử lại.';
  return message;
}
