// Product & Category errors definitions (spec UC39, UC42, UC48)
const PRODUCT_ERRORS = Object.freeze({
  PRODUCT_NOT_FOUND: { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' },
  CATEGORY_NOT_FOUND: { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Không tìm thấy danh mục' },
  CATEGORY_NAME_EXISTS: { status: 409, code: 'CATEGORY_NAME_EXISTS', message: 'Tên danh mục đã tồn tại trong cùng cấp' },
  CATEGORY_INACTIVE: { status: 400, code: 'CATEGORY_INACTIVE', message: 'Danh mục cha đang ngừng hoạt động' },
  CATEGORY_MAX_DEPTH: { status: 400, code: 'CATEGORY_MAX_DEPTH', message: 'Chỉ hỗ trợ 2 cấp danh mục' },
  PRODUCT_CODE_EXISTS: { status: 409, code: 'PRODUCT_CODE_EXISTS', message: 'Mã sản phẩm đã tồn tại' },
  BARCODE_EXISTS: { status: 409, code: 'BARCODE_EXISTS', message: 'Mã vạch đã tồn tại' },
});

module.exports = { PRODUCT_ERRORS };
