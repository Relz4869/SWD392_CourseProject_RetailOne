// Product errors definitions
const PRODUCT_ERRORS = Object.freeze({
  PRODUCT_NOT_FOUND: { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' },
  CATEGORY_NOT_FOUND: { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Không tìm thấy danh mục' },
});

module.exports = { PRODUCT_ERRORS };
