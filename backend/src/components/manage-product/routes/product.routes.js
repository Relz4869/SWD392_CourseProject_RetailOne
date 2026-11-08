// Owner: PhuNT | UC42, UC46, UC48
// Tables: Products, ProductVariants, ProductSalePriceHistories
const router = require('express').Router();
const { authenticate } = require('../../auth');
const { protect } = require('../../../shared/middlewares/permission.middleware');
const { validate } = require('../../../shared/middlewares/validate.middleware');
const { audit } = require('../../../shared/middlewares/audit.middleware');
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

const createProductSchema = Object.freeze({
  code: { type: 'string', required: true, pattern: /^[A-Za-z0-9_-]+$/, maxLength: 50 },
  name: { type: 'string', required: true, maxLength: 200 },
  categoryId: { type: 'integer', min: 1 },
  baseUnit: { type: 'string', required: true, maxLength: 20 },
  salePrice: { type: 'number', required: true, min: 0 },
  barcode: { type: 'string', pattern: /^\d+$/, maxLength: 50 },
  unitType: { type: 'string', oneOf: ['PIECE', 'WEIGHT'] },
  minThreshold: { type: 'number', min: 0 },
});

// UC48: GET /api/products
router.get('/', authenticate, protect(PERMISSIONS.PRODUCT_VIEW), validate(listQuerySchema, 'query'), productController.list);

// UC42: POST /api/products
router.post('/', authenticate, protect(PERMISSIONS.PRODUCT_CREATE), validate(createProductSchema, 'body'), audit('PRODUCT_CREATE'), productController.create);
// TODO UC46: GET /:id/variants/:variantId/price -> productController.getPrice
// TODO UC46: PUT /:id/variants/:variantId/price -> productController.updatePrice

module.exports = router;
