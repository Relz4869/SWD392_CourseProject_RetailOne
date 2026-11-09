const router = require('express').Router();
const { authenticate } = require('../../auth');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const productController = require('../controllers/product.controller');

const listQuerySchema = Object.freeze({
  search: { type: 'string', maxLength: 100 },
  categoryId: { type: 'integer', min: 1 },
  status: { type: 'string', oneOf: ['Selling', 'StopSelling', 'Suspended'] },
  page: { type: 'integer', min: 1 },
  pageSize: { type: 'integer', min: 1, max: 100 },
  sortBy: { type: 'string', oneOf: ['name', 'code', 'createdAt', 'salePrice', 'stock'] },
  sortDir: { type: 'string', oneOf: ['asc', 'desc'] },
});

// UC48: GET /api/products
router.get('/', authenticate, protect(PERMISSIONS.PRODUCT_VIEW), validate(listQuerySchema, 'query'), productController.list);

// TODO UC42: POST / -> productController.create
// TODO UC46: GET /:id/variants/:variantId/price -> productController.getPrice
// TODO UC46: PUT /:id/variants/:variantId/price -> productController.updatePrice

module.exports = router;
