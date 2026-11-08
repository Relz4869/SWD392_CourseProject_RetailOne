// Owner: PhuNT | UC39
// Chỉ lấy dữ liệu từ req, gọi service, trả res. Không viết SQL, không gọi repository.
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/response');
const categoryService = require('../services/category.service');

const create = asyncHandler(async (req, res) => {
  const result = await categoryService.createCategory(req.body);
  return created(res, result.toJSON ? result.toJSON() : result);
});

const list = asyncHandler(async (req, res) => {
  const result = await categoryService.listCategories();
  return ok(res, result);
});

const options = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategoryOptions();
  return ok(res, result);
});

module.exports = {
  create,
  list,
  options,
};
