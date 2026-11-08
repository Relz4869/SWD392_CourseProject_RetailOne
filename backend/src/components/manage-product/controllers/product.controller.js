// Owner: PhuNT | UC42, UC46, UC48
// Chỉ lấy dữ liệu từ req, gọi service, trả res. Không viết SQL, không gọi repository.
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
