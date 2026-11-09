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
