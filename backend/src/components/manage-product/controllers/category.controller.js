// Owner: PhuNT | UC39
// Chỉ lấy dữ liệu từ req, gọi service, trả res. Không viết SQL, không gọi repository.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok } = require('../../../shared/utils/response');
const categoryService = require('../services/category.service');

const notImplemented = (uc) => { throw new Error(`Not implemented: ${uc}`); };

const options = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategoryOptions();
  return ok(res, result);
});

module.exports = {
  create: asyncHandler(async () => notImplemented('UC39')),
  options,
};
