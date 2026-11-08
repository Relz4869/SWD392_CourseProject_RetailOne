const asyncHandler = require('../../../shared/utils/asyncHandler');
const { paged } = require('../../../shared/utils/response');
const productService = require('../services/product.service');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.user);
  return paged(res, result);
});

module.exports = {
  create: asyncHandler(async () => notImplemented('UC42')),
  getPrice: asyncHandler(async () => notImplemented('UC46')),
  updatePrice: asyncHandler(async () => notImplemented('UC46')),
  list,
};
