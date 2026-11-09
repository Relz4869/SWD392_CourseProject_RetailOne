// Owner: PhuNT | UC42, UC46, UC48
// Chỉ lấy dữ liệu từ req, gọi service, trả res. Không viết SQL, không gọi repository.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, paged } = require('../../../shared/utils/response');
const productService = require('../services/product.service');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

const create = asyncHandler(async (req, res) => {
  const result = await productService.createProduct(req.body, req.user);
  return created(res, result);
});

const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.user);
  return paged(res, result);
});

const getPrice = asyncHandler(async (req, res) => {
  const result = await productService.getPrice({
    productId: req.params.id,
    variantId: req.params.variantId,
  });
  return ok(res, result);
});

const updatePrice = asyncHandler(async (req, res) => {
  const result = await productService.updatePrice({
    productId: req.params.id,
    variantId: req.params.variantId,
    salePrice: req.body.salePrice,
  }, req.user);
  return ok(res, result);
});

module.exports = {
  create,
  getPrice,
  updatePrice,
  list,
};
