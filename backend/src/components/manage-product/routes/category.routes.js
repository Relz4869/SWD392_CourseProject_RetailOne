// Owner: PhuNT | UC39
// Tables: Categories
const router = require('express').Router();
const { authenticate } = require('../../auth');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const categoryController = require('../controllers/category.controller');

const createCategorySchema = Object.freeze({
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  parentId: { type: 'integer', min: 1 },
});

// UC39: POST /api/categories (Tạo danh mục mới)
router.post('/', authenticate, protect(PERMISSIONS.CATEGORY_CREATE), validate(createCategorySchema, 'body'), categoryController.create);

// GET /api/categories (Danh sách danh mục dạng cây phẳng)
router.get('/', authenticate, protect(PERMISSIONS.CATEGORY_VIEW), categoryController.list);

// GET /api/categories/options (Lựa chọn danh mục cho bộ lọc)
router.get('/options', authenticate, protect(PERMISSIONS.CATEGORY_VIEW), categoryController.options);

module.exports = router;
