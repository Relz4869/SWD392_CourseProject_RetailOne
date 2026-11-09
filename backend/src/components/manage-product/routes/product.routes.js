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

const updatePriceSchema = Object.freeze({
  salePrice: { type: 'number', required: true, min: 0 },
});

// UC48: GET /api/products
router.get('/', authenticate, protect(PERMISSIONS.PRODUCT_VIEW), validate(listQuerySchema, 'query'), productController.list);

// UC42: POST /api/products
router.post('/', authenticate, protect(PERMISSIONS.PRODUCT_CREATE), validate(createProductSchema, 'body'), audit('PRODUCT_CREATE'), productController.create);

// UC46: GET /api/products/:id/variants/:variantId/price & /api/products/:id/price
router.get('/:id/variants/:variantId/price', authenticate, protect(PERMISSIONS.PRODUCT_PRICE_VIEW), productController.getPrice);
router.get('/:id/price', authenticate, protect(PERMISSIONS.PRODUCT_PRICE_VIEW), productController.getPrice);

// UC46: PUT /api/products/:id/variants/:variantId/price & /api/products/:id/price
router.put(
  '/:id/variants/:variantId/price',
  authenticate,
  protect(PERMISSIONS.PRODUCT_PRICE_UPDATE),
  validate(updatePriceSchema, 'body'),
  audit('PRICE_UPDATE'),
  productController.updatePrice
);
router.put(
  '/:id/price',
  authenticate,
  protect(PERMISSIONS.PRODUCT_PRICE_UPDATE),
  validate(updatePriceSchema, 'body'),
  audit('PRICE_UPDATE'),
  productController.updatePrice
);

module.exports = router;
